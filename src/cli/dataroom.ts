#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { DataRoomSummary } from '../schemas/spreadsheet.schema';
import { escapeHtml } from '../lib/output-safety';
import { listRegularFiles, resolveInside, resolveRegularFileInside } from '../lib/path-safety';
import { BRAND, DISCLAIMER, screenCss, screenHeader, screenFooter, screenChip } from '../lib/brand';

const CWD = process.cwd();
const INBOX = path.join(CWD, 'documents', 'inbox');
const DATAROOM_DIR = path.join(CWD, 'reports', 'dataroom');

const CONTRACT_EXTS = new Set(['.txt', '.md', '.pdf', '.docx']);
const SPREADSHEET_EXTS = new Set(['.csv', '.xlsx']);

function h(value: unknown): string {
  return escapeHtml(value);
}

export function renderDataRoomHtml(summary: DataRoomSummary): string {
  const fileTypeRows = summary.fileTypes.map((ft) =>
    `<tr><td><code>${h(ft.ext)}</code></td><td>${h(ft.count)}</td></tr>`
  ).join('');

  const docRows = summary.documents.map((d) =>
    `<tr><td>${h(d.filename)}</td><td>${h(d.category)}</td><td>${h(d.rowCount ?? d.characterCount ?? '—')}</td></tr>`
  ).join('');

  const findingCards = summary.crossDocumentFindings.map((f) => `
    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-type">${h(f.findingType.replace(/-/g, ' '))}</span>
        ${screenChip(f.severity)}
      </div>
      <h4>${h(f.title)}</h4>
      <p>${h(f.description)}</p>
      <table class="diff-table">
        <tr><th>${h(f.sourceA)}</th><th>${h(f.sourceB)}</th></tr>
        <tr><td>${h(f.valueA)}</td><td>${h(f.valueB)}</td></tr>
      </table>
      <p class="recommendation">→ ${h(f.recommendation)}</p>
    </div>`).join('');

  const paymentRows = summary.paymentScheduleFindings.slice(0, 10).map((p) =>
    `<tr>
      <td>${h(p.vendor)}</td>
      <td><strong>${h(p.amount)}</strong></td>
      <td>${h(p.dueDate)}</td>
      <td><span class="${p.status === 'Overdue' ? 'overdue' : ''}">${h(p.status)}</span></td>
      <td>${h(p.sourceFile)}</td>
    </tr>`
  ).join('');

  const capTableRows = summary.capTableFindings.slice(0, 12).map((c) =>
    `<tr>
      <td>${h(c.investor)}</td>
      <td>${h(c.shareClass)}</td>
      <td>${h(c.shares)}</td>
      <td>${h(c.ownershipPct)}</td>
      <td>${h(c.sourceFile)}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(BRAND.name)} — Data Room Review</title>
${screenCss()}
<style>
  .finding-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
  .finding-type { color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .diff-table { width: 100%; font-size: 0.78rem; border-collapse: collapse; margin: 8px 0; }
  .diff-table th { background: #f9fafb; color: #4b5563; padding: 4px 8px; text-align: left; }
  .diff-table td { padding: 4px 8px; color: #374151; border-bottom: 1px solid #e5e7eb; }
  .overdue { color: #b91c1c; font-weight: 600; }
</style>
</head>
<body>
<div class="container">
  ${screenHeader(
    'Data Room Review',
    summary.title,
    `Generated: ${h(summary.generatedAt)} · ${h(summary.fileCount)} files · ${summary.providerMode === 'mock' ? 'Mock Mode' : 'AI Mode'}`
  )}

  <div class="stats">
    <div class="stat"><div class="stat-val">${h(summary.fileCount)}</div><div class="stat-lbl">Files</div></div>
    <div class="stat"><div class="stat-val">${h(summary.crossDocumentFindings.length)}</div><div class="stat-lbl">Cross-Doc Findings</div></div>
    <div class="stat"><div class="stat-val">${h(summary.paymentScheduleFindings.length)}</div><div class="stat-lbl">Payment Items</div></div>
    <div class="stat"><div class="stat-val">${h(summary.capTableFindings.length)}</div><div class="stat-lbl">Cap Table Rows</div></div>
  </div>

  <h2>Executive Summary</h2>
  <div class="section">
    <p>${h(summary.executiveSummary)}</p>
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
    ${summary.paymentScheduleFindings.length > 10 ? `<p class="meta">Showing first 10 of ${summary.paymentScheduleFindings.length} payment rows — see the JSON report or exports for the full list.</p>` : ''}
  </div>` : ''}

  ${summary.capTableFindings.length > 0 ? `
  <h2>Cap Table</h2>
  <div class="section">
    <table class="main">
      <thead><tr><th>Investor</th><th>Share Class</th><th>Shares</th><th>Ownership %</th><th>Source</th></tr></thead>
      <tbody>${capTableRows}</tbody>
    </table>
    ${summary.capTableFindings.length > 12 ? `<p class="meta">Showing first 12 of ${summary.capTableFindings.length} cap table rows — see the JSON report or exports for the full list.</p>` : ''}
  </div>` : ''}

  ${summary.dataQualityWarnings.length > 0 ? `
  <h2>Data Quality Warnings</h2>
  <div class="warning-list">
    <ul>${summary.dataQualityWarnings.map((w) => `<li>${h(w)}</li>`).join('')}</ul>
  </div>` : ''}

  ${screenFooter(summary.generatedAt)}
</div>
</body>
</html>`;
}

function renderDataRoomMarkdown(summary: DataRoomSummary): string {
  const lines: string[] = [
    `# ${summary.title}`,
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
          ...(summary.paymentScheduleFindings.length > 10
            ? [`_Showing first 10 of ${summary.paymentScheduleFindings.length} payment rows — see the JSON report or exports for the full list._`]
            : []),
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
          ...(summary.capTableFindings.length > 12
            ? [`_Showing first 12 of ${summary.capTableFindings.length} cap table rows — see the JSON report or exports for the full list._`]
            : []),
          '',
        ]
      : []),
    ...(summary.dataQualityWarnings.length > 0
      ? ['## Data Quality Warnings', ...summary.dataQualityWarnings.map((w) => `- ⚠ ${w}`), '']
      : []),
    '---',
    '',
    `*${DISCLAIMER}*`,
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

  const allFiles = listRegularFiles(INBOX, (f) => !f.startsWith('.'));
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
    const filepath = resolveRegularFileInside(INBOX, filename, 'contract filename');
    try {
      let text = '';
      if (ext === '.txt' || ext === '.md') {
        text = fs.readFileSync(filepath, 'utf-8');
      } else if (ext === '.pdf') {
        const { extractPdfText } = await import('../lib/document-loader');
        text = await extractPdfText(filepath);
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
    const filepath = resolveRegularFileInside(INBOX, filename, 'spreadsheet filename');
    try {
      const sheets = ext === '.csv' ? parseCsvFile(filepath) : await parseXlsxFile(filepath);
      const profiles = sheets.map((s) => buildTableProfile(s));
      csvDocs.push({ filename, sheets, profiles });
    } catch (err) {
      console.error(`  ⚠️ Could not parse ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const summary = await runDataRoomReview(contractDocs, csvDocs, []);

  fs.mkdirSync(DATAROOM_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const jsonPath = resolveInside(DATAROOM_DIR, `dataroom-${ts}.json`, 'dataroom JSON output');
  const mdPath = resolveInside(DATAROOM_DIR, `dataroom-${ts}.md`, 'dataroom markdown output');
  const htmlPath = resolveInside(DATAROOM_DIR, `dataroom-${ts}.html`, 'dataroom HTML output');

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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
