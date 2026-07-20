#!/usr/bin/env tsx
import { execSync } from 'child_process';
import {
  getLatestReview,
  getLatestMemo,
  getLatestRevision,
  getLatestFinancial,
  matchesReview,
  reportStem,
} from '../lib/report-writer';
import { renderFullPacketHTML } from '../lib/html-renderer';
import { generatePDFFromHTML } from '../lib/pdf-writer';

function run(script: string, label: string) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Running: ${label}`);
  console.log('─'.repeat(50));
  execSync(`tsx src/cli/${script}.ts`, { stdio: 'inherit' });
}

async function generateFullPacket() {
  const review = getLatestReview();
  if (!review) {
    console.log('\n  ⚠️  No review found — skipping full packet PDF.');
    return;
  }

  const financial = matchesReview(review, getLatestFinancial(), 'financial analysis');
  const memo = matchesReview(review, getLatestMemo(), 'memo');
  const revision = matchesReview(review, getLatestRevision(), 'revision packet');

  const slug = reportStem(review.documentTitle, review.sourceFilename);
  const packetName = `${slug}-full-packet`;

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Generating: Full Review Packet PDF`);
  console.log('─'.repeat(50));

  try {
    const html = renderFullPacketHTML(review, financial, memo, revision);
    const { pdfPath } = await generatePDFFromHTML(html, packetName);
    console.log(`  ✅ Full packet PDF: ${pdfPath}`);
  } catch (e) {
    console.log(`  ⚠️  Full packet PDF failed: ${e instanceof Error ? e.message : e}`);
    console.log(`     HTML is still saved to reports/html/${packetName}.html`);
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Full Packet Generator          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.');
  console.log('   It is a document review aid. Consult a qualified professional.\n');
  console.log('Running full pipeline: analyze → memo → revise → pdf → full-packet\n');

  try {
    run('analyze', 'Document Analysis');
    run('memo', 'Memo Generation');
    run('revise', 'Revision Packet');
    run('generate-pdf', 'Individual PDFs');

    await generateFullPacket();

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║           ✅ Full Packet Complete                 ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
    console.log('Output folders:');
    console.log('  reviews:    reports/reviews/');
    console.log('  memos:      reports/memos/');
    console.log('  financials: reports/financials/');
    console.log('  revisions:  reports/revisions/');
    console.log('  html:       reports/html/');
    console.log('  pdfs:       reports/pdfs/');
    console.log('\nKey outputs:');

    const review = getLatestReview();
    if (review) {
      const slug = reportStem(review.documentTitle, review.sourceFilename);
      console.log(`  Full packet: reports/pdfs/${slug}-full-packet.pdf`);
    }
    console.log();
  } catch (e) {
    console.error(`\n❌ Packet generation failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
