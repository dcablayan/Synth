#!/usr/bin/env tsx
import { execSync } from 'child_process';

function run(script: string, label: string) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🔹 Running: ${label}`);
  console.log('─'.repeat(50));
  execSync(`tsx src/cli/${script}.ts`, { stdio: 'inherit' });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Full Packet Generator          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.');
  console.log('   It is a document review aid. Consult a qualified professional.\n');
  console.log('Running full pipeline: analyze → memo → revise → pdf\n');

  try {
    run('analyze', 'Document Analysis');
    run('memo', 'Memo Generation');
    run('revise', 'Revision Packet');
    run('generate-pdf', 'PDF Generation');

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║           ✅ Full Packet Complete                 ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
    console.log('Output folders:');
    console.log('  reviews:   reports/reviews/');
    console.log('  memos:     reports/memos/');
    console.log('  financials: reports/financials/');
    console.log('  revisions: reports/revisions/');
    console.log('  html:      reports/html/');
    console.log('  pdfs:      reports/pdfs/\n');
  } catch (e) {
    console.error(`\n❌ Packet generation failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
