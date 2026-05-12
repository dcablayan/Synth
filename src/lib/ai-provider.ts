import { ReviewSchema } from '../schemas/review.schema';
import { FinancialSchema } from '../schemas/financial.schema';
import { MemoSchema } from '../schemas/memo.schema';
import { RevisionSchema } from '../schemas/revision.schema';
import {
  buildContractReviewPrompt,
  CONTRACT_REVIEW_SYSTEM,
} from '../prompts/contract-review.prompt';
import {
  buildFinancialAnalysisPrompt,
  FINANCIAL_ANALYSIS_SYSTEM,
} from '../prompts/financial-analysis.prompt';
import { buildMemoPrompt, MEMO_SYSTEM } from '../prompts/memo.prompt';
import { buildRevisionPrompt, REVISION_SYSTEM } from '../prompts/revision.prompt';
import {
  generateMockReview,
  generateMockFinancial,
  generateMockMemo,
  generateMockRevision,
} from './mock-provider';

const DISCLAIMER =
  'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

function isMockMode(): boolean {
  return !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;
}

async function callOpenAI(system: string, prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

export async function runContractReview(documentText: string, documentTitle: string) {
  if (isMockMode()) {
    console.log('  [mock mode] Using mock provider — set OPENAI_API_KEY to use real AI');
    const result = generateMockReview(documentText, documentTitle);
    return ReviewSchema.parse({ ...result, disclaimer: DISCLAIMER });
  }

  const prompt = buildContractReviewPrompt(documentText, documentTitle);
  const raw = await callOpenAI(CONTRACT_REVIEW_SYSTEM, prompt);
  const parsed = JSON.parse(raw);
  return ReviewSchema.parse({ ...parsed, generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER });
}

export async function runFinancialAnalysis(documentText: string, documentTitle: string) {
  if (isMockMode()) {
    const result = generateMockFinancial(documentText, documentTitle);
    return FinancialSchema.parse(result);
  }

  const prompt = buildFinancialAnalysisPrompt(documentText, documentTitle);
  const raw = await callOpenAI(FINANCIAL_ANALYSIS_SYSTEM, prompt);
  const parsed = JSON.parse(raw);
  return FinancialSchema.parse({ ...parsed, generatedAt: new Date().toISOString(), disclaimer: DISCLAIMER });
}

export async function runMemoGeneration(review: Awaited<ReturnType<typeof runContractReview>>) {
  if (isMockMode()) {
    const result = generateMockMemo(review);
    return MemoSchema.parse(result);
  }

  const prompt = buildMemoPrompt(JSON.stringify(review, null, 2), review.documentTitle);
  const raw = await callOpenAI(MEMO_SYSTEM, prompt);
  const parsed = JSON.parse(raw);
  return MemoSchema.parse({
    ...parsed,
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  });
}

export async function runRevisionGeneration(
  documentText: string,
  review: Awaited<ReturnType<typeof runContractReview>>
) {
  if (isMockMode()) {
    const result = generateMockRevision(documentText, review);
    return RevisionSchema.parse(result);
  }

  const prompt = buildRevisionPrompt(documentText, JSON.stringify(review, null, 2), review.documentTitle);
  const raw = await callOpenAI(REVISION_SYSTEM, prompt);
  const parsed = JSON.parse(raw);
  return RevisionSchema.parse({
    ...parsed,
    generatedAt: new Date().toISOString(),
    revisionDisclaimer:
      'Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language.',
  });
}

export { isMockMode };
