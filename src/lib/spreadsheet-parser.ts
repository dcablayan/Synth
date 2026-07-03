import fs from 'fs';
import readXlsxFile from 'read-excel-file/node';
import { parse as parseCsv } from 'csv-parse/sync';
import type { TableProfile, ColumnProfile } from '../schemas/spreadsheet.schema';

const NOT_FOUND = 'Not found in the document.';
const DEFAULT_MAX_SPREADSHEET_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_ROWS = 10_000;
const DEFAULT_MAX_COLUMNS = 200;
const DEFAULT_MAX_CELL_CHARS = 20_000;

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const SPREADSHEET_LIMITS = {
  maxBytes: readPositiveIntEnv('SYNTH_MAX_SPREADSHEET_BYTES', DEFAULT_MAX_SPREADSHEET_BYTES),
  maxRows: readPositiveIntEnv('SYNTH_MAX_SPREADSHEET_ROWS', DEFAULT_MAX_ROWS),
  maxColumns: readPositiveIntEnv('SYNTH_MAX_SPREADSHEET_COLUMNS', DEFAULT_MAX_COLUMNS),
  maxCellChars: readPositiveIntEnv('SYNTH_MAX_SPREADSHEET_CELL_CHARS', DEFAULT_MAX_CELL_CHARS),
};

const CURRENCY_RE = /^\$?[\d,]+(\.\d{1,2})?$|^\(?\$?[\d,]+(\.\d{1,2})?\)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$|^[A-Z][a-z]+ \d{1,2},? \d{4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function detectColumnType(samples: string[]): ColumnProfile['type'] {
  const nonEmpty = samples.filter((s) => s.trim().length > 0);
  if (nonEmpty.length === 0) return 'unknown';
  const currencyCount = nonEmpty.filter((s) => CURRENCY_RE.test(s.trim())).length;
  if (currencyCount / nonEmpty.length > 0.7) return 'currency';
  const dateCount = nonEmpty.filter((s) => DATE_RE.test(s.trim())).length;
  if (dateCount / nonEmpty.length > 0.7) return 'date';
  const emailCount = nonEmpty.filter((s) => EMAIL_RE.test(s.trim())).length;
  if (emailCount / nonEmpty.length > 0.7) return 'email';
  const numCount = nonEmpty.filter((s) => !isNaN(Number(s.replace(/[$,]/g, '').trim())) && s.trim().length > 0).length;
  if (numCount / nonEmpty.length > 0.7) return 'number';
  return 'string';
}

function extractCurrencyValue(val: string): number | null {
  const cleaned = val.replace(/[$,\s]/g, '').replace(/[()]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function isCurrencyString(val: string): boolean {
  return CURRENCY_RE.test(val.trim());
}

function normalizeCell(cell: unknown): string {
  if (cell === undefined || cell === null) return '';
  if (cell instanceof Date) return cell.toISOString();
  return String(cell).trim();
}

function enforceFileSize(filepath: string): void {
  const size = fs.statSync(filepath).size;
  if (size > SPREADSHEET_LIMITS.maxBytes) {
    throw new Error(
      `Spreadsheet is too large (${size.toLocaleString()} bytes). ` +
        `Limit is ${SPREADSHEET_LIMITS.maxBytes.toLocaleString()} bytes.`
    );
  }
}

function normalizeRows(rows: unknown[][], sourceLabel: string): string[][] {
  if (rows.length > SPREADSHEET_LIMITS.maxRows + 1) {
    throw new Error(
      `${sourceLabel} has too many rows (${rows.length.toLocaleString()}). ` +
        `Limit is ${SPREADSHEET_LIMITS.maxRows.toLocaleString()} data rows.`
    );
  }

  return rows.map((row, rowIndex) => {
    if (row.length > SPREADSHEET_LIMITS.maxColumns) {
      throw new Error(
        `${sourceLabel} row ${rowIndex + 1} has too many columns (${row.length}). ` +
          `Limit is ${SPREADSHEET_LIMITS.maxColumns}.`
      );
    }

    return row.map((cell, colIndex) => {
      const normalized = normalizeCell(cell);
      if (normalized.length > SPREADSHEET_LIMITS.maxCellChars) {
        throw new Error(
          `${sourceLabel} cell R${rowIndex + 1}C${colIndex + 1} is too large ` +
            `(${normalized.length.toLocaleString()} characters). ` +
            `Limit is ${SPREADSHEET_LIMITS.maxCellChars.toLocaleString()}.`
        );
      }
      return normalized;
    });
  });
}

function detectPaymentSchedule(headers: string[]): boolean {
  const h = headers.join(' ').toLowerCase();
  return (
    (h.includes('invoice') || h.includes('payment') || h.includes('amount') || h.includes('due')) &&
    (h.includes('date') || h.includes('vendor') || h.includes('status'))
  );
}

function detectCapTable(headers: string[]): boolean {
  const h = headers.join(' ').toLowerCase();
  return (
    (h.includes('share') || h.includes('equity') || h.includes('investor') || h.includes('ownership')) &&
    (h.includes('class') || h.includes('percent') || h.includes('%') || h.includes('investment'))
  );
}

function detectInvoice(headers: string[]): boolean {
  const h = headers.join(' ').toLowerCase();
  return (h.includes('invoice') || h.includes('bill')) && (h.includes('total') || h.includes('amount'));
}

function detectVendorList(headers: string[]): boolean {
  const h = headers.join(' ').toLowerCase();
  return h.includes('vendor') || (h.includes('supplier') && h.includes('contact'));
}

function extractEntities(rows: string[][], headers: string[]): string[] {
  const entities: string[] = [];
  const nameColIndices = headers
    .map((h, i) => ({ h: h.toLowerCase(), i }))
    .filter(({ h }) => h.includes('vendor') || h.includes('investor') || h.includes('party') || h.includes('name') || h.includes('company'))
    .map(({ i }) => i);

  for (const row of rows.slice(0, 50)) {
    for (const idx of nameColIndices) {
      const val = row[idx]?.trim();
      if (val && val.length > 2 && val.length < 80 && !/^total/i.test(val) && !/^\$/.test(val)) {
        entities.push(val);
      }
    }
  }
  return [...new Set(entities)].slice(0, 20);
}

function extractAmounts(rows: string[][], headers: string[]): string[] {
  const amounts: string[] = [];
  for (const row of rows) {
    for (const cell of row) {
      if (isCurrencyString(cell) && cell.trim().length > 0) {
        amounts.push(cell.trim());
      }
    }
  }
  return [...new Set(amounts)].slice(0, 20);
}

function extractDates(rows: string[][], headers: string[]): string[] {
  const dates: string[] = [];
  for (const row of rows.slice(0, 50)) {
    for (const cell of row) {
      if (DATE_RE.test(cell.trim()) && cell.trim().length > 0) {
        dates.push(cell.trim());
      }
    }
  }
  return [...new Set(dates)].slice(0, 10);
}

function extractEmails(rows: string[][], headers: string[]): string[] {
  const emails: string[] = [];
  for (const row of rows.slice(0, 50)) {
    for (const cell of row) {
      if (EMAIL_RE.test(cell.trim())) {
        emails.push(cell.trim());
      }
    }
  }
  return [...new Set(emails)].slice(0, 10);
}

function findRepeatedVendors(entities: string[]): string[] {
  const counts = new Map<string, number>();
  for (const e of entities) {
    counts.set(e, (counts.get(e) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, c]) => c > 1).map(([e]) => e);
}

function computeTotals(rows: string[][], headers: string[]): Array<{ label: string; amount: string }> {
  const totals: Array<{ label: string; amount: string }> = [];
  for (const row of rows) {
    const firstCell = row[0]?.toLowerCase().trim() ?? '';
    if (firstCell.includes('total') || firstCell.includes('subtotal') || firstCell.includes('grand total')) {
      for (let i = 1; i < row.length; i++) {
        if (isCurrencyString(row[i])) {
          const label = row[0].trim() + (headers[i] ? ` (${headers[i]})` : '');
          totals.push({ label, amount: row[i].trim() });
        }
      }
    }
  }
  return totals.slice(0, 10);
}

function buildColumnProfiles(rows: string[][], headers: string[]): ColumnProfile[] {
  return headers.map((h, colIdx) => {
    const colValues = rows.map((r) => r[colIdx] ?? '').filter((v) => v.trim().length > 0);
    const blanks = rows.length - colValues.length;
    const uniq = new Set(colValues).size;
    const samples = colValues.slice(0, 5);
    const type = detectColumnType(samples);
    return {
      name: h,
      type,
      sampleValues: samples,
      uniqueCount: uniq,
      blankCount: blanks,
      isCurrencyLike: type === 'currency',
      isDateLike: type === 'date',
    };
  });
}

function buildWarnings(rows: string[][], headers: string[], entities: string[]): string[] {
  const warnings: string[] = [];
  const totalBlanks = rows.reduce((sum, r) => sum + r.filter((c) => c.trim().length === 0).length, 0);
  const totalCells = rows.length * headers.length;
  if (totalBlanks / totalCells > 0.3) {
    warnings.push(`High blank cell rate: ${((totalBlanks / totalCells) * 100).toFixed(0)}% of cells are empty`);
  }
  const repeated = findRepeatedVendors(entities);
  if (repeated.length > 0) {
    warnings.push(`Repeated vendors/parties detected: ${repeated.join(', ')}`);
  }
  const overdue = rows.filter((r) => r.some((c) => /overdue/i.test(c)));
  if (overdue.length > 0) {
    warnings.push(`${overdue.length} row(s) marked as overdue`);
  }
  return warnings;
}

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: string[][];
}

export function parseCsvFile(filepath: string): ParsedSheet[] {
  enforceFileSize(filepath);
  const text = fs.readFileSync(filepath, 'utf-8');
  const rows = normalizeRows(
    parseCsv(text, {
      skip_empty_lines: true,
      relax_column_count: true,
      max_record_size: SPREADSHEET_LIMITS.maxCellChars * Math.min(SPREADSHEET_LIMITS.maxColumns, 20),
    }) as unknown[][],
    'CSV'
  );
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);
  return [{ sheetName: 'Sheet1', headers, rows: dataRows }];
}

export async function parseXlsxFile(filepath: string): Promise<ParsedSheet[]> {
  enforceFileSize(filepath);
  const workbook = await readXlsxFile(filepath, { trim: true });
  return workbook.map(({ sheet: name, data }) => {
    if (data.length === 0) return { sheetName: name, headers: [], rows: [] };
    const normalized = normalizeRows(data as unknown[][], `XLSX sheet "${name}"`);
    const headers = normalized[0].map((h) => h.trim());
    const rows = normalized.slice(1);
    return { sheetName: name, headers, rows };
  });
}

export function buildTableProfile(sheet: ParsedSheet): TableProfile {
  const { sheetName, headers, rows } = sheet;
  const entities = extractEntities(rows, headers);

  return {
    sheetName,
    rowCount: rows.length,
    columnCount: headers.length,
    columns: buildColumnProfiles(rows, headers),
    detectedEntities: entities,
    detectedAmounts: extractAmounts(rows, headers),
    detectedDates: extractDates(rows, headers),
    detectedEmails: extractEmails(rows, headers),
    repeatedVendors: findRepeatedVendors(entities),
    totalAmounts: computeTotals(rows, headers),
    isPaymentSchedule: detectPaymentSchedule(headers),
    isCapTable: detectCapTable(headers),
    isInvoice: detectInvoice(headers),
    isVendorList: detectVendorList(headers),
    warnings: buildWarnings(rows, headers, entities),
  };
}

export function textSummaryOfSheet(sheet: ParsedSheet, profile: TableProfile): string {
  const lines: string[] = [
    `Sheet: ${profile.sheetName}`,
    `Rows: ${profile.rowCount}, Columns: ${profile.columnCount}`,
    `Headers: ${sheet.headers.join(', ')}`,
  ];
  if (profile.detectedEntities.length > 0) {
    lines.push(`Entities: ${profile.detectedEntities.slice(0, 8).join(', ')}`);
  }
  if (profile.detectedAmounts.length > 0) {
    lines.push(`Amounts: ${profile.detectedAmounts.slice(0, 6).join(', ')}`);
  }
  if (profile.detectedDates.length > 0) {
    lines.push(`Dates: ${profile.detectedDates.slice(0, 4).join(', ')}`);
  }
  if (profile.detectedEmails.length > 0) {
    lines.push(`Emails: ${profile.detectedEmails.slice(0, 4).join(', ')}`);
  }
  if (profile.totalAmounts.length > 0) {
    lines.push(`Totals: ${profile.totalAmounts.map((t) => `${t.label}: ${t.amount}`).join(' | ')}`);
  }
  if (profile.repeatedVendors.length > 0) {
    lines.push(`Repeated vendors: ${profile.repeatedVendors.join(', ')}`);
  }
  if (profile.isPaymentSchedule) lines.push('Detected: payment schedule');
  if (profile.isCapTable) lines.push('Detected: cap table');
  if (profile.isInvoice) lines.push('Detected: invoice');
  if (profile.isVendorList) lines.push('Detected: vendor list');
  if (profile.warnings.length > 0) lines.push(`Warnings: ${profile.warnings.join(' | ')}`);

  // include up to 5 data rows
  const sample = sheet.rows.slice(0, 5).map((r) => r.join('\t'));
  if (sample.length > 0) {
    lines.push(`\nSample rows (${Math.min(5, sheet.rows.length)}):`);
    lines.push(...sample);
  }

  return lines.join('\n');
}
