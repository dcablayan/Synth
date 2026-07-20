#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { getLatestReview, reportStem } from '../lib/report-writer';
import { runRevisionGeneration } from '../lib/ai-provider';
import { saveRevisionJSON, saveRevisionMarkdown } from '../lib/report-writer';
import { renderRevisionHTML } from '../lib/html-renderer';
import { saveHTML } from '../lib/pdf-writer';
import { chunkText, extractDocumentTitle } from '../lib/parser';
import { loadDocumentByFilename } from '../lib/document-loader';
import { listRegularFiles, resolveRegularFileInside } from '../lib/path-safety';

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

  // Load the ORIGINAL document for this review. The review's sourceFilename is
  // authoritative; falling back to "whichever inbox file sorts first" would quote
  // clauses from an unrelated document into this revision packet.
  const inboxPath = path.join(process.cwd(), 'documents', 'inbox');
  let documentText = 'Original document text not available.';
  let sourceLoaded = false;

  if (review.sourceFilename) {
    try {
      documentText = chunkText((await loadDocumentByFilename(review.sourceFilename)).text);
      sourceLoaded = true;
      console.log(`  Source document: ${review.sourceFilename}`);
    } catch (e) {
      console.warn(`  ⚠️  Could not load source document "${review.sourceFilename}": ${e instanceof Error ? e.message : e}`);
    }
  }

  if (!sourceLoaded) {
    // Older reviews lack sourceFilename — match an inbox file by extracted title.
    try {
      const files = listRegularFiles(inboxPath, (f) => f.endsWith('.txt') || f.endsWith('.md'));
      for (const f of files) {
        const sourcePath = resolveRegularFileInside(inboxPath, f, 'revision source document');
        const text = fs.readFileSync(sourcePath, 'utf-8');
        if (extractDocumentTitle(text, f) === review.documentTitle) {
          documentText = chunkText(text);
          sourceLoaded = true;
          console.log(`  Source document matched by title: ${f}`);
          break;
        }
      }
    } catch {}
  }

  if (!sourceLoaded) {
    console.warn('  ⚠️  Source document not found in inbox — original clause language will be marked "Not found in the document."');
  }

  console.log(`📄 Generating revision packet for: ${review.documentTitle}`);
  console.log('  → Generating clause revisions...');

  const revision = await runRevisionGeneration(documentText, review);

  const revJsonPath = saveRevisionJSON(revision);
  const revMdPath = saveRevisionMarkdown(revision);
  const slug = reportStem(review.documentTitle, review.sourceFilename);
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
