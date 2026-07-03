import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import readXlsxFile from 'read-excel-file/node';
import {
  writeCapTableCSV,
  writeDataRoomXLSX,
  writeEvidenceCSV,
  writeIssuesCSV,
  writePaymentsCSV,
} from '../src/lib/export-engine';
import { listRegularFiles, resolveInside, resolveRegularFileInside, safeFileStem } from '../src/lib/path-safety';
import { parseCsvFile, SPREADSHEET_LIMITS } from '../src/lib/spreadsheet-parser';
import {
  renderFinancialHTML,
  renderFullPacketHTML,
  renderMemoHTML,
  renderRevisionHTML,
  renderReviewHTML,
} from '../src/lib/html-renderer';
import { renderDataRoomHtml } from '../src/cli/dataroom';
import { renderSpreadsheetHtml } from '../src/cli/spreadsheet';
import { renderHtml as renderTriageHtml } from '../src/cli/triage';
import { renderHtml as renderCompareHtml } from '../src/cli/compare';
import type { Financial } from '../src/schemas/financial.schema';
import type { IssueLog, CompareReport } from '../src/schemas/issue.schema';
import type { Memo } from '../src/schemas/memo.schema';
import type { Revision } from '../src/schemas/revision.schema';
import type { Review } from '../src/schemas/review.schema';
import type { DataRoomSummary, SpreadsheetAnalysis } from '../src/schemas/spreadsheet.schema';

const HTML_PAYLOAD = '<img src=x onerror=alert(1)>';
const FORMULA_PAYLOAD = '=HYPERLINK("https://evil.example","open")';

function assertEscaped(html: string): void {
  assert.equal(html.includes(HTML_PAYLOAD), false);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
}

function makeReview(): Review {
  return {
    documentTitle: HTML_PAYLOAD,
    documentType: 'Other',
    parties: [HTML_PAYLOAD],
    executiveSummary: HTML_PAYLOAD,
    keyDates: [{ label: HTML_PAYLOAD, date: HTML_PAYLOAD }],
    paymentTerms: HTML_PAYLOAD,
    renewalTerms: HTML_PAYLOAD,
    terminationTerms: HTML_PAYLOAD,
    liabilityIssues: HTML_PAYLOAD,
    indemnificationIssues: HTML_PAYLOAD,
    confidentialityTerms: HTML_PAYLOAD,
    governingLaw: HTML_PAYLOAD,
    missingClauses: [HTML_PAYLOAD],
    unusualClauses: [HTML_PAYLOAD],
    riskScore: 75,
    riskLevel: 'High',
    topRisks: [{
      title: HTML_PAYLOAD,
      severity: 'High',
      explanation: HTML_PAYLOAD,
      whyItMatters: HTML_PAYLOAD,
      suggestedNextStep: HTML_PAYLOAD,
      supportingQuote: HTML_PAYLOAD,
    }],
    actionItems: [HTML_PAYLOAD],
    citations: [{ section: HTML_PAYLOAD, quote: HTML_PAYLOAD, relevance: HTML_PAYLOAD }],
    generatedAt: '2026-07-03T00:00:00.000Z',
    disclaimer: 'not advice',
  };
}

function makeFinancial(): Financial {
  return {
    documentTitle: HTML_PAYLOAD,
    totalContractValue: HTML_PAYLOAD,
    recurringFees: HTML_PAYLOAD,
    oneTimeFees: HTML_PAYLOAD,
    paymentSchedule: HTML_PAYLOAD,
    lateFees: HTML_PAYLOAD,
    penalties: HTML_PAYLOAD,
    discounts: HTML_PAYLOAD,
    equityTerms: HTML_PAYLOAD,
    revenueShare: HTML_PAYLOAD,
    refundTerms: HTML_PAYLOAD,
    renewalCostChanges: HTML_PAYLOAD,
    financialRedFlags: [{ issue: HTML_PAYLOAD, explanation: HTML_PAYLOAD, severity: 'High', supportingQuote: HTML_PAYLOAD }],
    citations: [{ section: HTML_PAYLOAD, quote: HTML_PAYLOAD, relevance: HTML_PAYLOAD }],
    generatedAt: '2026-07-03T00:00:00.000Z',
    disclaimer: 'not advice',
  };
}

function makeMemo(): Memo {
  return {
    documentTitle: HTML_PAYLOAD,
    memoDate: HTML_PAYLOAD,
    executiveSummary: HTML_PAYLOAD,
    biggestRisks: [{ risk: HTML_PAYLOAD, severity: 'High', explanation: HTML_PAYLOAD }],
    financialObligations: [HTML_PAYLOAD],
    importantDeadlines: [{ label: HTML_PAYLOAD, date: HTML_PAYLOAD }],
    questionsForLawyer: [HTML_PAYLOAD],
    actionItems: [HTML_PAYLOAD],
    disclaimer: 'not advice',
    generatedAt: '2026-07-03T00:00:00.000Z',
  };
}

function makeRevision(): Revision {
  return {
    documentTitle: HTML_PAYLOAD,
    revisionSummary: HTML_PAYLOAD,
    priorityChanges: [HTML_PAYLOAD],
    clauseRevisions: [{
      section: HTML_PAYLOAD,
      originalLanguage: HTML_PAYLOAD,
      issue: HTML_PAYLOAD,
      suggestedReplacementLanguage: HTML_PAYLOAD,
      whyItMatters: HTML_PAYLOAD,
      severity: 'High',
      supportingQuote: HTML_PAYLOAD,
    }],
    negotiationNotes: [HTML_PAYLOAD],
    lawyerQuestions: [HTML_PAYLOAD],
    revisionDisclaimer: HTML_PAYLOAD,
    generatedAt: '2026-07-03T00:00:00.000Z',
  };
}

function makeIssueLog(): IssueLog {
  return {
    logId: FORMULA_PAYLOAD,
    title: HTML_PAYLOAD,
    generatedAt: '2026-07-03T00:00:00.000Z',
    sourceReports: [HTML_PAYLOAD],
    issues: [{
      id: FORMULA_PAYLOAD,
      title: FORMULA_PAYLOAD,
      severity: 'High',
      category: 'financial',
      status: 'open',
      sourceFiles: ['+source.csv'],
      evidenceQuotes: [HTML_PAYLOAD],
      affectedRows: ['@row'],
      recommendation: '-call analyst',
      createdAt: '@created',
      updatedAt: '+updated',
      evidenceIds: ['\tE-1'],
    }],
    evidence: [{
      evidenceId: '=E-1',
      issueId: '+ISS-1',
      documentQuote: FORMULA_PAYLOAD,
      spreadsheetRow: '-row value',
      sourceFilename: '@source.csv',
      isVerified: false,
      verificationNote: '\tnote',
    }],
    totalIssues: 1,
    openCount: 1,
    criticalCount: 0,
    highCount: 1,
    disclaimer: 'not advice',
  };
}

function makeDataRoom(): DataRoomSummary {
  return {
    title: FORMULA_PAYLOAD,
    generatedAt: '2026-07-03T00:00:00.000Z',
    fileCount: 1,
    fileTypes: [{ ext: HTML_PAYLOAD, count: 1 }],
    documents: [{ filename: HTML_PAYLOAD, type: HTML_PAYLOAD, category: 'spreadsheet', rowCount: 1 }],
    crossDocumentFindings: [{
      findingType: 'payment-mismatch',
      severity: 'High',
      title: HTML_PAYLOAD,
      description: HTML_PAYLOAD,
      sourceA: HTML_PAYLOAD,
      sourceB: HTML_PAYLOAD,
      valueA: HTML_PAYLOAD,
      valueB: HTML_PAYLOAD,
      recommendation: HTML_PAYLOAD,
    }],
    paymentScheduleFindings: [{
      vendor: FORMULA_PAYLOAD,
      amount: '+100',
      dueDate: '-2026-07-03',
      status: '@overdue',
      sourceFile: '\tpayment.csv',
      contractMatch: '=match',
      mismatch: '+mismatch',
    }],
    capTableFindings: [{
      investor: FORMULA_PAYLOAD,
      shareClass: '+Preferred',
      shares: '-100',
      ownershipPct: '@50%',
      sourceFile: '\tcap.csv',
      termSheetMatch: '=yes',
      discrepancy: '+none',
    }],
    dataQualityWarnings: [HTML_PAYLOAD],
    executiveSummary: HTML_PAYLOAD,
    providerMode: 'mock',
    disclaimer: FORMULA_PAYLOAD,
  };
}

function makeSpreadsheetAnalysis(): SpreadsheetAnalysis {
  return {
    documentTitle: HTML_PAYLOAD,
    sourceFilename: HTML_PAYLOAD,
    sourceExtension: HTML_PAYLOAD,
    sheetCount: 1,
    totalRows: 1,
    tables: [{
      sheetName: HTML_PAYLOAD,
      rowCount: 1,
      columnCount: 1,
      columns: [{
        name: HTML_PAYLOAD,
        type: 'string',
        sampleValues: [HTML_PAYLOAD],
        uniqueCount: 1,
        blankCount: 0,
      }],
      detectedEntities: [HTML_PAYLOAD],
      detectedAmounts: [HTML_PAYLOAD],
      detectedDates: [HTML_PAYLOAD],
      detectedEmails: [],
      repeatedVendors: [HTML_PAYLOAD],
      totalAmounts: [{ label: HTML_PAYLOAD, amount: HTML_PAYLOAD }],
      isPaymentSchedule: true,
      isCapTable: false,
      isInvoice: false,
      isVendorList: false,
      warnings: [HTML_PAYLOAD],
    }],
    summary: HTML_PAYLOAD,
    keyFindings: [HTML_PAYLOAD],
    warnings: [HTML_PAYLOAD],
    providerMode: 'mock',
    generatedAt: '2026-07-03T00:00:00.000Z',
    disclaimer: 'not advice',
  };
}

function makeCompareReport(): CompareReport {
  return {
    reportId: HTML_PAYLOAD,
    generatedAt: '2026-07-03T00:00:00.000Z',
    sourceA: HTML_PAYLOAD,
    sourceB: HTML_PAYLOAD,
    addedIssues: makeIssueLog().issues,
    removedIssues: makeIssueLog().issues,
    changedIssues: [{ issueId: 'ISS-1', title: HTML_PAYLOAD, field: HTML_PAYLOAD, from: HTML_PAYLOAD, to: HTML_PAYLOAD }],
    paymentChanges: [{ vendor: HTML_PAYLOAD, amountA: HTML_PAYLOAD, amountB: HTML_PAYLOAD, statusA: HTML_PAYLOAD, statusB: HTML_PAYLOAD, change: HTML_PAYLOAD }],
    capTableChanges: [{ investor: HTML_PAYLOAD, changeType: 'changed', detail: HTML_PAYLOAD }],
    newWarnings: [HTML_PAYLOAD],
    resolvedWarnings: [HTML_PAYLOAD],
    disclaimer: 'not advice',
  };
}

test('HTML renderers escape untrusted report content', () => {
  const review = makeReview();
  const financial = makeFinancial();
  const memo = makeMemo();
  const revision = makeRevision();

  [
    renderReviewHTML(review),
    renderFinancialHTML(financial),
    renderMemoHTML(memo),
    renderRevisionHTML(revision),
    renderFullPacketHTML(review, financial, memo, revision),
    renderDataRoomHtml(makeDataRoom()),
    renderSpreadsheetHtml(makeSpreadsheetAnalysis()),
    renderTriageHtml(makeIssueLog()),
    renderCompareHtml(makeCompareReport()),
  ].forEach(assertEscaped);
});

test('CSV and XLSX exports neutralize spreadsheet formula payloads', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'synth-export-'));
  const issueLog = makeIssueLog();
  const dataroom = makeDataRoom();

  const csvPaths = [
    writeIssuesCSV(issueLog, outputDir),
    writeEvidenceCSV(issueLog, outputDir),
    writePaymentsCSV(dataroom, outputDir),
    writeCapTableCSV(dataroom, outputDir),
  ];

  for (const csvPath of csvPaths) {
    const csv = fs.readFileSync(csvPath, 'utf-8');
    assert.doesNotMatch(csv, /(?:^|,)(?:=|\+|-|@|\t)/m);
    assert.match(csv, /'=|'\+|'-|'@|'\t/);
  }

  const xlsxPath = await writeDataRoomXLSX(issueLog, dataroom, outputDir);
  const workbook = await readXlsxFile(xlsxPath);
  const values = workbook.flatMap((sheet) => sheet.data.flat()).map((cell) => String(cell ?? ''));

  assert(values.some((value) => value.startsWith("'=")));
  assert(values.some((value) => value.startsWith("'+")));
  assert(values.some((value) => value.startsWith("'-")));
  assert(values.some((value) => value.startsWith("'@")));
  assert(values.some((value) => value.startsWith("'\t")));
});

test('path safety rejects traversal and symlinked files', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'synth-path-'));
  const outside = path.join(os.tmpdir(), `synth-outside-${process.pid}-${Date.now()}.txt`);

  try {
    fs.writeFileSync(path.join(base, 'ok.txt'), 'ok');
    fs.writeFileSync(outside, 'secret');
    fs.symlinkSync(outside, path.join(base, 'link.txt'));

    assert.equal(resolveRegularFileInside(base, 'ok.txt'), path.join(base, 'ok.txt'));
    assert.throws(() => resolveInside(base, '../escape.txt'), /path escapes/);
    assert.throws(() => resolveRegularFileInside(base, 'missing.txt'), /file not found/);
    assert.throws(() => resolveRegularFileInside(base, 'link.txt'), /regular file/);
    assert.deepEqual(listRegularFiles(base, () => true), ['ok.txt']);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
    fs.rmSync(outside, { force: true });
  }
});

test('output filename stems are sanitized before writing reports', () => {
  assert.equal(safeFileStem('../evil<script>.html'), 'evil-script');
  assert.equal(safeFileStem('///'), 'report');
  assert.equal(safeFileStem('Quarterly Review Q3 2026.pdf'), 'quarterly-review-q3-2026');
});

test('CSV parsing rejects oversized spreadsheet shapes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synth-csv-limits-'));

  try {
    const wideCsv = path.join(dir, 'wide.csv');
    fs.writeFileSync(
      wideCsv,
      Array.from({ length: SPREADSHEET_LIMITS.maxColumns + 1 }, (_, index) => `h${index}`).join(',') + '\n'
    );
    assert.throws(() => parseCsvFile(wideCsv), /too many columns/);

    const longCellCsv = path.join(dir, 'long-cell.csv');
    fs.writeFileSync(longCellCsv, `header\n${'a'.repeat(SPREADSHEET_LIMITS.maxCellChars + 1)}\n`);
    assert.throws(() => parseCsvFile(longCellCsv), /cell R2C1 is too large/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
