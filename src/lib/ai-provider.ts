import fs from 'fs';
import path from 'path';
import { z } from 'zod';
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

export function isMockMode(): boolean {
  return !process.env.OPENAI_API_KEY;
}

function saveError(context: string, raw: string, error: unknown): void {
  try {
    const errDir = path.join(process.cwd(), 'reports', 'errors');
    if (!fs.existsSync(errDir)) fs.mkdirSync(errDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(errDir, `${context}-${ts}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify(
        { context, error: error instanceof Error ? error.message : String(error), rawOutput: raw, savedAt: new Date().toISOString() },
        null,
        2
      )
    );
  } catch {
    // never crash the main flow due to error logging
  }
}

function safeParseAndValidate<T>(
  schema: z.ZodType<T>,
  raw: string,
  context: string
): { data: T; fallbackUsed: false } | { data: null; fallbackUsed: true; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    saveError(context, raw, e);
    return { data: null, fallbackUsed: true, error: `JSON parse failed: ${e instanceof Error ? e.message : e}` };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    saveError(context, raw, result.error);
    return { data: null, fallbackUsed: true, error: `Schema validation failed: ${result.error.message}` };
  }

  return { data: result.data, fallbackUsed: false };
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

export interface ProviderMeta {
  sourceFilename?: string;
  sourceExtension?: string;
  parsedCharacterCount?: number;
}

export async function runContractReview(documentText: string, documentTitle: string, meta?: ProviderMeta) {
  const charCount = documentText.length;
  const baseMeta = {
    sourceFilename: meta?.sourceFilename,
    sourceExtension: meta?.sourceExtension,
    parsedCharacterCount: meta?.parsedCharacterCount ?? charCount,
  };

  if (isMockMode()) {
    console.log('  [mock mode] Using mock provider — set OPENAI_API_KEY to use real AI');
    const result = generateMockReview(documentText, documentTitle);
    return ReviewSchema.parse({ ...result, ...baseMeta, providerMode: 'mock', fallbackUsed: false, disclaimer: DISCLAIMER });
  }

  try {
    const prompt = buildContractReviewPrompt(documentText, documentTitle);
    const raw = await callOpenAI(CONTRACT_REVIEW_SYSTEM, prompt);
    const parsed = safeParseAndValidate(ReviewSchema, raw, 'contract-review');

    if (parsed.fallbackUsed) {
      console.warn(`  [ai-provider] Falling back to mock: ${parsed.error}`);
      const result = generateMockReview(documentText, documentTitle);
      return ReviewSchema.parse({
        ...result,
        ...baseMeta,
        providerMode: 'mock',
        fallbackUsed: true,
        warnings: [`AI output failed validation, used mock fallback: ${parsed.error}`],
        disclaimer: DISCLAIMER,
      });
    }

    return ReviewSchema.parse({
      ...parsed.data,
      ...baseMeta,
      generatedAt: new Date().toISOString(),
      providerMode: 'ai',
      fallbackUsed: false,
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    saveError('contract-review-api', '', e);
    console.warn(`  [ai-provider] API call failed, using mock fallback: ${msg}`);
    const result = generateMockReview(documentText, documentTitle);
    return ReviewSchema.parse({
      ...result,
      ...baseMeta,
      providerMode: 'mock',
      fallbackUsed: true,
      warnings: [`AI API call failed, used mock fallback: ${msg}`],
      disclaimer: DISCLAIMER,
    });
  }
}

export async function runFinancialAnalysis(documentText: string, documentTitle: string, meta?: ProviderMeta) {
  const charCount = documentText.length;
  const baseMeta = {
    sourceFilename: meta?.sourceFilename,
    sourceExtension: meta?.sourceExtension,
    parsedCharacterCount: meta?.parsedCharacterCount ?? charCount,
  };

  if (isMockMode()) {
    const result = generateMockFinancial(documentText, documentTitle);
    return FinancialSchema.parse({ ...result, ...baseMeta, providerMode: 'mock', fallbackUsed: false });
  }

  try {
    const prompt = buildFinancialAnalysisPrompt(documentText, documentTitle);
    const raw = await callOpenAI(FINANCIAL_ANALYSIS_SYSTEM, prompt);
    const parsed = safeParseAndValidate(FinancialSchema, raw, 'financial-analysis');

    if (parsed.fallbackUsed) {
      console.warn(`  [ai-provider] Falling back to mock: ${parsed.error}`);
      const result = generateMockFinancial(documentText, documentTitle);
      return FinancialSchema.parse({
        ...result,
        ...baseMeta,
        providerMode: 'mock',
        fallbackUsed: true,
        warnings: [`AI output failed validation, used mock fallback: ${parsed.error}`],
      });
    }

    return FinancialSchema.parse({
      ...parsed.data,
      ...baseMeta,
      generatedAt: new Date().toISOString(),
      providerMode: 'ai',
      fallbackUsed: false,
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    saveError('financial-analysis-api', '', e);
    console.warn(`  [ai-provider] API call failed, using mock fallback: ${msg}`);
    const result = generateMockFinancial(documentText, documentTitle);
    return FinancialSchema.parse({
      ...result,
      ...baseMeta,
      providerMode: 'mock',
      fallbackUsed: true,
      warnings: [`AI API call failed, used mock fallback: ${msg}`],
    });
  }
}

export async function runMemoGeneration(review: Awaited<ReturnType<typeof runContractReview>>) {
  const baseMeta = {
    sourceFilename: review.sourceFilename,
    sourceExtension: review.sourceExtension,
    parsedCharacterCount: review.parsedCharacterCount,
  };

  if (isMockMode()) {
    const result = generateMockMemo(review);
    return MemoSchema.parse({ ...result, ...baseMeta, providerMode: 'mock', fallbackUsed: false });
  }

  try {
    const prompt = buildMemoPrompt(JSON.stringify(review, null, 2), review.documentTitle);
    const raw = await callOpenAI(MEMO_SYSTEM, prompt);
    const parsed = safeParseAndValidate(MemoSchema, raw, 'memo-generation');

    if (parsed.fallbackUsed) {
      console.warn(`  [ai-provider] Falling back to mock: ${parsed.error}`);
      const result = generateMockMemo(review);
      return MemoSchema.parse({
        ...result,
        ...baseMeta,
        providerMode: 'mock',
        fallbackUsed: true,
        warnings: [`AI output failed validation, used mock fallback: ${parsed.error}`],
        disclaimer: DISCLAIMER,
      });
    }

    return MemoSchema.parse({
      ...parsed.data,
      ...baseMeta,
      generatedAt: new Date().toISOString(),
      providerMode: 'ai',
      fallbackUsed: false,
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    saveError('memo-generation-api', '', e);
    console.warn(`  [ai-provider] API call failed, using mock fallback: ${msg}`);
    const result = generateMockMemo(review);
    return MemoSchema.parse({
      ...result,
      ...baseMeta,
      providerMode: 'mock',
      fallbackUsed: true,
      warnings: [`AI API call failed, used mock fallback: ${msg}`],
      disclaimer: DISCLAIMER,
    });
  }
}

export async function runRevisionGeneration(
  documentText: string,
  review: Awaited<ReturnType<typeof runContractReview>>
) {
  const baseMeta = {
    sourceFilename: review.sourceFilename,
    sourceExtension: review.sourceExtension,
    parsedCharacterCount: review.parsedCharacterCount,
  };

  if (isMockMode()) {
    const result = generateMockRevision(documentText, review);
    return RevisionSchema.parse({ ...result, ...baseMeta, providerMode: 'mock', fallbackUsed: false });
  }

  try {
    const prompt = buildRevisionPrompt(documentText, JSON.stringify(review, null, 2), review.documentTitle);
    const raw = await callOpenAI(REVISION_SYSTEM, prompt);
    const parsed = safeParseAndValidate(RevisionSchema, raw, 'revision-generation');

    if (parsed.fallbackUsed) {
      console.warn(`  [ai-provider] Falling back to mock: ${parsed.error}`);
      const result = generateMockRevision(documentText, review);
      return RevisionSchema.parse({
        ...result,
        ...baseMeta,
        providerMode: 'mock',
        fallbackUsed: true,
        warnings: [`AI output failed validation, used mock fallback: ${parsed.error}`],
        revisionDisclaimer:
          'Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language.',
      });
    }

    return RevisionSchema.parse({
      ...parsed.data,
      ...baseMeta,
      generatedAt: new Date().toISOString(),
      providerMode: 'ai',
      fallbackUsed: false,
      revisionDisclaimer:
        'Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    saveError('revision-generation-api', '', e);
    console.warn(`  [ai-provider] API call failed, using mock fallback: ${msg}`);
    const result = generateMockRevision(documentText, review);
    return RevisionSchema.parse({
      ...result,
      ...baseMeta,
      providerMode: 'mock',
      fallbackUsed: true,
      warnings: [`AI API call failed, used mock fallback: ${msg}`],
      revisionDisclaimer:
        'Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language.',
    });
  }
}
