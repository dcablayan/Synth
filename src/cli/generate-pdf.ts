#!/usr/bin/env tsx
import path from 'path';
import {
  getLatestReview,
  getLatestMemo,
  getLatestRevision,
  getLatestFinancial,
  matchesReview,
  reportStem,
} from '../lib/report-writer';
import { renderReviewHTML, renderFinancialHTML, renderMemoHTML, renderRevisionHTML } from '../lib/html-renderer';
import { generatePDFFromHTML, saveHTML } from '../lib/pdf-writer';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

async function tryGeneratePDF(
  html: string,
  name: string,
  label: string
): Promise<void> {
  const htmlPath = saveHTML(html, name);
  console.log(`  ✅ HTML saved: ${htmlPath}`);
  try {
    const { pdfPath } = await generatePDFFromHTML(html, name);
    console.log(`  ✅ PDF saved:  ${pdfPath}`);
  } catch (e) {
    console.log(`  ⚠️  PDF failed for ${label}: ${e instanceof Error ? e.message : e}`);
    console.log(`     HTML is still available at: ${htmlPath}`);
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · PDF Generator                  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n   It is a document review aid.\n');

  const review = getLatestReview();
  if (!review) {
    console.error('❌ No review found. Run: npm run analyze first.');
    process.exit(1);
  }

  // Only bundle artifacts that belong to the same document as the review.
  const memo = matchesReview(review, getLatestMemo(), 'memo');
  const revision = matchesReview(review, getLatestRevision(), 'revision packet');
  const financial = matchesReview(review, getLatestFinancial(), 'financial analysis');

  const slug = reportStem(review.documentTitle, review.sourceFilename);

  // Contract Review PDF
  console.log('📄 Generating Contract Review PDF...');
  await tryGeneratePDF(renderReviewHTML(review), `${slug}-review`, 'contract review');

  // Financial Analysis PDF
  if (financial) {
    console.log('\n📊 Generating Financial Analysis PDF...');
    await tryGeneratePDF(renderFinancialHTML(financial), `${slug}-financial`, 'financial analysis');
  } else {
    console.log('\n⚠️  No financial analysis found. Run: npm run analyze');
  }

  // Memo PDF
  if (memo) {
    console.log('\n📋 Generating Memo PDF...');
    await tryGeneratePDF(renderMemoHTML(memo), `${slug}-memo`, 'memo');
  } else {
    console.log('\n⚠️  No memo found. Run: npm run memo');
  }

  // Revision PDF
  if (revision) {
    console.log('\n✏️  Generating Revision Packet PDF...');
    await tryGeneratePDF(renderRevisionHTML(revision), `${slug}-revision`, 'revision packet');
  } else {
    console.log('\n⚠️  No revision packet found. Run: npm run revise');
  }

  console.log('\n✅ PDF generation complete.');
  console.log(`   PDFs: ${path.join(REPORTS_DIR, 'pdfs')}`);
  console.log(`   HTML: ${path.join(REPORTS_DIR, 'html')}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
