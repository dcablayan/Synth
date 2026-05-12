#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import type { IssueLog } from '../schemas/issue.schema';
import type { DataRoomSummary } from '../schemas/spreadsheet.schema';
import { writeIssuesCSV, writeEvidenceCSV, writePaymentsCSV, writeCapTableCSV, writeDataRoomXLSX } from '../lib/export-engine';

const CWD = process.cwd();
const EXPORTS_DIR = path.join(CWD, 'reports', 'exports');

function loadLatest<T>(dir: string, suffix: string): T | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(suffix)).sort();
  if (files.length === 0) return null;
  try { return JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), 'utf-8')) as T; }
  catch { return null; }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Export                         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n');

  const issueLog = loadLatest<IssueLog>(path.join(CWD, 'reports', 'issues'), '.json');
  if (!issueLog) {
    console.error('  ❌ No issue log found. Run: npm run triage');
    process.exit(1);
  }

  const dataroom = loadLatest<DataRoomSummary>(path.join(CWD, 'reports', 'dataroom'), '.json');

  fs.mkdirSync(EXPORTS_DIR, { recursive: true });

  console.log(`  Issues: ${issueLog.totalIssues}  Evidence items: ${issueLog.evidence.length}`);
  if (dataroom) {
    console.log(`  Payments: ${dataroom.paymentScheduleFindings.length}  Cap table rows: ${dataroom.capTableFindings.length}`);
  }
  console.log('');

  const rel = (p: string) => p.replace(CWD + '/', '');

  console.log(`  ✅ issues.csv       → ${rel(writeIssuesCSV(issueLog, EXPORTS_DIR))}`);
  console.log(`  ✅ evidence.csv     → ${rel(writeEvidenceCSV(issueLog, EXPORTS_DIR))}`);

  if (dataroom) {
    console.log(`  ✅ payments.csv     → ${rel(writePaymentsCSV(dataroom, EXPORTS_DIR))}`);
    console.log(`  ✅ cap-table.csv    → ${rel(writeCapTableCSV(dataroom, EXPORTS_DIR))}`);
    console.log(`  ✅ dataroom-summary.xlsx → ${rel(writeDataRoomXLSX(issueLog, dataroom, EXPORTS_DIR))}`);
  }

  console.log('\n  Export complete. Files saved to reports/exports/\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
