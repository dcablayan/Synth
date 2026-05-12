#!/usr/bin/env tsx
import fs from 'fs';
import { getLatestReview } from '../lib/report-writer';
import { runRevisionGeneration } from '../lib/ai-provider';
import { saveRevisionJSON, saveRevisionMarkdown } from '../lib/report-writer';
import { renderRevisionHTML } from '../lib/html-renderer';
import { saveHTML } from '../lib/pdf-writer';
import { chunkText } from '../lib/parser';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Revision Packet Generator      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Suggested revisions are NOT legal advice.');
  console.log('   They are suggested language for review by a qualified professional.\n');

  const review = getLatestReview();
  if (!review) {
    console.error('❌ No review found. Run: npm run analyze first.');
    process.exit(1);
  }

  // Load original document text if available
  const inboxPath = process.cwd() + '/documents/inbox';
  let documentText = 'Original document text not available.';
  try {
    const files = fs.readdirSync(inboxPath).filter((f) => f.endsWith('.txt') || f.endsWith('.md'));
    if (files.length > 0) {
      documentText = chunkText(fs.readFileSync(`${inboxPath}/${files[0]}`, 'utf-8'));
    }
  } catch {}

  console.log(`📄 Generating revision packet for: ${review.documentTitle}`);
  console.log('  → Generating clause revisions...');

  const revision = await runRevisionGeneration(documentText, review);

  const revJsonPath = saveRevisionJSON(revision);
  const revMdPath = saveRevisionMarkdown(revision);
  const slug = review.documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  const revHtmlPath = saveHTML(renderRevisionHTML(revision), `${slug}-revision`);

  console.log(`\n✅ Revision packet generated:`);
  console.log(`   JSON:     ${revJsonPath}`);
  console.log(`   Markdown: ${revMdPath}`);
  console.log(`   HTML:     ${revHtmlPath}`);
  console.log(`\n   ${revision.clauseRevisions.length} clause revision(s) generated.`);
  console.log(`\n⚠️  ${revision.revisionDisclaimer}`);
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
