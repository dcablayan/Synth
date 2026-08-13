import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { detectDocumentType, chunkText } from '../src/lib/parser';
import { extractPdfText } from '../src/lib/document-loader';
import { buildTableProfile, type ParsedSheet } from '../src/lib/spreadsheet-parser';
import { generateMockDataRoomSummary } from '../src/lib/mock-spreadsheet-provider';
import { generateMockReview } from '../src/lib/mock-provider';
import { buildIssueLogFromReports, normalizeForMatch } from '../src/lib/issue-engine';
import { compareIssueLogs, compareDataRooms } from '../src/lib/compare-engine';
import { calculateRiskScore, deriveRiskLevel, reconcileRisk } from '../src/lib/risk-scoring';
import { reportStem } from '../src/lib/report-writer';
import { runContractReview } from '../src/lib/ai-provider';
import { ReviewSchema } from '../src/schemas/review.schema';
import { IssueLogSchema, type IssueLog } from '../src/schemas/issue.schema';
import type { DataRoomSummary, SpreadsheetAnalysis } from '../src/schemas/spreadsheet.schema';

// These tests exercise mock mode; never let a real key leak in.
delete process.env.OPENAI_API_KEY;

test('pdf-parse v2: extractPdfText reads a real PDF', async () => {
  const pdfPath = path.join(process.cwd(), 'public', 'demo-artifacts', 'demo-review.pdf');
  const text = await extractPdfText(pdfPath);
  assert.ok(text.trim().length > 100, `expected >100 chars, got ${text.trim().length}`);
});

test('document type: "nda" only matches as a whole word', () => {
  const partnership =
    'PARTNERSHIP AGREEMENT\nThis Partnership Agreement is made between Alpha LLC and Beta LLC.\n' +
    'The parties agree to standard accounting practices and revenue sharing agreement terms.';
  assert.equal(detectDocumentType(partnership), 'Partnership Agreement');
  assert.equal(detectDocumentType('please check the calendar for dates'), 'Other');
  assert.equal(detectDocumentType('This NDA protects proprietary information.'), 'NDA');
  assert.equal(detectDocumentType('Mutual non-disclosure agreement between the parties.'), 'NDA');
});

test('column typing: bare integers and years are numbers, not currency', () => {
  const sheet: ParsedSheet = {
    sheetName: 'S',
    headers: ['Investor', 'Year', 'Shares', 'Amount'],
    rows: [
      ['Alice', '2021', '1,000', '$100.00'],
      ['Bob', '2022', '2,000', '$250.50'],
      ['Carol', '2023', '3,000', '(75.25)'],
    ],
  };
  const profile = buildTableProfile(sheet);
  assert.notEqual(profile.columns[1].type, 'currency');
  assert.notEqual(profile.columns[2].type, 'currency');
  assert.equal(profile.columns[3].type, 'currency');
  assert.ok(!profile.detectedAmounts.includes('2021'), 'years must not appear in detectedAmounts');
});

test('payment findings: all rows scanned, vendor taken from the vendor column', () => {
  const rows = Array.from({ length: 20 }, (_, i) => [
    `Vendor${i + 1}`, `$${i + 1}00.00`, '2026-01-01', i >= 15 ? 'Overdue' : 'Paid',
  ]);
  const sheet: ParsedSheet = { sheetName: 'S', headers: ['Vendor', 'Amount', 'Due Date', 'Status'], rows };
  const dr = generateMockDataRoomSummary(
    [{ filename: 'contract.txt', text: 'Payment terms: net 30.' }],
    [{ filename: 'pay.csv', sheets: [sheet], profiles: [buildTableProfile(sheet)] }],
    [],
  );
  assert.equal(dr.paymentScheduleFindings.length, 20);
  assert.equal(dr.paymentScheduleFindings.filter((p) => /overdue/i.test(p.status)).length, 5);

  const shifted: ParsedSheet = {
    sheetName: 'S',
    headers: ['Invoice #', 'Due Date', 'Vendor', 'Amount', 'Status'],
    rows: [['INV-001', '2026-01-01', 'Acme Corp', '$500.00', 'Overdue']],
  };
  const dr2 = generateMockDataRoomSummary(
    [{ filename: 'contract.txt', text: 'x' }],
    [{ filename: 'pay.csv', sheets: [shifted], profiles: [buildTableProfile(shifted)] }],
    [],
  );
  const finding = dr2.crossDocumentFindings.find((f) => f.findingType === 'payment-mismatch');
  assert.ok(finding, 'expected an overdue payment finding');
  assert.ok(finding.valueB.includes('Acme Corp'), `expected vendor name, got "${finding.valueB}"`);
});

test('evidence verification: quotes are verified against source text, placeholders are not', () => {
  const sourceText =
    'MASTER AGREEMENT\nThis agreement renews automatically for successive one-year terms unless cancelled. ' +
    'In no event shall either party be liable for more than the fees paid in the prior twelve months.';
  const review = ReviewSchema.parse({
    ...generateMockReview(sourceText, 'Master Agreement'),
    sourceFilename: 'master.txt',
  });
  const log = buildIssueLogFromReports([review], [], [], ['r'], new Map([['master.txt', sourceText]]));

  const verified = log.evidence.filter((e) => e.isVerified && e.documentQuote.length > 0);
  assert.ok(verified.length > 0, 'expected at least one verified quote from real clause text');
  for (const e of verified) {
    assert.ok(
      normalizeForMatch(sourceText).includes(normalizeForMatch(e.documentQuote)),
      `verified quote must appear in source: "${e.documentQuote}"`,
    );
  }

  // A document without those clauses gets NOT_FOUND sentinels — never verified.
  const bare = 'Short agreement with no liability or renewal language at all.';
  const bareReview = ReviewSchema.parse({
    ...generateMockReview(bare, 'Bare Doc'),
    sourceFilename: 'bare.txt',
  });
  const bareLog = buildIssueLogFromReports([bareReview], [], [], ['r'], new Map([['bare.txt', bare]]));
  const falselyVerified = bareLog.evidence.filter(
    (e) => e.isVerified && e.documentQuote.length > 0 && !normalizeForMatch(bare).includes(normalizeForMatch(e.documentQuote)),
  );
  assert.equal(falselyVerified.length, 0);
  const unverified = bareLog.evidence.filter((e) => !e.isVerified);
  assert.ok(unverified.every((e) => !!e.verificationNote), 'unverified evidence must carry a note');

  // Without any source text, nothing can be claimed verified.
  const noSourceLog = buildIssueLogFromReports([review], [], [], ['r']);
  assert.ok(noSourceLog.evidence.filter((e) => e.documentQuote.length > 0).every((e) => !e.isVerified));
});

test('issue log: the same warning from dataroom and spreadsheet paths yields one issue', () => {
  const warning = 'High blank cell rate: 40% of cells are empty';
  const dataroom: DataRoomSummary = {
    title: 'DR', generatedAt: 'now', fileCount: 1,
    fileTypes: [{ ext: '.csv', count: 1 }],
    documents: [{ filename: 'pay.csv', type: 'spreadsheet', category: 'spreadsheet' }],
    crossDocumentFindings: [], paymentScheduleFindings: [], capTableFindings: [],
    dataQualityWarnings: [warning],
    executiveSummary: 'x', disclaimer: 'not legal advice', providerMode: 'mock', fallbackUsed: false,
  };
  const sheet: SpreadsheetAnalysis = {
    documentTitle: 'pay', sourceFilename: 'pay.csv', sourceExtension: '.csv', sheetCount: 1, totalRows: 5,
    tables: [], summary: 'x', keyFindings: [], warnings: [warning],
    generatedAt: 'now', disclaimer: 'not legal advice', providerMode: 'mock', fallbackUsed: false,
  };
  const log = buildIssueLogFromReports([], [sheet], [dataroom], ['a', 'b']);
  assert.equal(log.totalIssues, 1, `expected 1 issue, got: ${log.issues.map((i) => i.title).join(' | ')}`);
});

function mkIssueLog(logId: string, issues: Array<{ id: string; severity: 'Low' | 'Medium' | 'High' | 'Critical'; status?: string; title?: string }>): IssueLog {
  return IssueLogSchema.parse({
    logId, title: 'Log', generatedAt: 'now', sourceReports: [],
    issues: issues.map((i) => ({
      id: i.id, title: i.title ?? 'Overdue Payment: Acme', severity: i.severity, category: 'payment',
      status: i.status ?? 'open', sourceFiles: [], evidenceQuotes: [], affectedRows: [],
      recommendation: 'r', createdAt: 'c', updatedAt: 'u', evidenceIds: ['e'],
    })),
    evidence: [],
    totalIssues: issues.length, openCount: issues.length, criticalCount: 0, highCount: 0,
    disclaimer: 'not legal advice',
  });
}

test('compare: duplicate-titled issues diff as a multiset without fabricated changes', () => {
  const logA = mkIssueLog('a', [{ id: '1', severity: 'High' }, { id: '2', severity: 'Critical' }]);
  const logB = mkIssueLog('b', [{ id: '3', severity: 'High' }]);
  const diff = compareIssueLogs(logA, logB);
  assert.equal(diff.changedIssues.length, 0, `fabricated changes: ${JSON.stringify(diff.changedIssues)}`);
  assert.equal(diff.removedIssues.length, 1);
  assert.equal(diff.removedIssues[0].severity, 'Critical');
  assert.equal(diff.addedIssues.length, 0);

  // A genuine status flip is still reported.
  const logC = mkIssueLog('c', [{ id: '4', severity: 'High', status: 'resolved' }]);
  const diff2 = compareIssueLogs(logB, logC);
  assert.deepEqual(diff2.changedIssues.map((c) => `${c.field}:${c.from}->${c.to}`), ['status:open->resolved']);
});

test('compare: multi-invoice vendors do not collapse', () => {
  const mkRoom = (payments: Array<[string, string, string, string]>): DataRoomSummary => ({
    title: 'DR', generatedAt: 'now', fileCount: 1, fileTypes: [], documents: [],
    crossDocumentFindings: [],
    paymentScheduleFindings: payments.map(([vendor, amount, dueDate, status]) => ({ vendor, amount, dueDate, status, sourceFile: 'p.csv' })),
    capTableFindings: [], dataQualityWarnings: [], executiveSummary: 'x', disclaimer: 'd',
  });
  const roomA = mkRoom([['Acme', '$100', '2026-01-01', 'Paid'], ['Acme', '$900', '2026-02-01', 'Overdue'], ['Zeta', '$50', '2026-01-15', 'Paid']]);
  const identical = compareDataRooms(roomA, mkRoom([['Acme', '$100', '2026-01-01', 'Paid'], ['Acme', '$900', '2026-02-01', 'Overdue'], ['Zeta', '$50', '2026-01-15', 'Paid']]));
  assert.equal(identical.paymentChanges.length, 0);

  // Resolving one of Acme's two invoices is a removal, not a mutation of the other.
  const roomB = mkRoom([['Acme', '$100', '2026-01-01', 'Paid'], ['Zeta', '$50', '2026-01-15', 'Paid']]);
  const diff = compareDataRooms(roomA, roomB);
  assert.deepEqual(diff.paymentChanges.map((p) => `${p.vendor}:${p.change}:${p.amountA}`), ['Acme:removed:$900']);
});

test('risk scoring: level never sits below the worst individual risk', () => {
  const critical = [{ title: 'x', severity: 'Critical' as const, explanation: '', whyItMatters: '', suggestedNextStep: '', supportingQuote: '' }];
  const score = calculateRiskScore(critical);
  assert.notEqual(deriveRiskLevel(critical, score), 'Low');

  const reconciled = reconcileRisk(2, 'Low', critical);
  assert.equal(reconciled.riskLevel, 'Critical');
  assert.ok(reconciled.riskScore >= 81, `score lifted into the Critical band, got ${reconciled.riskScore}`);
  assert.ok(reconciled.adjustments.length > 0);

  // A clean, consistent pair is untouched.
  const consistent = reconcileRisk(70, 'High', [{ ...critical[0], severity: 'High' as const }]);
  assert.equal(consistent.riskScore, 70);
  assert.equal(consistent.riskLevel, 'High');
  assert.equal(consistent.adjustments.length, 0);
});

test('truncation: chunked documents surface an explicit warning', async () => {
  const longText = 'AGREEMENT between A and B. ' + 'This clause continues. '.repeat(1000);
  const chunked = chunkText(longText);
  assert.ok(chunked.length < longText.length, 'fixture must exceed the chunk window');
  const review = await runContractReview(chunked, 'Long Doc', {
    parsedCharacterCount: chunked.length,
    originalCharacterCount: longText.length,
  });
  assert.ok((review.warnings ?? []).some((w) => /truncated/i.test(w)), `warnings=${JSON.stringify(review.warnings)}`);
});

test('repeated vendors are detected from raw occurrences, not a deduplicated list', () => {
  const sheet: ParsedSheet = {
    sheetName: 'S',
    headers: ['Vendor', 'Amount', 'Due Date', 'Status'],
    rows: [
      ['Acme Corp', '$100.00', '2026-01-01', 'Paid'],
      ['Beta LLC', '$200.00', '2026-01-02', 'Paid'],
      ['Acme Corp', '$300.00', '2026-02-01', 'Pending'],
    ],
  };
  const profile = buildTableProfile(sheet);
  assert.deepEqual(profile.repeatedVendors, ['Acme Corp']);
  assert.ok(
    profile.warnings.some((w) => /repeated vendors/i.test(w) && w.includes('Acme Corp')),
    `expected a repeated-vendor warning, got: ${JSON.stringify(profile.warnings)}`,
  );

  const dr = generateMockDataRoomSummary(
    [{ filename: 'contract.txt', text: 'Payment terms: net 30.' }],
    [{ filename: 'pay.csv', sheets: [sheet], profiles: [profile] }],
    [],
  );
  const dup = dr.crossDocumentFindings.find((f) => f.findingType === 'duplicate-vendor');
  assert.ok(dup, 'expected a duplicate-vendor cross-document finding');
  assert.ok(dup.valueA.includes('Acme Corp'));
});

test('same name across two name columns in one row is not a duplicate; email columns are not entities', () => {
  const sheet: ParsedSheet = {
    sheetName: 'S',
    headers: ['Vendor Name', 'Company', 'Vendor Email', 'Amount'],
    rows: [
      ['Acme Corp', 'Acme Corp', 'billing@acme.com', '$100.00'],
      ['Beta LLC', 'Beta LLC', 'ap@beta.com', '$200.00'],
    ],
  };
  const profile = buildTableProfile(sheet);
  assert.deepEqual(profile.repeatedVendors, [], 'cross-column repetition within a row is not a duplicate');
  assert.ok(!profile.detectedEntities.some((e) => e.includes('@')), `emails leaked into entities: ${JSON.stringify(profile.detectedEntities)}`);
  assert.ok(profile.detectedEmails.includes('billing@acme.com'));
});

test('cap table findings skip footer/metadata rows with no holding data', () => {
  const sheet: ParsedSheet = {
    sheetName: 'Cap Table',
    headers: ['Investor', 'Share Class', 'Shares', 'Ownership %'],
    rows: [
      ['Founders', 'Common', '4000000', '40.00%'],
      ['Sequoia Capital', 'Series A Preferred', '1500000', '15.00%'],
      ['Post-money valuation: $50000000.00', '', '', ''],
      ['Liquidation preference: 1x non-participating', '', '', ''],
    ],
  };
  const dr = generateMockDataRoomSummary(
    [],
    [{ filename: 'cap.csv', sheets: [sheet], profiles: [buildTableProfile(sheet)] }],
    [],
  );
  assert.deepEqual(
    dr.capTableFindings.map((c) => c.investor),
    ['Founders', 'Sequoia Capital'],
    'metadata rows must not appear as investors',
  );
});

test('payment findings prefer an explicit due-date column over an invoice-date column', () => {
  const sheet: ParsedSheet = {
    sheetName: 'S',
    headers: ['Invoice Date', 'Vendor', 'Amount', 'Due Date', 'Status'],
    rows: [['2026-01-05', 'Acme Corp', '$500.00', '2026-02-04', 'Pending']],
  };
  const dr = generateMockDataRoomSummary(
    [],
    [{ filename: 'pay.csv', sheets: [sheet], profiles: [buildTableProfile(sheet)] }],
    [],
  );
  assert.equal(dr.paymentScheduleFindings[0].dueDate, '2026-02-04');
});

test('report stems disambiguate by source file', () => {
  assert.equal(reportStem('Service Agreement', 'acme-msa.txt'), 'service-agreement--acme-msa');
  assert.notEqual(reportStem('Service Agreement', 'acme-msa.txt'), reportStem('Service Agreement', 'globex-msa.txt'));
  assert.equal(reportStem('Service Agreement'), 'service-agreement');
});
