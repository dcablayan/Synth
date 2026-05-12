#!/usr/bin/env tsx
import { getLatestReview } from '../lib/report-writer';
import { runMemoGeneration } from '../lib/ai-provider';
import { saveMemoJSON, saveMemoMarkdown } from '../lib/report-writer';
import { renderMemoHTML } from '../lib/html-renderer';
import { saveHTML } from '../lib/pdf-writer';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Memo Generator                 ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n   It is a document review aid.\n');

  const review = getLatestReview();
  if (!review) {
    console.error('❌ No review found. Run: npm run analyze first.');
    process.exit(1);
  }

  console.log(`📄 Generating memo for: ${review.documentTitle}`);
  console.log('  → Generating executive memo...');

  const memo = await runMemoGeneration(review);

  const memoJsonPath = saveMemoJSON(memo);
  const memoMdPath = saveMemoMarkdown(memo);
  const memoHtmlPath = saveHTML(
    renderMemoHTML(memo),
    `${review.documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}-memo`
  );

  console.log(`\n✅ Memo generated:`);
  console.log(`   JSON:     ${memoJsonPath}`);
  console.log(`   Markdown: ${memoMdPath}`);
  console.log(`   HTML:     ${memoHtmlPath}`);
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
