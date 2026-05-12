import fs from 'fs';
import path from 'path';
import type { IssueLog } from '../schemas/issue.schema';
import type { DataRoomSummary } from '../schemas/spreadsheet.schema';

function esc(val: string | number | boolean | undefined | null): string {
  const s = val === undefined || val === null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCSV(rows: string[][]): string {
  return rows.map((row) => row.map(esc).join(',')).join('\n');
}

export function writeIssuesCSV(issueLog: IssueLog, outputDir: string): string {
  const header = ['id', 'title', 'severity', 'category', 'status', 'sourceFiles', 'recommendation', 'evidenceIds', 'createdAt'];
  const rows = issueLog.issues.map((i) => [
    i.id,
    i.title,
    i.severity,
    i.category,
    i.status,
    i.sourceFiles.join('; '),
    i.recommendation,
    i.evidenceIds.join('; '),
    i.createdAt,
  ]);
  const outPath = path.join(outputDir, 'issues.csv');
  fs.writeFileSync(outPath, toCSV([header, ...rows]));
  return outPath;
}

export function writeEvidenceCSV(issueLog: IssueLog, outputDir: string): string {
  const header = [
    'evidenceId', 'issueId', 'sourceFilename', 'documentQuote',
    'spreadsheetRow', 'sheetName', 'rowNumber', 'fieldName',
    'isVerified', 'verificationNote',
  ];
  const rows = issueLog.evidence.map((e) => [
    e.evidenceId,
    e.issueId,
    e.sourceFilename,
    e.documentQuote,
    e.spreadsheetRow ?? '',
    e.sheetName ?? '',
    e.rowNumber !== undefined ? String(e.rowNumber) : '',
    e.fieldName ?? '',
    e.isVerified ? 'true' : 'false',
    e.verificationNote ?? '',
  ]);
  const outPath = path.join(outputDir, 'evidence.csv');
  fs.writeFileSync(outPath, toCSV([header, ...rows]));
  return outPath;
}

export function writePaymentsCSV(dataroom: DataRoomSummary, outputDir: string): string {
  const header = ['vendor', 'amount', 'dueDate', 'status', 'sourceFile', 'contractMatch', 'mismatch'];
  const rows = dataroom.paymentScheduleFindings.map((p) => [
    p.vendor, p.amount, p.dueDate, p.status, p.sourceFile,
    p.contractMatch ?? '', p.mismatch ?? '',
  ]);
  const outPath = path.join(outputDir, 'payments.csv');
  fs.writeFileSync(outPath, toCSV([header, ...rows]));
  return outPath;
}

export function writeCapTableCSV(dataroom: DataRoomSummary, outputDir: string): string {
  const header = ['investor', 'shareClass', 'shares', 'ownershipPct', 'sourceFile', 'termSheetMatch', 'discrepancy'];
  const rows = dataroom.capTableFindings.map((c) => [
    c.investor, c.shareClass, c.shares, c.ownershipPct, c.sourceFile,
    c.termSheetMatch ?? '', c.discrepancy ?? '',
  ]);
  const outPath = path.join(outputDir, 'cap-table.csv');
  fs.writeFileSync(outPath, toCSV([header, ...rows]));
  return outPath;
}

export function writeDataRoomXLSX(issueLog: IssueLog, dataroom: DataRoomSummary, outputDir: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx') as typeof import('xlsx');

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      issueLog.issues.map((i) => ({
        ID: i.id,
        Title: i.title,
        Severity: i.severity,
        Category: i.category,
        Status: i.status,
        'Source Files': i.sourceFiles.join('; '),
        Recommendation: i.recommendation,
        'Created At': i.createdAt,
      })),
    ),
    'Issues',
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      issueLog.evidence.map((e) => ({
        'Evidence ID': e.evidenceId,
        'Issue ID': e.issueId,
        'Source File': e.sourceFilename,
        'Document Quote': e.documentQuote,
        'Spreadsheet Row': e.spreadsheetRow ?? '',
        'Sheet Name': e.sheetName ?? '',
        'Row Number': e.rowNumber ?? '',
        'Field Name': e.fieldName ?? '',
        Verified: e.isVerified ? 'Yes' : 'No',
        'Verification Note': e.verificationNote ?? '',
      })),
    ),
    'Evidence',
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      dataroom.paymentScheduleFindings.map((p) => ({
        Vendor: p.vendor,
        Amount: p.amount,
        'Due Date': p.dueDate,
        Status: p.status,
        'Source File': p.sourceFile,
        'Contract Match': p.contractMatch ?? '',
        Mismatch: p.mismatch ?? '',
      })),
    ),
    'Payments',
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      dataroom.capTableFindings.map((c) => ({
        Investor: c.investor,
        'Share Class': c.shareClass,
        Shares: c.shares,
        'Ownership %': c.ownershipPct,
        'Source File': c.sourceFile,
        'Term Sheet Match': c.termSheetMatch ?? '',
        Discrepancy: c.discrepancy ?? '',
      })),
    ),
    'Cap Table',
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Field: 'Title', Value: dataroom.title },
      { Field: 'Generated At', Value: dataroom.generatedAt },
      { Field: 'File Count', Value: dataroom.fileCount },
      { Field: 'Total Issues', Value: issueLog.totalIssues },
      { Field: 'Open Issues', Value: issueLog.openCount },
      { Field: 'Critical Issues', Value: issueLog.criticalCount },
      { Field: 'High Issues', Value: issueLog.highCount },
      { Field: 'Cross-Doc Findings', Value: dataroom.crossDocumentFindings.length },
      { Field: 'Payment Items', Value: dataroom.paymentScheduleFindings.length },
      { Field: 'Cap Table Rows', Value: dataroom.capTableFindings.length },
      { Field: 'Executive Summary', Value: dataroom.executiveSummary },
      { Field: 'Disclaimer', Value: dataroom.disclaimer },
    ]),
    'Summary',
  );

  const outPath = path.join(outputDir, 'dataroom-summary.xlsx');
  XLSX.writeFile(wb, outPath);
  return outPath;
}
