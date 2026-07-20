#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import type { z } from 'zod';
import { IssueLogSchema, type IssueLog } from '../schemas/issue.schema';
import { DataRoomSummarySchema, type DataRoomSummary } from '../schemas/spreadsheet.schema';
import { writeIssuesCSV, writeEvidenceCSV, writePaymentsCSV, writeCapTableCSV, writeDataRoomXLSX } from '../lib/export-engine';
import { listRegularFiles, resolveRegularFileInside } from '../lib/path-safety';

const CWD = process.cwd();
const EXPORTS_DIR = path.join(CWD, 'reports', 'exports');

function loadLatest<T>(dir: string, suffix: string, schema: z.ZodType<T>): T | null {
  if (!fs.existsSync(dir)) return null;
  const files = listRegularFiles(dir, (f) => f.endsWith(suffix));
  // Walk newest-first so one corrupted file doesn't blank the export.
  for (let i = files.length - 1; i >= 0; i--) {
    try {
      const filepath = resolveRegularFileInside(dir, files[i], 'report file');
      const parsed = schema.safeParse(JSON.parse(fs.readFileSync(filepath, 'utf-8')));
      if (parsed.success) return parsed.data;
      console.warn(`  ⚠️  Skipping ${files[i]}: does not match the expected schema`);
    }
    catch { /* try the next-newest file */ }
  }
  return null;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Export                         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.\n');

  const issueLog = loadLatest<IssueLog>(path.join(CWD, 'reports', 'issues'), '.json', IssueLogSchema);
  if (!issueLog) {
    console.error('  ❌ No issue log found. Run: npm run triage');
    process.exit(1);
  }

  const dataroom = loadLatest<DataRoomSummary>(path.join(CWD, 'reports', 'dataroom'), '.json', DataRoomSummarySchema);

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
    console.log(`  ✅ dataroom-summary.xlsx → ${rel(await writeDataRoomXLSX(issueLog, dataroom, EXPORTS_DIR))}`);
  }

  console.log('\n  Export complete. Files saved to reports/exports/\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
