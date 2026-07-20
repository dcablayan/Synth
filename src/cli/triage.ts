#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { z } from 'zod';
import { ReviewSchema, type Review } from '../schemas/review.schema';
import { SpreadsheetAnalysisSchema, DataRoomSummarySchema, type SpreadsheetAnalysis, type DataRoomSummary } from '../schemas/spreadsheet.schema';
import type { IssueLog } from '../schemas/issue.schema';
import { buildIssueLogFromReports } from '../lib/issue-engine';
import { escapeHtml } from '../lib/output-safety';
import { listRegularFiles, resolveInside, resolveRegularFileInside } from '../lib/path-safety';
import { BRAND, DISCLAIMER, screenCss, screenHeader, screenFooter, screenChip, severityColor } from '../lib/brand';

const CWD = process.cwd();
const ISSUES_DIR = path.join(CWD, 'reports', 'issues');
const EVIDENCE_DIR = path.join(CWD, 'reports', 'evidence');

function loadAllJSON<T>(dir: string, suffix: string, schema: z.ZodType<T>): Array<{ data: T; filename: string }> {
  if (!fs.existsSync(dir)) return [];
  return listRegularFiles(dir, (f) => f.endsWith(suffix))
    .map((f) => {
      try {
        const raw = JSON.parse(fs.readFileSync(resolveRegularFileInside(dir, f, 'report file'), 'utf-8'));
        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
          console.warn(`  ⚠️  Skipping ${f}: does not match the expected schema`);
          return null;
        }
        return { data: parsed.data, filename: f };
      }
      catch { return null; }
    })
    .filter(Boolean) as Array<{ data: T; filename: string }>;
}

function loadLatestJSON<T>(dir: string, suffix: string, schema: z.ZodType<T>): { data: T; filename: string } | null {
  const all = loadAllJSON<T>(dir, suffix, schema);
  return all.length > 0 ? all[all.length - 1] : null;
}

const SEV_ORDER: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

function h(value: unknown): string {
  return escapeHtml(value);
}

function statusColor(s: string): string {
  return ({ open: '#c2410c', investigating: '#b45309', resolved: '#15803d', waived: '#6b7280' } as Record<string, string>)[s] ?? '#6b7280';
}

function renderMarkdown(log: IssueLog): string {
  const top10 = [...log.issues].sort((a, b) => (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0)).slice(0, 10);

  return [
    `# ${log.title}`,
    '',
    `**Generated:** ${log.generatedAt}  `,
    `**Log ID:** ${log.logId}  `,
    `**Total Issues:** ${log.totalIssues} (Critical: ${log.criticalCount}, High: ${log.highCount}, Open: ${log.openCount})`,
    '',
    '---',
    '',
    '## Top 10 Issues to Resolve',
    '',
    ...top10.flatMap((issue, i) => [
      `### ${i + 1}. [${issue.severity}] ${issue.title}`,
      '',
      `**Category:** ${issue.category} | **Status:** ${issue.status} | **Sources:** ${issue.sourceFiles.join(', ')}`,
      '',
      issue.evidenceQuotes.length > 0
        ? `> "${issue.evidenceQuotes[0]}"`
        : '_No direct quote — see evidence ledger._',
      '',
      `**Recommendation:** ${issue.recommendation}`,
      '',
    ]),
    '---',
    '',
    '## All Issues',
    '',
    '| # | Title | Severity | Category | Status | Sources |',
    '|---|-------|----------|----------|--------|---------|',
    ...log.issues.map((i, idx) =>
      `| ${idx + 1} | ${i.title} | ${i.severity} | ${i.category} | ${i.status} | ${i.sourceFiles.join('; ')} |`
    ),
    '',
    '---',
    '',
    '## Evidence Ledger',
    '',
    ...log.evidence.flatMap((e) => [
      `### ${e.evidenceId}`,
      `**Issue:** ${e.issueId} | **Source:** ${e.sourceFilename}${e.sheetName ? ` (${e.sheetName})` : ''} | **Verified:** ${e.isVerified ? 'Yes' : 'No'}${e.verificationNote ? ` — ${e.verificationNote}` : ''}`,
      e.documentQuote ? `> "${e.documentQuote}"` : '',
      e.spreadsheetRow ? `Row: \`${e.spreadsheetRow}\`` : '',
      '',
    ].filter((l) => l !== '')),
    '',
    '---',
    '',
    `*${DISCLAIMER}*`,
  ].join('\n');
}

export function renderHtml(log: IssueLog): string {
  const top10 = [...log.issues].sort((a, b) => (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0)).slice(0, 10);

  const top10Cards = top10.map((issue, i) => `
    <div class="finding-card">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <span style="background:#f3f4f6;color:#6b7280;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:bold">${i + 1}</span>
        <strong style="color:#111827;font-size:0.88rem;flex:1">${h(issue.title)}</strong>
        ${screenChip(issue.severity)}
        <span style="color:${statusColor(issue.status)};font-size:0.72rem;background:#f3f4f6;padding:2px 7px;border-radius:2px">${h(issue.status)}</span>
      </div>
      <div style="font-size:0.78rem;color:#6b7280;margin-bottom:8px">Category: <strong style="color:#374151">${h(issue.category)}</strong> · Sources: <code>${issue.sourceFiles.map(h).join(', ')}</code></div>
      ${issue.evidenceQuotes.length > 0
        ? `<blockquote>"${h(issue.evidenceQuotes[0])}"</blockquote>`
        : '<p style="color:#6b7280;font-size:0.78rem;font-style:italic">No direct quote — see evidence ledger.</p>'}
      <p class="recommendation" style="margin-top:8px">→ ${h(issue.recommendation)}</p>
    </div>`).join('');

  const allRows = log.issues.map((issue, i) => `
    <tr>
      <td style="color:#6b7280">${i + 1}</td>
      <td style="color:#111827">${h(issue.title)}</td>
      <td>${screenChip(issue.severity)}</td>
      <td style="color:#374151">${h(issue.category)}</td>
      <td style="color:${statusColor(issue.status)}">${h(issue.status)}</td>
      <td><code>${issue.sourceFiles.map(h).join('; ')}</code></td>
    </tr>`).join('');

  const evRows = log.evidence.map((e) => `
    <tr>
      <td><code>${h(e.evidenceId)}</code></td>
      <td><code style="color:#374151">${h(e.issueId)}</code></td>
      <td style="color:#374151"><code>${h(e.sourceFilename)}</code></td>
      <td style="color:${e.isVerified ? '#15803d' : '#c2410c'};font-size:0.78rem">${e.isVerified ? '✓ Verified' : 'Unverified'}</td>
      <td style="color:#374151;font-size:0.78rem;font-style:italic">${e.documentQuote ? `"${h(e.documentQuote.slice(0, 80))}${e.documentQuote.length > 80 ? '…' : ''}"` : e.spreadsheetRow ? `<code style="font-style:normal">${h(e.spreadsheetRow)}</code>` : '—'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(BRAND.name)} — Issue Log</title>
${screenCss()}
</head>
<body>
<div class="container">
  ${screenHeader('Issue Log', log.title, `Generated: ${h(log.generatedAt)} · Log ID: ${h(log.logId)}`)}
  <div class="stats">
    <div class="stat"><div class="stat-val">${log.totalIssues}</div><div class="stat-lbl">Total Issues</div></div>
    <div class="stat"><div class="stat-val" style="color:${severityColor('Critical')}">${log.criticalCount}</div><div class="stat-lbl">Critical</div></div>
    <div class="stat"><div class="stat-val" style="color:${severityColor('High')}">${log.highCount}</div><div class="stat-lbl">High</div></div>
    <div class="stat"><div class="stat-val">${log.openCount}</div><div class="stat-lbl">Open</div></div>
  </div>
  <h2>Top 10 Issues to Resolve</h2>
  ${top10Cards}
  <h2>All Issues</h2>
  <div class="section">
    <table class="main">
      <thead><tr><th>#</th><th>Title</th><th>Severity</th><th>Category</th><th>Status</th><th>Sources</th></tr></thead>
      <tbody>${allRows}</tbody>
    </table>
  </div>
  <h2>Evidence Ledger</h2>
  <div class="section">
    <table class="main">
      <thead><tr><th>Evidence ID</th><th>Issue ID</th><th>Source</th><th>Verified</th><th>Quote / Row</th></tr></thead>
      <tbody>${evRows}</tbody>
    </table>
  </div>

  ${screenFooter(log.generatedAt)}
</div>
</body>
</html>`;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Triage                         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n');

  const reviewFiles = loadAllJSON<Review>(path.join(CWD, 'reports', 'reviews'), '-review.json', ReviewSchema);
  const spreadsheetFiles = loadAllJSON<SpreadsheetAnalysis>(path.join(CWD, 'reports', 'tables'), '-spreadsheet.json', SpreadsheetAnalysisSchema);
  const dataroomResult = loadLatestJSON<DataRoomSummary>(path.join(CWD, 'reports', 'dataroom'), '.json', DataRoomSummarySchema);

  const reviews = reviewFiles.map((r) => r.data);
  const spreadsheets = spreadsheetFiles.map((s) => s.data);
  const datarooms = dataroomResult ? [dataroomResult.data] : [];

  console.log(`  Reviews loaded:     ${reviews.length}`);
  console.log(`  Spreadsheets:       ${spreadsheets.length}`);
  console.log(`  Data room reports:  ${datarooms.length}\n`);

  if (reviews.length === 0 && datarooms.length === 0) {
    console.error('  ❌ No reports found.');
    console.error('     Run: npm run demo   (contracts)');
    console.error('     Run: npm run dataroom   (data room)');
    process.exit(1);
  }

  const sourceReportNames = [
    ...reviewFiles.map((r) => `reviews/${r.filename}`),
    ...spreadsheetFiles.map((s) => `tables/${s.filename}`),
    ...(dataroomResult ? [`dataroom/${dataroomResult.filename}`] : []),
  ];

  // Source documents are loaded so evidence quotes can be verified against the
  // actual text — "Verified" in the ledger means the quote was found verbatim.
  const { loadSourceTextsFromInbox } = await import('../lib/document-loader');
  const { extractDocumentTitle } = await import('../lib/parser');
  const sourceTexts = await loadSourceTextsFromInbox();
  for (const [filename, text] of [...sourceTexts.entries()]) {
    // Older reviews only carry a documentTitle — index by extracted title too.
    const title = extractDocumentTitle(text, filename);
    if (title && !sourceTexts.has(title)) sourceTexts.set(title, text);
  }
  console.log(`  Source documents available for quote verification: ${sourceTexts.size}`);

  console.log('  Building issue log...');
  const log = buildIssueLogFromReports(reviews, spreadsheets, datarooms, sourceReportNames, sourceTexts);

  fs.mkdirSync(ISSUES_DIR, { recursive: true });
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const jsonPath = resolveInside(ISSUES_DIR, `issue-log-${ts}.json`, 'issue log JSON output');
  const mdPath = resolveInside(ISSUES_DIR, `issue-log-${ts}.md`, 'issue log markdown output');
  const htmlPath = resolveInside(ISSUES_DIR, `issue-log-${ts}.html`, 'issue log HTML output');
  const evPath = resolveInside(EVIDENCE_DIR, `evidence-${ts}.json`, 'evidence JSON output');

  fs.writeFileSync(jsonPath, JSON.stringify(log, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(log));
  fs.writeFileSync(htmlPath, renderHtml(log));
  fs.writeFileSync(evPath, JSON.stringify({ generatedAt: new Date().toISOString(), issueLogId: log.logId, evidence: log.evidence }, null, 2));

  console.log(`\n  ✅ Issue Log JSON  → reports/issues/issue-log-${ts}.json`);
  console.log(`  ✅ Issue Log MD    → reports/issues/issue-log-${ts}.md`);
  console.log(`  ✅ Issue Log HTML  → reports/issues/issue-log-${ts}.html`);
  console.log(`  ✅ Evidence JSON   → reports/evidence/evidence-${ts}.json\n`);
  console.log(`  Total issues: ${log.totalIssues}`);
  console.log(`  Critical: ${log.criticalCount}  High: ${log.highCount}  Open: ${log.openCount}\n`);
  console.log('  Next steps:');
  console.log('    npm run export   → CSV + XLSX exports');
  console.log('    npm run compare  → compare two runs\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
