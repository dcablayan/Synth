import fs from 'fs';
import writeXlsxFile, { type Sheet, type SheetData } from 'write-excel-file/node';
import type { IssueLog } from '../schemas/issue.schema';
import type { DataRoomSummary } from '../schemas/spreadsheet.schema';
import { spreadsheetSafeText } from './output-safety';
import { resolveInside } from './path-safety';

function esc(val: string | number | boolean | undefined | null): string {
  const s = spreadsheetSafeText(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
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
  const outPath = resolveInside(outputDir, 'issues.csv', 'issues CSV output');
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
  const outPath = resolveInside(outputDir, 'evidence.csv', 'evidence CSV output');
  fs.writeFileSync(outPath, toCSV([header, ...rows]));
  return outPath;
}

export function writePaymentsCSV(dataroom: DataRoomSummary, outputDir: string): string {
  const header = ['vendor', 'amount', 'dueDate', 'status', 'sourceFile', 'contractMatch', 'mismatch'];
  const rows = dataroom.paymentScheduleFindings.map((p) => [
    p.vendor, p.amount, p.dueDate, p.status, p.sourceFile,
    p.contractMatch ?? '', p.mismatch ?? '',
  ]);
  const outPath = resolveInside(outputDir, 'payments.csv', 'payments CSV output');
  fs.writeFileSync(outPath, toCSV([header, ...rows]));
  return outPath;
}

export function writeCapTableCSV(dataroom: DataRoomSummary, outputDir: string): string {
  const header = ['investor', 'shareClass', 'shares', 'ownershipPct', 'sourceFile', 'termSheetMatch', 'discrepancy'];
  const rows = dataroom.capTableFindings.map((c) => [
    c.investor, c.shareClass, c.shares, c.ownershipPct, c.sourceFile,
    c.termSheetMatch ?? '', c.discrepancy ?? '',
  ]);
  const outPath = resolveInside(outputDir, 'cap-table.csv', 'cap table CSV output');
  fs.writeFileSync(outPath, toCSV([header, ...rows]));
  return outPath;
}

type ExportRow = Record<string, unknown>;

function toSheetData(headers: string[], rows: ExportRow[]): SheetData {
  return [
    headers.map((value) => ({ value, type: String, fontWeight: 'bold' as const })),
    ...rows.map((row) =>
      headers.map((header) => ({
        value: spreadsheetSafeText(row[header]),
        type: String,
      })),
    ),
  ];
}

function sheet(sheetName: string, headers: string[], rows: ExportRow[]): Sheet<Buffer> {
  return {
    sheet: sheetName,
    data: toSheetData(headers, rows),
  };
}

export async function writeDataRoomXLSX(issueLog: IssueLog, dataroom: DataRoomSummary, outputDir: string): Promise<string> {
  const outPath = resolveInside(outputDir, 'dataroom-summary.xlsx', 'dataroom XLSX output');
  const sheets: Sheet<Buffer>[] = [
    sheet(
      'Issues',
      ['ID', 'Title', 'Severity', 'Category', 'Status', 'Source Files', 'Recommendation', 'Created At'],
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
    sheet(
      'Evidence',
      ['Evidence ID', 'Issue ID', 'Source File', 'Document Quote', 'Spreadsheet Row', 'Sheet Name', 'Row Number', 'Field Name', 'Verified', 'Verification Note'],
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
    sheet(
      'Payments',
      ['Vendor', 'Amount', 'Due Date', 'Status', 'Source File', 'Contract Match', 'Mismatch'],
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
    sheet(
      'Cap Table',
      ['Investor', 'Share Class', 'Shares', 'Ownership %', 'Source File', 'Term Sheet Match', 'Discrepancy'],
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
    sheet(
      'Summary',
      ['Field', 'Value'],
      [
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
      ],
    ),
  ];

  await writeXlsxFile(sheets).toFile(outPath);
  return outPath;
}
