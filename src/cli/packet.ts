#!/usr/bin/env tsx
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getLatestReview, getLatestMemo, getLatestRevision } from '../lib/report-writer';
import { renderFullPacketHTML } from '../lib/html-renderer';
import { generatePDFFromHTML } from '../lib/pdf-writer';
import type { Financial } from '../schemas/financial.schema';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

function getLatestFinancial(): Financial | null {
  const dir = path.join(REPORTS_DIR, 'financials');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('-financial.json'));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const sa = fs.statSync(path.join(dir, a)).mtime.getTime();
    const sb = fs.statSync(path.join(dir, b)).mtime.getTime();
    return sb - sa;
  });
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8')) as Financial;
}

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

  const financial = getLatestFinancial();
  const memo = getLatestMemo();
  const revision = getLatestRevision();

  const slug = review.documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
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
      const slug = review.documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
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
