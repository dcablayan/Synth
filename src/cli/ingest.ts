#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const INBOX = path.join(CWD, 'documents', 'inbox');
const TABLES_DIR = path.join(CWD, 'reports', 'tables');

const ALL_EXTS = ['.txt', '.md', '.pdf', '.docx', '.csv', '.xlsx'];
const SPREADSHEET_EXTS = ['.csv', '.xlsx'];

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Ingest                         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n');

  if (!fs.existsSync(INBOX)) {
    console.error(`  ❌ Inbox not found: ${INBOX}`);
    process.exit(1);
  }

  const files = fs.readdirSync(INBOX).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ALL_EXTS.includes(ext) && !f.startsWith('.');
  });

  if (files.length === 0) {
    console.log(`  No supported files found in ${INBOX}`);
    console.log(`  Supported: ${ALL_EXTS.join(', ')}`);
    process.exit(0);
  }

  console.log(`  Found ${files.length} file(s) in ${INBOX}\n`);

  const { parseCsvFile, parseXlsxFile, buildTableProfile, textSummaryOfSheet } = await import('../lib/spreadsheet-parser');
  fs.mkdirSync(TABLES_DIR, { recursive: true });

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    const filepath = path.join(INBOX, filename);
    const slug = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');

    if (SPREADSHEET_EXTS.includes(ext)) {
      try {
        console.log(`  📊 Ingesting spreadsheet: ${filename}`);
        const sheets = ext === '.csv' ? parseCsvFile(filepath) : parseXlsxFile(filepath);
        const profiles = sheets.map((s) => buildTableProfile(s));
        const summaryText = sheets.map((s, i) => textSummaryOfSheet(s, profiles[i])).join('\n\n---\n\n');

        const outJson = path.join(TABLES_DIR, `${slug}-profile.json`);
        const outMd = path.join(TABLES_DIR, `${slug}-profile.md`);
        fs.writeFileSync(outJson, JSON.stringify({ filename, sheets: profiles }, null, 2));
        fs.writeFileSync(outMd, `# Spreadsheet Profile: ${filename}\n\n${summaryText}`);

        console.log(`     ✅ Profiles saved → reports/tables/${slug}-profile.{json,md}`);
        for (const p of profiles) {
          const flags = [
            p.isPaymentSchedule && 'payment-schedule',
            p.isCapTable && 'cap-table',
            p.isInvoice && 'invoice',
            p.isVendorList && 'vendor-list',
          ].filter(Boolean);
          console.log(`     Sheet "${p.sheetName}": ${p.rowCount} rows, ${p.columnCount} cols${flags.length > 0 ? ` [${flags.join(', ')}]` : ''}`);
          if (p.warnings.length > 0) console.log(`     ⚠️  ${p.warnings.join(' | ')}`);
        }
      } catch (err) {
        console.error(`  ❌ Skipping ${filename}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      try {
        console.log(`  📄 Ingesting document: ${filename}`);
        const { extractDocumentTitle, detectDocumentType, chunkText } = await import('../lib/parser');
        let text = '';
        if (ext === '.txt' || ext === '.md') {
          text = fs.readFileSync(filepath, 'utf-8');
        } else if (ext === '.pdf') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
          const result = await pdfParse(fs.readFileSync(filepath));
          text = result.text;
        } else if (ext === '.docx') {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ path: filepath });
          text = result.value;
        }
        const title = extractDocumentTitle(text, filename);
        const docType = detectDocumentType(chunkText(text));
        console.log(`     ✅ Parsed: "${title}" [${docType}] — ${text.length.toLocaleString()} chars`);
      } catch (err) {
        console.error(`  ❌ Skipping ${filename}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log();
  }

  console.log('\n  Ingest complete.');
  console.log(`  Spreadsheet profiles → reports/tables/\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
