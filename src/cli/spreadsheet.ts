#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const INBOX = path.join(CWD, 'documents', 'inbox');
const TABLES_DIR = path.join(CWD, 'reports', 'tables');
const HTML_DIR = path.join(CWD, 'reports', 'html');

const DISCLAIMER = 'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

function renderSpreadsheetHtml(analysis: import('../schemas/spreadsheet.schema').SpreadsheetAnalysis): string {
  const tables = analysis.tables.map((t) => {
    const flags = [
      t.isPaymentSchedule && '<span class="badge">Payment Schedule</span>',
      t.isCapTable && '<span class="badge badge-green">Cap Table</span>',
      t.isInvoice && '<span class="badge badge-blue">Invoice</span>',
      t.isVendorList && '<span class="badge badge-orange">Vendor List</span>',
    ].filter(Boolean).join(' ');

    const cols = t.columns.map((c) => `
      <tr>
        <td>${c.name}</td>
        <td><code>${c.type}</code></td>
        <td>${c.uniqueCount}</td>
        <td>${c.blankCount}</td>
        <td>${c.sampleValues.map((v) => `<em>${v}</em>`).join(', ')}</td>
      </tr>`).join('');

    return `
    <div class="sheet-card">
      <div class="sheet-header">
        <h3>${t.sheetName} ${flags}</h3>
        <span class="meta">${t.rowCount} rows · ${t.columnCount} columns</span>
      </div>
      ${t.detectedEntities.length > 0 ? `<p><strong>Entities:</strong> ${t.detectedEntities.slice(0, 8).join(', ')}</p>` : ''}
      ${t.detectedAmounts.length > 0 ? `<p><strong>Amounts:</strong> ${t.detectedAmounts.slice(0, 6).join(', ')}</p>` : ''}
      ${t.detectedDates.length > 0 ? `<p><strong>Dates:</strong> ${t.detectedDates.slice(0, 5).join(', ')}</p>` : ''}
      ${t.totalAmounts.length > 0 ? `<p><strong>Totals:</strong> ${t.totalAmounts.map((a) => `${a.label}: <strong>${a.amount}</strong>`).join(' · ')}</p>` : ''}
      ${t.repeatedVendors.length > 0 ? `<p class="warning">Repeated vendors: ${t.repeatedVendors.join(', ')}</p>` : ''}
      ${t.warnings.length > 0 ? t.warnings.map((w) => `<p class="warning">⚠ ${w}</p>`).join('') : ''}
      <table>
        <thead><tr><th>Column</th><th>Type</th><th>Unique</th><th>Blanks</th><th>Samples</th></tr></thead>
        <tbody>${cols}</tbody>
      </table>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Spreadsheet Analysis: ${analysis.documentTitle}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { color: #38bdf8; font-size: 1.4rem; margin-bottom: 4px; }
  h3 { color: #94a3b8; font-size: 1rem; margin: 0 0 8px 0; }
  .meta { color: #64748b; font-size: 0.8rem; }
  .disclaimer { background: #422006; border: 1px solid #92400e; border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; color: #fde68a; margin-bottom: 20px; }
  .summary { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
  .findings { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
  .findings ul { margin: 8px 0; padding-left: 18px; }
  .findings li { color: #94a3b8; font-size: 0.85rem; margin: 4px 0; }
  .sheet-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .sheet-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-top: 10px; }
  th { background: #0f172a; color: #64748b; font-weight: 600; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
  code { background: #0f172a; color: #38bdf8; padding: 1px 4px; border-radius: 3px; font-size: 0.78rem; }
  em { color: #94a3b8; font-style: normal; }
  .warning { color: #fbbf24; font-size: 0.82rem; }
  .badge { background: #7c3aed; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; }
  .badge-green { background: #065f46; }
  .badge-blue { background: #1e40af; }
  .badge-orange { background: #92400e; }
  .provider { background: #1e293b; border: 1px solid #334155; padding: 8px 12px; border-radius: 6px; font-size: 0.75rem; color: #64748b; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <h1>${analysis.documentTitle}</h1>
  <p class="meta">${analysis.sheetCount} sheet(s) · ${analysis.totalRows} rows · Generated ${analysis.generatedAt} · ${analysis.providerMode === 'mock' ? 'Mock Mode' : 'AI Mode'}</p>
  <div class="disclaimer">⚠ ${DISCLAIMER}</div>
  <div class="summary">
    <h3>Summary</h3>
    <p>${analysis.summary}</p>
  </div>
  ${analysis.keyFindings.length > 0 ? `
  <div class="findings">
    <h3>Key Findings</h3>
    <ul>${analysis.keyFindings.map((f) => `<li>${f}</li>`).join('')}</ul>
  </div>` : ''}
  ${analysis.warnings.length > 0 ? `<div class="findings"><h3>Data Quality Warnings</h3><ul>${analysis.warnings.map((w) => `<li class="warning">${w}</li>`).join('')}</ul></div>` : ''}
  <h3 style="margin-top:20px">Sheet Profiles</h3>
  ${tables}
  <div class="provider">sourceFilename: ${analysis.sourceFilename} · extension: ${analysis.sourceExtension} · providerMode: ${analysis.providerMode}</div>
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

  const files = fs.readdirSync(INBOX).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return (ext === '.csv' || ext === '.xlsx') && !f.startsWith('.');
  });

  if (files.length === 0) {
    console.log(`  No CSV or XLSX files found in ${INBOX}`);
    process.exit(0);
  }

  fs.mkdirSync(TABLES_DIR, { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });

  const { parseCsvFile, parseXlsxFile, buildTableProfile, textSummaryOfSheet } = await import('../lib/spreadsheet-parser');
  const { generateMockSpreadsheetAnalysis } = await import('../lib/mock-spreadsheet-provider');
  const { SpreadsheetAnalysisSchema } = await import('../schemas/spreadsheet.schema');

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    const filepath = path.join(INBOX, filename);
    const slug = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');

    console.log(`  📊 Analyzing: ${filename}`);

    try {
      const sheets = ext === '.csv' ? parseCsvFile(filepath) : parseXlsxFile(filepath);
      const profiles = sheets.map((s) => buildTableProfile(s));
      const analysis = SpreadsheetAnalysisSchema.parse(
        generateMockSpreadsheetAnalysis(filename, sheets, profiles)
      );

      // JSON
      const jsonPath = path.join(TABLES_DIR, `${slug}-spreadsheet.json`);
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
        `> ${DISCLAIMER}`,
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
      ].join('\n');
      const mdPath = path.join(TABLES_DIR, `${slug}-spreadsheet.md`);
      fs.writeFileSync(mdPath, md);

      // HTML
      const html = renderSpreadsheetHtml(analysis);
      const htmlPath = path.join(HTML_DIR, `${slug}-spreadsheet.html`);
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
