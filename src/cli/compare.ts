#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { z } from 'zod';
import { IssueLogSchema, type IssueLog, type CompareReport } from '../schemas/issue.schema';
import { DataRoomSummarySchema, type DataRoomSummary } from '../schemas/spreadsheet.schema';
import { buildCompareReport } from '../lib/compare-engine';
import { escapeHtml } from '../lib/output-safety';
import { listRegularFiles, resolveInside, resolveRegularFileInside } from '../lib/path-safety';
import { BRAND, DISCLAIMER, screenCss, screenHeader, screenFooter } from '../lib/brand';

const CWD = process.cwd();
const COMPARE_DIR = path.join(CWD, 'reports', 'compare');

// added = new problem (red), removed = resolved (green), changed = shifted (amber)
const CHANGE_COLORS: Record<string, string> = { added: '#b91c1c', removed: '#15803d', changed: '#b45309' };

function h(value: unknown): string {
  return escapeHtml(value);
}

function loadSorted<T>(dir: string, suffix: string, schema: z.ZodType<T>): Array<{ data: T; filename: string }> {
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

function loadExplicit<T>(filepath: string, schema: z.ZodType<T>, label: string): T {
  const raw = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`${label} (${filepath}) does not match the expected schema: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
  }
  return parsed.data;
}

function renderMarkdown(r: CompareReport): string {
  return [
    '# Comparison Report',
    '',
    `**Report ID:** ${r.reportId}  `,
    `**Generated:** ${r.generatedAt}  `,
    `**Source A:** \`${r.sourceA}\`  `,
    `**Source B:** \`${r.sourceB}\``,
    '',
    '## Summary',
    `- Added issues: ${r.addedIssues.length}`,
    `- Removed issues: ${r.removedIssues.length}`,
    `- Changed issues: ${r.changedIssues.length}`,
    `- Payment changes: ${r.paymentChanges.length}`,
    `- Cap table changes: ${r.capTableChanges.length}`,
    `- New warnings: ${r.newWarnings.length}`,
    `- Resolved warnings: ${r.resolvedWarnings.length}`,
    '',
    ...(r.riskScoreChange ? [`**Risk Score Change:** ${r.riskScoreChange}`, ''] : []),
    ...(r.addedIssues.length > 0
      ? ['## Added Issues', ...r.addedIssues.map((i) => `- **[${i.severity}]** ${i.title} (${i.category})`), '']
      : []),
    ...(r.removedIssues.length > 0
      ? ['## Removed Issues', ...r.removedIssues.map((i) => `- [${i.severity}] ${i.title}`), '']
      : []),
    ...(r.changedIssues.length > 0
      ? ['## Changed Issues', ...r.changedIssues.map((c) => `- **${c.title}**: \`${c.field}\` \`${c.from}\` → \`${c.to}\``), '']
      : []),
    ...(r.paymentChanges.length > 0
      ? [
          '## Payment Changes',
          '| Vendor | Amount A | Amount B | Status A | Status B | Change |',
          '|--------|----------|----------|----------|----------|--------|',
          ...r.paymentChanges.map((p) => `| ${p.vendor} | ${p.amountA} | ${p.amountB} | ${p.statusA} | ${p.statusB} | **${p.change}** |`),
          '',
        ]
      : []),
    ...(r.capTableChanges.length > 0
      ? ['## Cap Table Changes', ...r.capTableChanges.map((c) => `- **${c.investor}** (${c.changeType}): ${c.detail}`), '']
      : []),
    ...(r.newWarnings.length > 0
      ? ['## New Warnings', ...r.newWarnings.map((w) => `- ⚠ ${w}`), '']
      : []),
    ...(r.resolvedWarnings.length > 0
      ? ['## Resolved Warnings', ...r.resolvedWarnings.map((w) => `- ✓ ${w}`), '']
      : []),
    '---',
    '',
    `*${DISCLAIMER}*`,
  ].join('\n');
}

export function renderHtml(r: CompareReport): string {
  const stat = (label: string, val: number, color = '#111827') =>
    `<div class="stat"><div class="stat-val" style="color:${color}">${h(val)}</div><div class="stat-lbl">${h(label)}</div></div>`;

  const changeCard = (type: string, color: string, content: string) =>
    `<div style="background:#ffffff;border:1px solid ${color}55;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="font-size:0.72rem;font-weight:600;background:${color}14;color:${color};padding:2px 7px;border-radius:4px">${h(type)}</span>${content}</div>`;

  const payRows = r.paymentChanges.map((p) =>
    `<tr><td>${h(p.vendor)}</td><td>${h(p.amountA)}</td><td>${h(p.amountB)}</td><td>${h(p.statusA)}</td><td>${h(p.statusB)}</td><td style="font-weight:600;color:${CHANGE_COLORS[p.change] ?? '#94a3b8'}">${h(p.change)}</td></tr>`
  ).join('');

  const capRows = r.capTableChanges.map((c) =>
    `<tr><td>${h(c.investor)}</td><td style="color:${CHANGE_COLORS[c.changeType] ?? '#94a3b8'}">${h(c.changeType)}</td><td>${h(c.detail)}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(BRAND.name)} — Comparison Report</title>
${screenCss()}
<style>
  .sources{background:#f9fafb;border:1px solid #e5e7eb;border-radius:2px;padding:12px 16px;margin-bottom:16px;font-size:0.82rem}
</style>
</head>
<body>
<div class="container">
  ${screenHeader('Run Comparison', 'Comparison Report', `${h(r.reportId)} · ${h(r.generatedAt)}`)}
  <div class="sources">
    <strong>A:</strong> <code>${h(r.sourceA)}</code><br>
    <strong>B:</strong> <code>${h(r.sourceB)}</code>
  </div>
  <div class="stats">
    ${stat('Added Issues', r.addedIssues.length, CHANGE_COLORS.added)}
    ${stat('Removed Issues', r.removedIssues.length, CHANGE_COLORS.removed)}
    ${stat('Changed Issues', r.changedIssues.length, CHANGE_COLORS.changed)}
    ${stat('Payment Changes', r.paymentChanges.length, '#111827')}
  </div>

  ${r.addedIssues.length > 0 ? `<h2>Added Issues</h2>${r.addedIssues.map((i) => changeCard('+ Added', CHANGE_COLORS.added, `<strong>${h(i.title)}</strong> <span style="color:#6b7280;font-size:0.72rem">${h(i.severity)} · ${h(i.category)}</span>`)).join('')}` : ''}
  ${r.removedIssues.length > 0 ? `<h2>Removed Issues</h2>${r.removedIssues.map((i) => changeCard('- Removed', CHANGE_COLORS.removed, `<strong>${h(i.title)}</strong>`)).join('')}` : ''}
  ${r.changedIssues.length > 0 ? `<h2>Changed Issues</h2>${r.changedIssues.map((c) => changeCard('~ Changed', CHANGE_COLORS.changed, `<strong>${h(c.title)}</strong>: <code>${h(c.field)}</code> <code>${h(c.from)}</code> → <code>${h(c.to)}</code>`)).join('')}` : ''}

  ${r.paymentChanges.length > 0 ? `<h2>Payment Changes</h2><div class="section"><table class="main"><thead><tr><th>Vendor</th><th>Amount A</th><th>Amount B</th><th>Status A</th><th>Status B</th><th>Change</th></tr></thead><tbody>${payRows}</tbody></table></div>` : ''}
  ${r.capTableChanges.length > 0 ? `<h2>Cap Table Changes</h2><div class="section"><table class="main"><thead><tr><th>Investor</th><th>Change</th><th>Detail</th></tr></thead><tbody>${capRows}</tbody></table></div>` : ''}
  ${r.newWarnings.length > 0 ? `<h2>New Warnings</h2><div class="section">${r.newWarnings.map((w) => `<p style="color:#b45309;font-size:0.82rem">⚠ ${h(w)}</p>`).join('')}</div>` : ''}
  ${r.resolvedWarnings.length > 0 ? `<h2>Resolved Warnings</h2><div class="section">${r.resolvedWarnings.map((w) => `<p style="color:#15803d;font-size:0.82rem">✓ ${h(w)}</p>`).join('')}</div>` : ''}

  ${screenFooter(r.generatedAt)}
</div>
</body>
</html>`;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Compare                        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n');

  const args = process.argv.slice(2);
  let roomA: DataRoomSummary;
  let roomB: DataRoomSummary;
  let fileA: string;
  let fileB: string;
  let logA: IssueLog | null = null;
  let logB: IssueLog | null = null;
  let logALabel = '';
  let logBLabel = '';

  if (args.length >= 2) {
    try {
      roomA = loadExplicit(args[0], DataRoomSummarySchema, 'Data room A');
      roomB = loadExplicit(args[1], DataRoomSummarySchema, 'Data room B');
      fileA = path.basename(args[0]);
      fileB = path.basename(args[1]);
    } catch (e) {
      console.error(`  ❌ Could not read files: ${e instanceof Error ? e.message : e}`);
      process.exit(1);
    }
    // With explicit data room files, the "last two issue logs on disk" have no
    // relationship to the chosen files — only diff logs the caller also names.
    if (args.length >= 4) {
      try {
        logA = loadExplicit(args[2], IssueLogSchema, 'Issue log A');
        logB = loadExplicit(args[3], IssueLogSchema, 'Issue log B');
        logALabel = path.basename(args[2]);
        logBLabel = path.basename(args[3]);
      } catch (e) {
        console.error(`  ❌ Could not read issue logs: ${e instanceof Error ? e.message : e}`);
        process.exit(1);
      }
    } else {
      console.log('  ℹ️  Issue log diff skipped for explicit file comparison — pass two issue-log JSON paths as arguments 3 and 4 to include it.');
    }
  } else {
    const rooms = loadSorted<DataRoomSummary>(path.join(CWD, 'reports', 'dataroom'), '.json', DataRoomSummarySchema);
    if (rooms.length < 2) {
      console.error('  ❌ Need at least 2 data room reports to compare.');
      console.error('     Run npm run dataroom twice, or pass two JSON paths as arguments.');
      process.exit(1);
    }
    const [rA, rB] = rooms.slice(-2);
    roomA = rA.data;
    roomB = rB.data;
    fileA = rA.filename;
    fileB = rB.filename;

    const logs = loadSorted<IssueLog>(path.join(CWD, 'reports', 'issues'), '.json', IssueLogSchema);
    if (logs.length >= 2) {
      logA = logs[logs.length - 2].data;
      logB = logs[logs.length - 1].data;
      logALabel = logs[logs.length - 2].filename;
      logBLabel = logs[logs.length - 1].filename;
    }
  }

  console.log(`  Comparing:`);
  console.log(`    A: ${fileA}`);
  console.log(`    B: ${fileB}`);
  if (logA && logB) console.log(`  Issue logs: comparing ${logALabel} vs ${logBLabel}`);
  console.log('');

  const report = buildCompareReport(fileA, fileB, logA, logB, roomA, roomB);

  fs.mkdirSync(COMPARE_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  fs.writeFileSync(resolveInside(COMPARE_DIR, `compare-${ts}.json`, 'compare JSON output'), JSON.stringify(report, null, 2));
  fs.writeFileSync(resolveInside(COMPARE_DIR, `compare-${ts}.md`, 'compare markdown output'), renderMarkdown(report));
  fs.writeFileSync(resolveInside(COMPARE_DIR, `compare-${ts}.html`, 'compare HTML output'), renderHtml(report));

  console.log(`  ✅ JSON  → reports/compare/compare-${ts}.json`);
  console.log(`  ✅ MD    → reports/compare/compare-${ts}.md`);
  console.log(`  ✅ HTML  → reports/compare/compare-${ts}.html\n`);
  console.log(`  Added: ${report.addedIssues.length}  Removed: ${report.removedIssues.length}  Changed: ${report.changedIssues.length}`);
  console.log(`  Payment changes: ${report.paymentChanges.length}  Cap table changes: ${report.capTableChanges.length}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
