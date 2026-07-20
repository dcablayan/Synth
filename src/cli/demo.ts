#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { extractDocumentTitle, chunkText } from '../lib/parser';
import { runContractReview, runFinancialAnalysis, runMemoGeneration, runRevisionGeneration } from '../lib/ai-provider';
import { saveReviewJSON, saveReviewMarkdown, saveFinancialJSON, saveMemoJSON, saveMemoMarkdown, saveRevisionJSON, saveRevisionMarkdown } from '../lib/report-writer';
import { renderReviewHTML, renderFinancialHTML, renderMemoHTML, renderRevisionHTML } from '../lib/html-renderer';
import { saveHTML, generatePDFFromHTML } from '../lib/pdf-writer';
import { resolveRegularFileInside, safeFileStem } from '../lib/path-safety';

const INBOX = path.join(process.cwd(), 'documents', 'inbox');
const SAMPLES = [
  'sample-saas-agreement.txt',
  'sample-term-sheet.txt',
  'sample-contractor-agreement.txt',
];

async function processSample(filename: string) {
  let filepath: string;
  try {
    filepath = resolveRegularFileInside(INBOX, filename, 'demo sample');
  } catch {
    console.log(`  ⚠️  Sample not found: ${filename}`);
    return;
  }

  const fullText = fs.readFileSync(filepath, 'utf-8');
  const text = chunkText(fullText);
  const title = extractDocumentTitle(text, filename);
  const slug = safeFileStem(filename);
  const meta = {
    sourceFilename: filename,
    sourceExtension: path.extname(filename),
    parsedCharacterCount: text.length,
    originalCharacterCount: fullText.length,
  };

  console.log(`\n  📄 ${filename}`);
  console.log(`     Title: ${title}`);

  // Review
  process.stdout.write('     → Review...');
  const review = await runContractReview(text, title, meta);
  saveReviewJSON(review);
  saveReviewMarkdown(review);
  const reviewHtml = renderReviewHTML(review);
  saveHTML(reviewHtml, `${slug}-review`);
  console.log(` ✅ Risk: ${review.riskLevel} (${review.riskScore})`);

  // Financial
  process.stdout.write('     → Financial...');
  const financial = await runFinancialAnalysis(text, title, meta);
  saveFinancialJSON(financial);
  const financialHtml = renderFinancialHTML(financial);
  saveHTML(financialHtml, `${slug}-financial`);
  console.log(' ✅');

  // Memo
  process.stdout.write('     → Memo...');
  const memo = await runMemoGeneration(review);
  saveMemoJSON(memo);
  saveMemoMarkdown(memo);
  const memoHtml = renderMemoHTML(memo);
  saveHTML(memoHtml, `${slug}-memo`);
  console.log(' ✅');

  // Revision
  process.stdout.write('     → Revision...');
  const revision = await runRevisionGeneration(text, review);
  saveRevisionJSON(revision);
  saveRevisionMarkdown(revision);
  const revisionHtml = renderRevisionHTML(revision);
  saveHTML(revisionHtml, `${slug}-revision`);
  console.log(' ✅');

  // PDF
  process.stdout.write('     → PDFs...');
  try {
    await generatePDFFromHTML(reviewHtml, `${slug}-review`);
    await generatePDFFromHTML(memoHtml, `${slug}-memo`);
    await generatePDFFromHTML(revisionHtml, `${slug}-revision`);
    console.log(' ✅');
  } catch {
    console.log(' ⚠️  (run: npx playwright install chromium for PDF support)');
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Demo Mode                      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.');
  console.log('   It is a document review aid. Consult a qualified professional.\n');
  console.log('Running full demo on all sample documents...\n');

  for (const sample of SAMPLES) {
    await processSample(sample);
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           ✅ Demo Complete                        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\nOutputs saved to:');
  console.log('  reports/reviews/    — JSON + Markdown reviews');
  console.log('  reports/financials/ — Financial JSON');
  console.log('  reports/memos/      — Memo JSON + Markdown');
  console.log('  reports/revisions/  — Revision JSON + Markdown');
  console.log('  reports/html/       — HTML reports');
  console.log('  reports/pdfs/       — PDFs (if Playwright installed)');
  console.log('\nNext steps:');
  console.log('  npm run dashboard   — Open local dashboard');
  console.log('  npm run packet      — Run full packet on your own documents\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
