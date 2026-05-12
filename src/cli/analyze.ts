#!/usr/bin/env tsx
import path from 'path';
import { loadDocumentsFromInbox } from '../lib/document-loader';
import { extractDocumentTitle, chunkText } from '../lib/parser';
import { runContractReview, runFinancialAnalysis } from '../lib/ai-provider';
import { saveReviewJSON, saveReviewMarkdown, saveFinancialJSON } from '../lib/report-writer';
import { renderReviewHTML, renderFinancialHTML } from '../lib/html-renderer';
import { saveHTML } from '../lib/pdf-writer';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Document Analyzer              ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n   It is a document review aid.\n');

  let docs;
  try {
    docs = await loadDocumentsFromInbox();
  } catch (e) {
    console.error(`❌ ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  console.log(`Found ${docs.length} document(s) to analyze.\n`);

  for (const doc of docs) {
    console.log(`─────────────────────────────────────────────────`);
    console.log(`📄 ${doc.filename}`);

    const title = extractDocumentTitle(doc.text, doc.filename);
    const text = chunkText(doc.text);

    console.log(`  → Running contract review...`);
    let review;
    try {
      review = await runContractReview(text, title);
    } catch (e) {
      console.error(`  ❌ Review failed: ${e instanceof Error ? e.message : e}`);
      continue;
    }

    const reviewJsonPath = saveReviewJSON(review);
    const reviewMdPath = saveReviewMarkdown(review);
    const reviewHtmlPath = saveHTML(
      renderReviewHTML(review),
      `${path.basename(doc.filename, path.extname(doc.filename))}-review`
    );

    console.log(`  ✅ Review: Risk ${review.riskLevel} (${review.riskScore}/100)`);
    console.log(`     JSON:     ${reviewJsonPath}`);
    console.log(`     Markdown: ${reviewMdPath}`);
    console.log(`     HTML:     ${reviewHtmlPath}`);

    console.log(`  → Running financial analysis...`);
    let financial;
    try {
      financial = await runFinancialAnalysis(text, title);
    } catch (e) {
      console.error(`  ❌ Financial analysis failed: ${e instanceof Error ? e.message : e}`);
      continue;
    }

    const financialJsonPath = saveFinancialJSON(financial);
    const financialHtmlPath = saveHTML(
      renderFinancialHTML(financial),
      `${path.basename(doc.filename, path.extname(doc.filename))}-financial`
    );

    console.log(`  ✅ Financial analysis complete`);
    console.log(`     JSON: ${financialJsonPath}`);
    console.log(`     HTML: ${financialHtmlPath}`);
    console.log();
  }

  console.log('✅ Analysis complete.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
