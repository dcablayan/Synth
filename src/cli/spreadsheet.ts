#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { escapeHtml } from '../lib/output-safety';
import { listRegularFiles, resolveInside, resolveRegularFileInside, safeFileStem } from '../lib/path-safety';
import { BRAND, DISCLAIMER, screenCss, screenHeader, screenFooter } from '../lib/brand';

const CWD = process.cwd();
const INBOX = path.join(CWD, 'documents', 'inbox');
const TABLES_DIR = path.join(CWD, 'reports', 'tables');
const HTML_DIR = path.join(CWD, 'reports', 'html');

function h(value: unknown): string {
  return escapeHtml(value);
}

function typeTag(label: string): string {
  return `<span class="type-tag">${h(label)}</span>`;
}

export function renderSpreadsheetHtml(analysis: import('../schemas/spreadsheet.schema').SpreadsheetAnalysis): string {
  const tables = analysis.tables.map((t) => {
    const flags = [
      t.isPaymentSchedule && typeTag('Payment Schedule'),
      t.isCapTable && typeTag('Cap Table'),
      t.isInvoice && typeTag('Invoice'),
      t.isVendorList && typeTag('Vendor List'),
    ].filter(Boolean).join(' ');

    const cols = t.columns.map((c) => `
      <tr>
        <td>${h(c.name)}</td>
        <td><code>${h(c.type)}</code></td>
        <td>${h(c.uniqueCount)}</td>
        <td>${h(c.blankCount)}</td>
        <td>${c.sampleValues.map((v) => `<em>${h(v)}</em>`).join(', ')}</td>
      </tr>`).join('');

    return `
    <div class="section">
      <div class="sheet-header">
        <h4>${h(t.sheetName)} ${flags}</h4>
        <span class="meta">${h(t.rowCount)} rows · ${h(t.columnCount)} columns</span>
      </div>
      ${t.detectedEntities.length > 0 ? `<p><strong>Entities:</strong> ${t.detectedEntities.slice(0, 8).map(h).join(', ')}</p>` : ''}
      ${t.detectedAmounts.length > 0 ? `<p><strong>Amounts:</strong> ${t.detectedAmounts.slice(0, 6).map(h).join(', ')}</p>` : ''}
      ${t.detectedDates.length > 0 ? `<p><strong>Dates:</strong> ${t.detectedDates.slice(0, 5).map(h).join(', ')}</p>` : ''}
      ${t.totalAmounts.length > 0 ? `<p><strong>Totals:</strong> ${t.totalAmounts.map((a) => `${h(a.label)}: <strong>${h(a.amount)}</strong>`).join(' · ')}</p>` : ''}
      ${t.repeatedVendors.length > 0 ? `<p class="warning">Repeated vendors: ${t.repeatedVendors.map(h).join(', ')}</p>` : ''}
      ${t.warnings.length > 0 ? t.warnings.map((w) => `<p class="warning">⚠ ${h(w)}</p>`).join('') : ''}
      <table class="main">
        <thead><tr><th>Column</th><th>Type</th><th>Unique</th><th>Blanks</th><th>Samples</th></tr></thead>
        <tbody>${cols}</tbody>
      </table>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(BRAND.name)} — Spreadsheet Analysis</title>
${screenCss()}
<style>
  .sheet-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
  .type-tag { border: 1px solid #d1d5db; color: #374151; padding: 1px 9px; border-radius: 2px; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  em { color: #6b7280; font-style: normal; }
  .warning { color: #b45309; font-size: 0.82rem; }
  p { font-size: 0.85rem; margin: 6px 0; }
</style>
</head>
<body>
<div class="container">
  ${screenHeader(
    'Spreadsheet Analysis',
    analysis.documentTitle,
    `${h(analysis.sheetCount)} sheet(s) · ${h(analysis.totalRows)} rows · <code>${h(analysis.sourceFilename)}</code> · Generated ${h(analysis.generatedAt)} · ${analysis.providerMode === 'mock' ? 'Mock Mode' : 'AI Mode'}`
  )}
  <h2>Summary</h2>
  <div class="section">
    <p>${h(analysis.summary)}</p>
  </div>
  ${analysis.keyFindings.length > 0 ? `
  <h2>Key Findings</h2>
  <div class="section">
    <ul style="margin:4px 0;padding-left:18px">${analysis.keyFindings.map((f) => `<li style="color:#374151;font-size:0.85rem;margin:4px 0">${h(f)}</li>`).join('')}</ul>
  </div>` : ''}
  ${analysis.warnings.length > 0 ? `
  <h2>Data Quality Warnings</h2>
  <div class="warning-list"><ul style="margin:0;padding-left:18px">${analysis.warnings.map((w) => `<li>${h(w)}</li>`).join('')}</ul></div>` : ''}
  <h2>Sheet Profiles</h2>
  ${tables}

  ${screenFooter(analysis.generatedAt)}
</div>
</body>
</html>`;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Spreadsheet Analyzer           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n');

  if (!fs.existsSync(INBOX)) {
    console.error(`  ❌ Inbox not found: ${INBOX}`);
    process.exit(1);
  }

  const files = listRegularFiles(INBOX, (f) => {
    const ext = path.extname(f).toLowerCase();
    return (ext === '.csv' || ext === '.xlsx') && !f.startsWith('.');
  });

  if (files.length === 0) {
    console.log(`  No CSV or XLSX files found in ${INBOX}`);
    process.exit(0);
  }

  fs.mkdirSync(TABLES_DIR, { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });

  const { parseCsvFile, parseXlsxFile, buildTableProfile } = await import('../lib/spreadsheet-parser');
  const { runSpreadsheetAnalysis } = await import('../lib/ai-provider');

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    const filepath = resolveRegularFileInside(INBOX, filename, 'spreadsheet filename');
    // Include the extension in the stem: "cap-table.csv" and "cap_table.xlsx"
    // share a sanitized stem and would otherwise overwrite each other.
    const slug = `${safeFileStem(filename)}-${ext.slice(1)}`;

    console.log(`  📊 Analyzing: ${filename}`);

    try {
      const sheets = ext === '.csv' ? parseCsvFile(filepath) : await parseXlsxFile(filepath);
      const profiles = sheets.map((s) => buildTableProfile(s));
      const analysis = await runSpreadsheetAnalysis(filename, sheets, profiles);

      // JSON
      const jsonPath = resolveInside(TABLES_DIR, `${slug}-spreadsheet.json`, 'spreadsheet JSON output');
      fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));

      // Markdown
      const md = [
        `# Spreadsheet Analysis: ${analysis.documentTitle}`,
        '',
        `**Source:** ${analysis.sourceFilename}  `,
        `**Sheets:** ${analysis.sheetCount}  `,
        `**Total rows:** ${analysis.totalRows}  `,
        `**Generated:** ${analysis.generatedAt}`,
        '',
        '## Summary',
        analysis.summary,
        '',
        '## Key Findings',
        ...analysis.keyFindings.map((f) => `- ${f}`),
        '',
        ...(analysis.warnings.length > 0 ? ['## Data Quality Warnings', ...analysis.warnings.map((w) => `- ⚠ ${w}`), ''] : []),
        ...analysis.tables.map((t) => [
          `## Sheet: ${t.sheetName}`,
          `- Rows: ${t.rowCount}, Columns: ${t.columnCount}`,
          t.isPaymentSchedule ? '- **Type:** Payment Schedule' : '',
          t.isCapTable ? '- **Type:** Cap Table' : '',
          t.isInvoice ? '- **Type:** Invoice' : '',
          t.detectedEntities.length > 0 ? `- Entities: ${t.detectedEntities.slice(0, 6).join(', ')}` : '',
          t.detectedAmounts.length > 0 ? `- Amounts: ${t.detectedAmounts.slice(0, 6).join(', ')}` : '',
          t.totalAmounts.length > 0 ? `- Totals: ${t.totalAmounts.map((a) => `${a.label}: ${a.amount}`).join(' | ')}` : '',
          '',
        ].filter((l) => l !== '').join('\n')),
        '---',
        '',
        `*${DISCLAIMER}*`,
      ].join('\n');
      const mdPath = resolveInside(TABLES_DIR, `${slug}-spreadsheet.md`, 'spreadsheet markdown output');
      fs.writeFileSync(mdPath, md);

      // HTML
      const html = renderSpreadsheetHtml(analysis);
      const htmlPath = resolveInside(HTML_DIR, `${slug}-spreadsheet.html`, 'spreadsheet HTML output');
      fs.writeFileSync(htmlPath, html);

      console.log(`     ✅ JSON   → reports/tables/${slug}-spreadsheet.json`);
      console.log(`     ✅ MD     → reports/tables/${slug}-spreadsheet.md`);
      console.log(`     ✅ HTML   → reports/html/${slug}-spreadsheet.html`);

      for (const t of analysis.tables) {
        const flags = [
          t.isPaymentSchedule && 'payment-schedule',
          t.isCapTable && 'cap-table',
          t.isInvoice && 'invoice',
          t.isVendorList && 'vendor-list',
        ].filter(Boolean);
        console.log(`     Sheet "${t.sheetName}": ${t.rowCount} rows [${flags.join(', ') || 'generic'}]`);
      }
      if (analysis.warnings.length > 0) {
        console.log(`     ⚠️  ${analysis.warnings.slice(0, 2).join(' | ')}`);
      }
    } catch (err) {
      console.error(`  ❌ ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    }
    console.log();
  }

  console.log('  Spreadsheet analysis complete.');
  console.log('  JSON + MD → reports/tables/');
  console.log('  HTML      → reports/html/\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
