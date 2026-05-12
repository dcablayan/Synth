#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import type { DataRoomSummary } from '../schemas/spreadsheet.schema';

const CWD = process.cwd();
const INBOX = path.join(CWD, 'documents', 'inbox');
const DATAROOM_DIR = path.join(CWD, 'reports', 'dataroom');
const DISCLAIMER = 'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

const CONTRACT_EXTS = new Set(['.txt', '.md', '.pdf', '.docx']);
const SPREADSHEET_EXTS = new Set(['.csv', '.xlsx']);

function getSeverityColor(s: string): string {
  switch (s) {
    case 'Critical': return '#ef4444';
    case 'High': return '#f97316';
    case 'Medium': return '#eab308';
    case 'Low': return '#22c55e';
    default: return '#94a3b8';
  }
}

function renderDataRoomHtml(summary: DataRoomSummary): string {
  const fileTypeRows = summary.fileTypes.map((ft) =>
    `<tr><td><code>${ft.ext}</code></td><td>${ft.count}</td></tr>`
  ).join('');

  const docRows = summary.documents.map((d) =>
    `<tr><td>${d.filename}</td><td>${d.category}</td><td>${d.rowCount ?? d.characterCount ?? '—'}</td></tr>`
  ).join('');

  const findingCards = summary.crossDocumentFindings.map((f) => `
    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-type">${f.findingType.replace(/-/g, ' ')}</span>
        <span class="severity" style="color:${getSeverityColor(f.severity)}">${f.severity}</span>
      </div>
      <h4>${f.title}</h4>
      <p>${f.description}</p>
      <table class="diff-table">
        <tr><th>${f.sourceA}</th><th>${f.sourceB}</th></tr>
        <tr><td>${f.valueA}</td><td>${f.valueB}</td></tr>
      </table>
      <p class="recommendation">→ ${f.recommendation}</p>
    </div>`).join('');

  const paymentRows = summary.paymentScheduleFindings.slice(0, 10).map((p) =>
    `<tr>
      <td>${p.vendor}</td>
      <td><strong>${p.amount}</strong></td>
      <td>${p.dueDate}</td>
      <td><span class="${p.status === 'Overdue' ? 'overdue' : ''}">${p.status}</span></td>
      <td>${p.sourceFile}</td>
    </tr>`
  ).join('');

  const capTableRows = summary.capTableFindings.slice(0, 12).map((c) =>
    `<tr>
      <td>${c.investor}</td>
      <td>${c.shareClass}</td>
      <td>${c.shares}</td>
      <td>${c.ownershipPct}</td>
      <td>${c.sourceFile}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Data Room Review — ${summary.title}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { color: #38bdf8; font-size: 1.5rem; }
  h2 { color: #94a3b8; font-size: 1rem; text-transform: uppercase; letter-spacing: .05em; margin-top: 28px; margin-bottom: 12px; }
  h4 { color: #e2e8f0; font-size: 0.9rem; margin: 6px 0; }
  .disclaimer { background: #422006; border: 1px solid #92400e; border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; color: #fde68a; margin-bottom: 20px; }
  .badge { display: inline-block; background: #1d4ed8; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; margin-bottom: 12px; }
  .summary { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px; text-align: center; }
  .stat-val { font-size: 1.6rem; font-weight: bold; color: white; }
  .stat-lbl { font-size: 0.72rem; color: #64748b; margin-top: 4px; }
  .finding-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .finding-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .finding-type { color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
  .severity { font-size: 0.78rem; font-weight: bold; }
  .diff-table { width: 100%; font-size: 0.78rem; border-collapse: collapse; margin: 8px 0; }
  .diff-table th { background: #0f172a; color: #64748b; padding: 4px 8px; text-align: left; }
  .diff-table td { padding: 4px 8px; color: #94a3b8; border-bottom: 1px solid #1e293b; }
  .recommendation { color: #38bdf8; font-size: 0.82rem; }
  .overdue { color: #ef4444; font-weight: bold; }
  .warning-list { background: #1e293b; border: 1px solid #d97706; border-radius: 8px; padding: 12px 16px; }
  .warning-list li { color: #fbbf24; font-size: 0.82rem; margin: 4px 0; }
  table.main { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  table.main th { background: #0f172a; color: #64748b; padding: 6px 10px; text-align: left; }
  table.main td { padding: 6px 10px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
  code { background: #0f172a; color: #38bdf8; padding: 1px 4px; border-radius: 3px; }
  .section { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .meta { color: #64748b; font-size: 0.78rem; }
</style>
</head>
<body>
<div class="container">
  <h1>${summary.title}</h1>
  <span class="badge">Contracts + Spreadsheets + Data Room Review</span>
  <p class="meta">Generated: ${summary.generatedAt} · ${summary.fileCount} files · ${summary.providerMode === 'mock' ? 'Mock Mode' : 'AI Mode'}</p>
  <div class="disclaimer">⚠ ${DISCLAIMER}</div>

  <div class="stats">
    <div class="stat"><div class="stat-val">${summary.fileCount}</div><div class="stat-lbl">Files</div></div>
    <div class="stat"><div class="stat-val">${summary.crossDocumentFindings.length}</div><div class="stat-lbl">Cross-Doc Findings</div></div>
    <div class="stat"><div class="stat-val">${summary.paymentScheduleFindings.length}</div><div class="stat-lbl">Payment Items</div></div>
    <div class="stat"><div class="stat-val">${summary.capTableFindings.length}</div><div class="stat-lbl">Cap Table Rows</div></div>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <p>${summary.executiveSummary}</p>
  </div>

  <h2>File Breakdown</h2>
  <div class="section">
    <table class="main">
      <thead><tr><th>Filename</th><th>Category</th><th>Size</th></tr></thead>
      <tbody>${docRows}</tbody>
    </table>
    <table class="main" style="margin-top:12px">
      <thead><tr><th>Extension</th><th>Count</th></tr></thead>
      <tbody>${fileTypeRows}</tbody>
    </table>
  </div>

  ${summary.crossDocumentFindings.length > 0 ? `
  <h2>Cross-Document Findings</h2>
  ${findingCards}` : '<h2>Cross-Document Findings</h2><p class="meta">No findings detected.</p>'}

  ${summary.paymentScheduleFindings.length > 0 ? `
  <h2>Payment Schedule</h2>
  <div class="section">
    <table class="main">
      <thead><tr><th>Vendor</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Source</th></tr></thead>
      <tbody>${paymentRows}</tbody>
    </table>
  </div>` : ''}

  ${summary.capTableFindings.length > 0 ? `
  <h2>Cap Table</h2>
  <div class="section">
    <table class="main">
      <thead><tr><th>Investor</th><th>Share Class</th><th>Shares</th><th>Ownership %</th><th>Source</th></tr></thead>
      <tbody>${capTableRows}</tbody>
    </table>
  </div>` : ''}

  ${summary.dataQualityWarnings.length > 0 ? `
  <h2>Data Quality Warnings</h2>
  <div class="warning-list">
    <ul>${summary.dataQualityWarnings.map((w) => `<li>${w}</li>`).join('')}</ul>
  </div>` : ''}
</div>
</body>
</html>`;
}

function renderDataRoomMarkdown(summary: DataRoomSummary): string {
  const lines: string[] = [
    `# ${summary.title}`,
    '',
    `> ${DISCLAIMER}`,
    '',
    `**Generated:** ${summary.generatedAt}  `,
    `**Files:** ${summary.fileCount}  `,
    `**Mode:** ${summary.providerMode}`,
    '',
    '## Executive Summary',
    summary.executiveSummary,
    '',
    '## Files',
    ...summary.documents.map((d) => `- ${d.filename} (${d.category}${d.rowCount ? `, ${d.rowCount} rows` : d.characterCount ? `, ${d.characterCount} chars` : ''})`),
    '',
    '## Cross-Document Findings',
    ...(summary.crossDocumentFindings.length === 0
      ? ['_No findings detected._']
      : summary.crossDocumentFindings.map((f) => [
          `### ${f.title} [${f.severity}]`,
          `**Type:** ${f.findingType}  `,
          f.description,
          `- **${f.sourceA}:** ${f.valueA}`,
          `- **${f.sourceB}:** ${f.valueB}`,
          `→ ${f.recommendation}`,
          '',
        ].join('\n'))),
    '',
    ...(summary.paymentScheduleFindings.length > 0
      ? [
          '## Payment Schedule',
          '| Vendor | Amount | Due Date | Status | Source |',
          '|---|---|---|---|---|',
          ...summary.paymentScheduleFindings.slice(0, 10).map((p) =>
            `| ${p.vendor} | ${p.amount} | ${p.dueDate} | ${p.status} | ${p.sourceFile} |`
          ),
          '',
        ]
      : []),
    ...(summary.capTableFindings.length > 0
      ? [
          '## Cap Table',
          '| Investor | Share Class | Shares | Ownership % | Source |',
          '|---|---|---|---|---|',
          ...summary.capTableFindings.slice(0, 12).map((c) =>
            `| ${c.investor} | ${c.shareClass} | ${c.shares} | ${c.ownershipPct} | ${c.sourceFile} |`
          ),
          '',
        ]
      : []),
    ...(summary.dataQualityWarnings.length > 0
      ? ['## Data Quality Warnings', ...summary.dataQualityWarnings.map((w) => `- ⚠ ${w}`), '']
      : []),
  ];
  return lines.join('\n');
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Data Room Analyzer             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n');

  if (!fs.existsSync(INBOX)) {
    console.error(`  ❌ Inbox not found: ${INBOX}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(INBOX).filter((f) => !f.startsWith('.'));
  const contractFiles = allFiles.filter((f) => CONTRACT_EXTS.has(path.extname(f).toLowerCase()));
  const spreadsheetFiles = allFiles.filter((f) => SPREADSHEET_EXTS.has(path.extname(f).toLowerCase()));

  console.log(`  Inbox: ${allFiles.length} total files`);
  console.log(`    ${contractFiles.length} contract(s): ${contractFiles.join(', ')}`);
  console.log(`    ${spreadsheetFiles.length} spreadsheet(s): ${spreadsheetFiles.join(', ')}\n`);

  const { parseCsvFile, parseXlsxFile, buildTableProfile } = await import('../lib/spreadsheet-parser');
  const { runDataRoomReview } = await import('../lib/ai-provider');

  // Load contract texts
  const contractDocs: Array<{ filename: string; text: string }> = [];
  for (const filename of contractFiles) {
    const ext = path.extname(filename).toLowerCase();
    const filepath = path.join(INBOX, filename);
    try {
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
      contractDocs.push({ filename, text });
    } catch (err) {
      console.error(`  ⚠️ Could not load ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Load spreadsheets
  const csvDocs: Array<{ filename: string; sheets: ReturnType<typeof parseCsvFile>; profiles: ReturnType<typeof buildTableProfile>[] }> = [];
  for (const filename of spreadsheetFiles) {
    const ext = path.extname(filename).toLowerCase();
    const filepath = path.join(INBOX, filename);
    try {
      const sheets = ext === '.csv' ? parseCsvFile(filepath) : parseXlsxFile(filepath);
      const profiles = sheets.map((s) => buildTableProfile(s));
      csvDocs.push({ filename, sheets, profiles });
    } catch (err) {
      console.error(`  ⚠️ Could not parse ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const summary = await runDataRoomReview(contractDocs, csvDocs, []);

  fs.mkdirSync(DATAROOM_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const jsonPath = path.join(DATAROOM_DIR, `dataroom-${ts}.json`);
  const mdPath = path.join(DATAROOM_DIR, `dataroom-${ts}.md`);
  const htmlPath = path.join(DATAROOM_DIR, `dataroom-${ts}.html`);

  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  fs.writeFileSync(mdPath, renderDataRoomMarkdown(summary));
  fs.writeFileSync(htmlPath, renderDataRoomHtml(summary));

  console.log(`  ✅ JSON   → reports/dataroom/dataroom-${ts}.json`);
  console.log(`  ✅ MD     → reports/dataroom/dataroom-${ts}.md`);
  console.log(`  ✅ HTML   → reports/dataroom/dataroom-${ts}.html\n`);

  console.log(`  Cross-document findings: ${summary.crossDocumentFindings.length}`);
  console.log(`  Payment items: ${summary.paymentScheduleFindings.length}`);
  console.log(`  Cap table rows: ${summary.capTableFindings.length}`);
  if (summary.dataQualityWarnings.length > 0) {
    console.log(`  ⚠️  Data quality warnings: ${summary.dataQualityWarnings.length}`);
  }

  // Try PDF generation if Playwright is available
  try {
    const { generatePDF } = await import('../lib/pdf-writer');
    await generatePDF(htmlPath, `dataroom-${ts}`);
    console.log(`  ✅ PDF    → reports/pdfs/dataroom-${ts}.pdf`);
  } catch {
    console.log('  ℹ️  PDF skipped (Playwright not configured)');
  }

  console.log('\n  Data room analysis complete.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
