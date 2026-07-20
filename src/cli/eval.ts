#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { chunkText, extractDocumentTitle, detectDocumentType } from '../lib/parser';
import { runContractReview, runFinancialAnalysis, runMemoGeneration, runRevisionGeneration } from '../lib/ai-provider';
import { parseCsvFile, buildTableProfile, type ParsedSheet } from '../lib/spreadsheet-parser';
import { generateMockSpreadsheetAnalysis, generateMockDataRoomSummary } from '../lib/mock-spreadsheet-provider';
import { deriveRiskLevel } from '../lib/risk-scoring';
import { SpreadsheetAnalysisSchema, DataRoomSummarySchema } from '../schemas/spreadsheet.schema';
import { IssueLogSchema } from '../schemas/issue.schema';
import { buildIssueLogFromReports, normalizeForMatch } from '../lib/issue-engine';
import { resolveRegularFileInside } from '../lib/path-safety';

const CWD = process.cwd();
const INBOX = path.join(CWD, 'documents', 'inbox');
const EVALS_DIR = path.join(CWD, 'reports', 'evals');

const NOT_FOUND = 'Not found in the document.';
const GENERIC_SEE_DOC = /^see document/i;

function inboxFile(filename: string): string | null {
  try {
    return resolveRegularFileInside(INBOX, filename, 'evaluation input');
  } catch {
    return null;
  }
}

interface Check {
  name: string;
  pass: boolean;
  message: string;
}

interface DocResult {
  file: string;
  checks: Check[];
  passed: number;
  failed: number;
}

function check(name: string, condition: boolean, pass: string, fail: string): Check {
  return { name, pass: condition, message: condition ? pass : fail };
}

// A risk quote is honest when it is either the NOT_FOUND sentinel or text that
// literally appears in the source document. Anything else is fabricated.
function quoteIsHonest(quote: string, normalizedSource: string): boolean {
  if (quote === NOT_FOUND) return true;
  if (!quote || quote.trim().length === 0) return false;
  return normalizedSource.includes(normalizeForMatch(quote));
}

async function evalDocument(filename: string, expectedType: string): Promise<DocResult> {
  const filepath = inboxFile(filename);
  const checks: Check[] = [];

  // Check 1: File exists and parses
  if (!filepath) {
    return {
      file: filename,
      checks: [{ name: 'File exists', pass: false, message: `File not found or unsafe: ${path.join(INBOX, filename)}` }],
      passed: 0,
      failed: 1,
    };
  }

  const raw = fs.readFileSync(filepath, 'utf-8');
  const text = chunkText(raw);

  checks.push(check(
    'File parses',
    text.length > 100,
    `Parsed ${text.length.toLocaleString()} characters`,
    `Parsed text too short: ${text.length} characters`
  ));

  // Check 2: Document type detection
  const detectedType = detectDocumentType(text);
  checks.push(check(
    'Document type detected correctly',
    detectedType === expectedType,
    `Detected: "${detectedType}"`,
    `Expected "${expectedType}", got "${detectedType}"`
  ));

  // Check 3: Review generates without crash
  let review: Awaited<ReturnType<typeof runContractReview>>;
  try {
    const title = extractDocumentTitle(text, filename);
    const ext = path.extname(filename);
    review = await runContractReview(text, title, {
      sourceFilename: filename,
      sourceExtension: ext,
      parsedCharacterCount: text.length,
    });
    checks.push(check('Review generates', true, 'Review completed successfully', ''));
  } catch (e) {
    checks.push({ name: 'Review generates', pass: false, message: `Review threw: ${e instanceof Error ? e.message : e}` });
    return { file: filename, checks, passed: checks.filter((c) => c.pass).length, failed: checks.filter((c) => !c.pass).length };
  }

  // Check 4: Known fields are present or use NOT_FOUND sentinel (not empty string)
  const knownFields: Array<[keyof typeof review, string]> = [
    ['paymentTerms', 'paymentTerms'],
    ['renewalTerms', 'renewalTerms'],
    ['terminationTerms', 'terminationTerms'],
    ['governingLaw', 'governingLaw'],
  ];
  for (const [field, label] of knownFields) {
    const val = String(review[field] ?? '');
    const honestMissing = val === NOT_FOUND || val.length > 10;
    checks.push(check(
      `${label} is present or honest NOT_FOUND`,
      honestMissing,
      `Value: "${val.slice(0, 60)}"`,
      `Empty or very short value: "${val}"`
    ));
  }

  // Check 5: Missing fields use the correct sentinel (not empty)
  const missingFields = ['discounts', 'equityTerms', 'revenueShare'];
  // These are financial fields — check them after financial analysis
  checks.push(check(
    'Risk score is in range',
    review.riskScore >= 0 && review.riskScore <= 100,
    `Risk score: ${review.riskScore}/100`,
    `Invalid risk score: ${review.riskScore}`
  ));

  // Check 6: every risk quote is real document text or the honest NOT_FOUND
  // sentinel — the check that keeps "evidence-backed" true.
  const normalizedSource = normalizeForMatch(raw);
  const fabricatedQuoteRisks = review.topRisks.filter((r) => !quoteIsHonest(r.supportingQuote, normalizedSource));
  checks.push(check(
    'Risk quotes are document text or honest NOT_FOUND',
    fabricatedQuoteRisks.length === 0,
    `All ${review.topRisks.length} risk quote(s) verified against the source text`,
    `${fabricatedQuoteRisks.length} risk quote(s) not found in the document: ${fabricatedQuoteRisks.map((r) => r.title).join(', ')}`
  ));

  // Check 7: Citations present
  const realCitations = review.citations.filter((c) => c.section !== 'Mock Mode Notice');
  checks.push(check(
    'Citations present',
    realCitations.length > 0 || review.providerMode === 'mock',
    review.providerMode === 'mock' ? 'Mock mode — citations check skipped' : `${realCitations.length} citation(s) found`,
    'No citations found'
  ));

  // Check 8: Provider metadata present
  checks.push(check(
    'Provider metadata attached',
    !!review.providerMode && !!review.sourceFilename,
    `providerMode=${review.providerMode}, sourceFilename=${review.sourceFilename}`,
    'Missing providerMode or sourceFilename'
  ));

  // Check 9: Financial analysis
  let financial: Awaited<ReturnType<typeof runFinancialAnalysis>>;
  try {
    financial = await runFinancialAnalysis(text, review.documentTitle, {
      sourceFilename: filename,
      sourceExtension: path.extname(filename),
      parsedCharacterCount: text.length,
    });
    checks.push(check('Financial analysis generates', true, 'Financial analysis completed', ''));

    // Missing financial fields should be NOT_FOUND, not empty
    for (const field of missingFields) {
      const val = String((financial as Record<string, unknown>)[field] ?? '');
      const honestMissing = val === NOT_FOUND || val.length > 10;
      checks.push(check(
        `Financial.${field} is honest NOT_FOUND or has value`,
        honestMissing,
        `Value: "${val.slice(0, 60)}"`,
        `Empty value for financial.${field}`
      ));
    }
  } catch (e) {
    checks.push({ name: 'Financial analysis generates', pass: false, message: `Financial threw: ${e instanceof Error ? e.message : e}` });
    financial = null as unknown as typeof financial;
  }

  // Check 10: Memo generation
  try {
    const memo = await runMemoGeneration(review);
    checks.push(check('Memo generates', true, 'Memo completed', ''));
    checks.push(check(
      'Memo has lawyer questions',
      memo.questionsForLawyer.length > 0,
      `${memo.questionsForLawyer.length} question(s) for lawyer`,
      'No lawyer questions in memo'
    ));
  } catch (e) {
    checks.push({ name: 'Memo generates', pass: false, message: `Memo threw: ${e instanceof Error ? e.message : e}` });
  }

  // Check 11: Revision generation
  try {
    const revision = await runRevisionGeneration(text, review);
    checks.push(check('Revision generates', true, 'Revision completed', ''));
    checks.push(check(
      'Revision has clause revisions',
      revision.clauseRevisions.length > 0,
      `${revision.clauseRevisions.length} clause revision(s)`,
      'No clause revisions generated'
    ));
    checks.push(check(
      'Revision disclaimer present',
      revision.revisionDisclaimer.includes('not legal advice'),
      'Revision disclaimer intact',
      'Missing "not legal advice" in revision disclaimer'
    ));
  } catch (e) {
    checks.push({ name: 'Revision generates', pass: false, message: `Revision threw: ${e instanceof Error ? e.message : e}` });
  }

  return {
    file: filename,
    checks,
    passed: checks.filter((c) => c.pass).length,
    failed: checks.filter((c) => !c.pass).length,
  };
}

async function evalSpreadsheets(): Promise<DocResult[]> {
  const SPREADSHEETS: Array<{ file: string; expectedType: keyof typeof flags }> = [
    { file: 'sample-payment-schedule.csv', expectedType: 'isPaymentSchedule' },
    { file: 'sample-cap-table.csv', expectedType: 'isCapTable' },
    { file: 'sample-vendor-invoices.csv', expectedType: 'isInvoice' },
  ];

  const flags = {
    isPaymentSchedule: true,
    isCapTable: true,
    isInvoice: true,
  };

  const results: DocResult[] = [];

  for (const { file, expectedType } of SPREADSHEETS) {
    const filepath = inboxFile(file);
    const checks: Check[] = [];

    if (!filepath) {
      results.push({
        file,
        checks: [{ name: 'File exists', pass: false, message: `Not found or unsafe: ${path.join(INBOX, file)}` }],
        passed: 0,
        failed: 1,
      });
      continue;
    }

    // Check 1: Parses without error
    let sheets: ReturnType<typeof parseCsvFile>;
    try {
      sheets = parseCsvFile(filepath);
      checks.push(check('CSV parses', true, `${sheets.length} sheet(s) loaded`, ''));
    } catch (e) {
      checks.push({ name: 'CSV parses', pass: false, message: `Parse error: ${e instanceof Error ? e.message : e}` });
      results.push({ file, checks, passed: 0, failed: 1 });
      continue;
    }

    const profile = buildTableProfile(sheets[0]);

    // Check 2: Headers extracted
    checks.push(check(
      'Headers extracted',
      sheets[0].headers.length > 0,
      `${sheets[0].headers.length} headers: ${sheets[0].headers.slice(0, 4).join(', ')}`,
      'No headers found'
    ));

    // Check 3: Row count > 0
    checks.push(check(
      'Row count > 0',
      profile.rowCount > 0,
      `${profile.rowCount} rows`,
      'No data rows found'
    ));

    // Check 4: Correct type detected
    checks.push(check(
      `Detected as ${expectedType}`,
      profile[expectedType],
      `${expectedType} = true`,
      `${expectedType} not detected (headers: ${sheets[0].headers.join(', ')})`
    ));

    // Check 5: Amounts extracted
    checks.push(check(
      'Currency amounts extracted',
      profile.detectedAmounts.length > 0,
      `${profile.detectedAmounts.length} amount(s): ${profile.detectedAmounts.slice(0, 3).join(', ')}`,
      'No currency amounts found'
    ));

    // Check 6: SpreadsheetAnalysis schema validates
    try {
      const analysis = SpreadsheetAnalysisSchema.parse(
        generateMockSpreadsheetAnalysis(file, sheets, [profile])
      );
      checks.push(check('SpreadsheetAnalysis schema validates', true, `summary: "${analysis.summary.slice(0, 50)}..."`, ''));
      checks.push(check(
        'Disclaimer present',
        analysis.disclaimer.includes('not legal advice'),
        'Disclaimer intact',
        'Missing "not legal advice" in disclaimer'
      ));
      checks.push(check(
        'Key findings generated',
        analysis.keyFindings.length > 0,
        `${analysis.keyFindings.length} finding(s)`,
        'No key findings generated'
      ));
    } catch (e) {
      checks.push({ name: 'SpreadsheetAnalysis schema validates', pass: false, message: `Schema error: ${e instanceof Error ? e.message : e}` });
    }

    results.push({
      file,
      checks,
      passed: checks.filter((c) => c.pass).length,
      failed: checks.filter((c) => !c.pass).length,
    });
  }

  // DataRoom summary eval
  const dataroomChecks: Check[] = [];
  try {
    const contractPath = inboxFile('sample-saas-agreement.txt');
    if (!contractPath) throw new Error('sample-saas-agreement.txt not found or unsafe');
    const contractText = fs.readFileSync(contractPath, 'utf-8');
    const contractDocs = [{ filename: 'sample-saas-agreement.txt', text: contractText }];
    const csvDocs = SPREADSHEETS
      .map(({ file }) => ({ file, filepath: inboxFile(file) }))
      .filter((entry): entry is { file: string; filepath: string } => entry.filepath !== null)
      .map(({ file }) => {
        const filepath = inboxFile(file);
        if (!filepath) throw new Error(`${file} not found or unsafe`);
        const sheets = parseCsvFile(filepath);
        const profiles = sheets.map((s) => buildTableProfile(s));
        return { filename: file, sheets, profiles };
      });

    const dataroom = DataRoomSummarySchema.parse(
      generateMockDataRoomSummary(contractDocs, csvDocs, [])
    );
    dataroomChecks.push(check('DataRoom summary generates', true, `${dataroom.fileCount} files, ${dataroom.crossDocumentFindings.length} finding(s)`, ''));
    dataroomChecks.push(check(
      'DataRoom disclaimer present',
      dataroom.disclaimer.includes('not legal advice'),
      'Disclaimer intact',
      'Missing disclaimer in dataroom'
    ));
    dataroomChecks.push(check(
      'Payment findings present',
      dataroom.paymentScheduleFindings.length > 0,
      `${dataroom.paymentScheduleFindings.length} payment finding(s)`,
      'No payment findings'
    ));
    dataroomChecks.push(check(
      'Cap table findings present',
      dataroom.capTableFindings.length > 0,
      `${dataroom.capTableFindings.length} cap table row(s)`,
      'No cap table findings'
    ));
    dataroomChecks.push(check(
      'Executive summary not generic',
      dataroom.executiveSummary.length > 50 && !GENERIC_SEE_DOC.test(dataroom.executiveSummary),
      `Summary: "${dataroom.executiveSummary.slice(0, 60)}..."`,
      'Executive summary is too short or generic'
    ));
  } catch (e) {
    dataroomChecks.push({ name: 'DataRoom summary generates', pass: false, message: `Error: ${e instanceof Error ? e.message : e}` });
  }
  results.push({
    file: '[DataRoom Summary]',
    checks: dataroomChecks,
    passed: dataroomChecks.filter((c) => c.pass).length,
    failed: dataroomChecks.filter((c) => !c.pass).length,
  });

  return results;
}

async function evalV5(): Promise<DocResult> {
  const checks: Check[] = [];

  // Check 1: Issue engine runs and schema validates
  try {
    const reviewPath = inboxFile('sample-saas-agreement.txt');
    if (!reviewPath) throw new Error('sample-saas-agreement.txt not found or unsafe');
    const reviewText = fs.readFileSync(reviewPath, 'utf-8');
    const contractDocs = [{ filename: 'sample-saas-agreement.txt', text: reviewText }];
    const spreadsheetFiles = ['sample-payment-schedule.csv', 'sample-cap-table.csv'];
    const csvDocs = spreadsheetFiles
      .map((f) => ({ file: f, filepath: inboxFile(f) }))
      .filter((entry): entry is { file: string; filepath: string } => entry.filepath !== null)
      .map(({ file, filepath }) => {
        const sheets = parseCsvFile(filepath);
        const profiles = sheets.map((s) => buildTableProfile(s));
        return { filename: file, sheets, profiles };
      });

    const mockDataRoom = DataRoomSummarySchema.parse(generateMockDataRoomSummary(contractDocs, csvDocs, []));

    const text = chunkText(reviewText);
    const title = extractDocumentTitle(text, 'sample-saas-agreement.txt');
    const review = await runContractReview(text, title, {
      sourceFilename: 'sample-saas-agreement.txt',
      sourceExtension: '.txt',
      parsedCharacterCount: text.length,
    });

    const issueLog = buildIssueLogFromReports(
      [review],
      [],
      [mockDataRoom],
      ['test-review', 'test-dataroom'],
      new Map([
        ['sample-saas-agreement.txt', reviewText],
        [title, reviewText],
      ]),
    );

    checks.push(check(
      'Issue log generates without crash',
      true,
      `Issue log created: ${issueLog.totalIssues} issue(s)`,
      '',
    ));

    // Check 2: Schema validates
    const validated = IssueLogSchema.safeParse(issueLog);
    checks.push(check(
      'Issue log schema validates',
      validated.success,
      `Schema valid: ${issueLog.totalIssues} issues, ${issueLog.evidence.length} evidence items`,
      `Schema error: ${!validated.success ? validated.error?.message?.slice(0, 100) : ''}`,
    ));

    // Check 3: Every issue has at least one evidence item
    const issuesWithEvidence = issueLog.issues.filter((i) => i.evidenceIds.length > 0);
    checks.push(check(
      'Every issue has at least one evidence ID',
      issuesWithEvidence.length === issueLog.issues.length,
      `All ${issueLog.issues.length} issues have evidence`,
      `${issueLog.issues.length - issuesWithEvidence.length} issue(s) missing evidence`,
    ));

    // Check 4: Every evidence item's issueId links to a real issue
    const issueIdSet = new Set(issueLog.issues.map((i) => i.id));
    const orphanEvidence = issueLog.evidence.filter((e) => !issueIdSet.has(e.issueId));
    checks.push(check(
      'All evidence items link to a valid issue ID',
      orphanEvidence.length === 0,
      `${issueLog.evidence.length} evidence items all linked`,
      `${orphanEvidence.length} orphan evidence item(s) with no matching issue`,
    ));

    // Check 5: Unverified items have verificationNote
    const unverifiedWithoutNote = issueLog.evidence.filter((e) => !e.isVerified && !e.verificationNote);
    checks.push(check(
      'Unverified evidence items have verificationNote',
      unverifiedWithoutNote.length === 0,
      'All unverified items have notes',
      `${unverifiedWithoutNote.length} unverified item(s) missing verificationNote`,
    ));

    // Check 5b: "Verified" means it — every verified document quote must appear
    // verbatim (whitespace-insensitive) in the source document text.
    const normalizedSource = normalizeForMatch(reviewText);
    const falselyVerified = issueLog.evidence.filter(
      (e) => e.isVerified && e.documentQuote.length > 0 && !normalizedSource.includes(normalizeForMatch(e.documentQuote))
    );
    checks.push(check(
      'Verified evidence quotes appear in the source document',
      falselyVerified.length === 0,
      'All verified quotes located in source text',
      `${falselyVerified.length} verified quote(s) NOT found in source: ${falselyVerified.map((e) => e.evidenceId).join(', ')}`,
    ));

    // Check 5c: warning-derived issues are not duplicated across the dataroom
    // and per-spreadsheet paths.
    const warningTitles = issueLog.issues
      .filter((i) => i.category === 'data-quality')
      .map((i) => normalizeForMatch(i.title.replace(/^(data quality|spreadsheet warning): /i, '')));
    const duplicateWarnings = warningTitles.filter((t, i) => warningTitles.indexOf(t) !== i);
    checks.push(check(
      'No duplicate warning-derived issues',
      duplicateWarnings.length === 0,
      `${warningTitles.length} unique warning issue(s)`,
      `Duplicated warnings: ${[...new Set(duplicateWarnings)].join(' | ')}`,
    ));

    // Check 6: severity ordering (critical/high before low)
    const firstLow = issueLog.issues.findIndex((i) => i.severity === 'Low');
    const lastHigh = [...issueLog.issues].reverse().findIndex((i) => i.severity === 'High' || i.severity === 'Critical');
    const severityOrdered = firstLow === -1 || lastHigh === -1 || firstLow > (issueLog.issues.length - 1 - lastHigh);
    checks.push(check(
      'Issues sorted by severity (Critical/High first)',
      severityOrdered,
      'Severity order correct',
      'Issues not sorted by severity',
    ));

    // Check 7: Disclaimer present
    checks.push(check(
      'Issue log disclaimer present',
      issueLog.disclaimer.includes('not legal advice'),
      'Disclaimer intact',
      'Missing "not legal advice" in issue log disclaimer',
    ));

    // Check 8: Export functions run without crash
    try {
      const { writeIssuesCSV, writeEvidenceCSV } = await import('../lib/export-engine');
      const tmpDir = path.join(process.cwd(), 'reports', 'evals', 'tmp-export-test');
      fs.mkdirSync(tmpDir, { recursive: true });
      writeIssuesCSV(issueLog, tmpDir);
      writeEvidenceCSV(issueLog, tmpDir);
      const issuesCsvExists = fs.existsSync(path.join(tmpDir, 'issues.csv'));
      const evidenceCsvExists = fs.existsSync(path.join(tmpDir, 'evidence.csv'));
      checks.push(check(
        'Export: issues.csv and evidence.csv created',
        issuesCsvExists && evidenceCsvExists,
        'issues.csv and evidence.csv written',
        `Missing: ${!issuesCsvExists ? 'issues.csv ' : ''}${!evidenceCsvExists ? 'evidence.csv' : ''}`,
      ));
      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      checks.push({ name: 'Export: issues.csv and evidence.csv created', pass: false, message: `Export threw: ${e instanceof Error ? e.message : e}` });
    }

    // Check 9: Compare engine runs without crash
    try {
      const { buildCompareReport } = await import('../lib/compare-engine');
      const compareReport = buildCompareReport('run-a', 'run-b', issueLog, issueLog, mockDataRoom, mockDataRoom);
      checks.push(check(
        'Compare engine runs without crash',
        !!compareReport.reportId,
        `Compare report: ${compareReport.reportId}`,
        'Compare report missing reportId',
      ));
    } catch (e) {
      checks.push({ name: 'Compare engine runs without crash', pass: false, message: `Compare threw: ${e instanceof Error ? e.message : e}` });
    }

  } catch (e) {
    checks.push({ name: 'Issue log generates without crash', pass: false, message: `Error: ${e instanceof Error ? e.message : e}` });
  }

  return {
    file: '[v5: Issue Log + Evidence + Exports]',
    checks,
    passed: checks.filter((c) => c.pass).length,
    failed: checks.filter((c) => !c.pass).length,
  };
}

// Regression checks for defects found in the 2026-07 adversarial review. Each
// of these failed (or was unreachable) before the corresponding fix.
async function evalRegression(): Promise<DocResult> {
  const checks: Check[] = [];

  // PDF ingestion must work with the pdf-parse v2 class API.
  try {
    const { extractPdfText } = await import('../lib/document-loader');
    const pdfPath = path.join(CWD, 'public', 'demo-artifacts', 'demo-review.pdf');
    if (fs.existsSync(pdfPath)) {
      const text = await extractPdfText(pdfPath);
      checks.push(check(
        'PDF text extraction works (pdf-parse v2 API)',
        text.trim().length > 100,
        `Extracted ${text.length.toLocaleString()} characters from demo-review.pdf`,
        `Only ${text.trim().length} characters extracted`,
      ));
    } else {
      checks.push({ name: 'PDF text extraction works (pdf-parse v2 API)', pass: false, message: 'Fixture public/demo-artifacts/demo-review.pdf missing' });
    }
  } catch (e) {
    checks.push({ name: 'PDF text extraction works (pdf-parse v2 API)', pass: false, message: `Threw: ${e instanceof Error ? e.message : e}` });
  }

  // Document-type detection must not match "nda" inside ordinary words.
  const partnershipDoc =
    'PARTNERSHIP AGREEMENT\nThis Partnership Agreement is made between Alpha LLC and Beta LLC.\n' +
    'The parties agree to standard accounting practices and revenue sharing agreement terms.';
  const detectedPartnership = detectDocumentType(partnershipDoc);
  checks.push(check(
    'Doc containing "standard" is not misclassified as NDA',
    detectedPartnership === 'Partnership Agreement',
    'Detected: Partnership Agreement',
    `Detected: ${detectedPartnership}`,
  ));
  const detectedCalendar = detectDocumentType('please check the calendar for dates');
  checks.push(check(
    'Text containing "calendar" is not classified as NDA',
    detectedCalendar === 'Other',
    'Detected: Other',
    `Detected: ${detectedCalendar}`,
  ));

  // Truncated documents must carry an explicit warning, and mock risk
  // score/level must be derived from the reported risks.
  try {
    const longText = 'PARTNERSHIP AGREEMENT between Alpha LLC and Beta LLC. ' + 'This clause continues. '.repeat(1000);
    const chunked = chunkText(longText);
    const truncReview = await runContractReview(chunked, 'Truncation Regression Doc', {
      parsedCharacterCount: chunked.length,
      originalCharacterCount: longText.length,
    });
    checks.push(check(
      'Truncated documents carry an explicit warning',
      (truncReview.warnings ?? []).some((w) => /truncated/i.test(w)),
      'Truncation warning present in review.warnings',
      `warnings=${JSON.stringify(truncReview.warnings ?? [])}`,
    ));
    checks.push(check(
      'Risk level consistent with reported risk severities',
      truncReview.riskLevel === deriveRiskLevel(truncReview.topRisks, truncReview.riskScore),
      `riskLevel=${truncReview.riskLevel}, riskScore=${truncReview.riskScore}`,
      `riskLevel=${truncReview.riskLevel} does not match derived level ${deriveRiskLevel(truncReview.topRisks, truncReview.riskScore)}`,
    ));
  } catch (e) {
    checks.push({ name: 'Truncated documents carry an explicit warning', pass: false, message: `Threw: ${e instanceof Error ? e.message : e}` });
  }

  // Payment findings must cover every row (the old code read only the first 8),
  // and the overdue cross-doc finding must name the vendor column.
  try {
    const rows = Array.from({ length: 20 }, (_, i) => [
      `Vendor${i + 1}`, `$${i + 1}00.00`, '2026-01-01', i >= 15 ? 'Overdue' : 'Paid',
    ]);
    const sheet: ParsedSheet = { sheetName: 'S', headers: ['Vendor', 'Amount', 'Due Date', 'Status'], rows };
    const dr = generateMockDataRoomSummary(
      [{ filename: 'contract.txt', text: 'Payment terms: net 30.' }],
      [{ filename: 'pay.csv', sheets: [sheet], profiles: [buildTableProfile(sheet)] }],
      [],
    );
    const overdueCaptured = dr.paymentScheduleFindings.filter((p) => /overdue/i.test(p.status)).length;
    checks.push(check(
      'Payment findings cover all rows (no first-8 cap)',
      dr.paymentScheduleFindings.length === 20 && overdueCaptured === 5,
      `20/20 rows captured, ${overdueCaptured}/5 overdue rows present`,
      `${dr.paymentScheduleFindings.length}/20 rows, ${overdueCaptured}/5 overdue captured`,
    ));

    const shifted: ParsedSheet = {
      sheetName: 'S',
      headers: ['Invoice #', 'Due Date', 'Vendor', 'Amount', 'Status'],
      rows: [['INV-001', '2026-01-01', 'Acme Corp', '$500.00', 'Overdue']],
    };
    const dr2 = generateMockDataRoomSummary(
      [{ filename: 'contract.txt', text: 'Payment terms: net 30.' }],
      [{ filename: 'pay.csv', sheets: [shifted], profiles: [buildTableProfile(shifted)] }],
      [],
    );
    const overdueFinding = dr2.crossDocumentFindings.find((f) => f.findingType === 'payment-mismatch');
    checks.push(check(
      'Overdue finding names the vendor column, not column 0',
      !!overdueFinding && overdueFinding.valueB.includes('Acme Corp'),
      `valueB="${overdueFinding?.valueB}"`,
      `valueB="${overdueFinding?.valueB ?? '(no finding)'}" — expected the vendor name`,
    ));
  } catch (e) {
    checks.push({ name: 'Payment findings cover all rows (no first-8 cap)', pass: false, message: `Threw: ${e instanceof Error ? e.message : e}` });
  }

  // Year/integer columns must not type as currency.
  try {
    const sheet: ParsedSheet = {
      sheetName: 'S',
      headers: ['Investor', 'Year', 'Shares', 'Amount'],
      rows: [
        ['Alice', '2021', '1,000', '$100.00'],
        ['Bob', '2022', '2,000', '$250.50'],
        ['Carol', '2023', '3,000', '$999.99'],
      ],
    };
    const profile = buildTableProfile(sheet);
    const yearType = profile.columns[1].type;
    const sharesType = profile.columns[2].type;
    const amountType = profile.columns[3].type;
    const yearsLeaked = profile.detectedAmounts.some((a) => /^20\d{2}$/.test(a));
    checks.push(check(
      'Bare integers (years, share counts) are not typed as currency',
      yearType !== 'currency' && sharesType !== 'currency' && amountType === 'currency' && !yearsLeaked,
      `Year=${yearType}, Shares=${sharesType}, Amount=${amountType}, amounts=${profile.detectedAmounts.join(', ')}`,
      `Year=${yearType}, Shares=${sharesType}, Amount=${amountType}, detectedAmounts=${profile.detectedAmounts.join(', ')}`,
    ));
  } catch (e) {
    checks.push({ name: 'Bare integers (years, share counts) are not typed as currency', pass: false, message: `Threw: ${e instanceof Error ? e.message : e}` });
  }

  // Compare engine must not fabricate changes when duplicate-titled issues exist.
  try {
    const { compareIssueLogs } = await import('../lib/compare-engine');
    const mkIssue = (id: string, severity: 'Low' | 'Medium' | 'High' | 'Critical') => ({
      id, title: 'Overdue Payment: Acme', severity, category: 'payment' as const, status: 'open' as const,
      sourceFiles: [], evidenceQuotes: [], affectedRows: [], recommendation: 'r',
      createdAt: 'c', updatedAt: 'u', evidenceIds: ['e'],
    });
    const mkLog = (logId: string, issues: ReturnType<typeof mkIssue>[]) => IssueLogSchema.parse({
      logId, title: 'Log', generatedAt: 'now', sourceReports: [], issues, evidence: [],
      totalIssues: issues.length, openCount: issues.length, criticalCount: 0, highCount: 0, disclaimer: 'not legal advice',
    });
    const logA = mkLog('a', [mkIssue('1', 'High'), mkIssue('2', 'Critical')]);
    const logB = mkLog('b', [mkIssue('3', 'High')]);
    const diff = compareIssueLogs(logA, logB);
    const ok = diff.changedIssues.length === 0 && diff.removedIssues.length === 1 && diff.removedIssues[0].severity === 'Critical' && diff.addedIssues.length === 0;
    checks.push(check(
      'Compare pairs duplicate-titled issues without fabricating changes',
      ok,
      'Removed the Critical duplicate; no fabricated severity change',
      `changed=${JSON.stringify(diff.changedIssues)}, removed=${diff.removedIssues.map((i) => i.severity).join(',')}, added=${diff.addedIssues.length}`,
    ));
  } catch (e) {
    checks.push({ name: 'Compare pairs duplicate-titled issues without fabricating changes', pass: false, message: `Threw: ${e instanceof Error ? e.message : e}` });
  }

  // Placeholder/fabricated quotes must never surface as verified evidence.
  try {
    const review = await runContractReview(
      'Short agreement with no liability or renewal language at all.',
      'No-Clause Doc',
      { sourceFilename: 'no-clause.txt' },
    );
    const log = buildIssueLogFromReports(
      [review], [], [], ['r'],
      new Map([['no-clause.txt', 'Short agreement with no liability or renewal language at all.']]),
    );
    const falselyVerified = log.evidence.filter(
      (e) => e.isVerified && e.documentQuote.length > 0 &&
        !normalizeForMatch('Short agreement with no liability or renewal language at all.').includes(normalizeForMatch(e.documentQuote))
    );
    checks.push(check(
      'Missing-clause quotes are never marked verified',
      falselyVerified.length === 0,
      'No falsely verified evidence for a document without the clauses',
      `${falselyVerified.length} falsely verified item(s)`,
    ));
  } catch (e) {
    checks.push({ name: 'Missing-clause quotes are never marked verified', pass: false, message: `Threw: ${e instanceof Error ? e.message : e}` });
  }

  return {
    file: '[Regression: adversarial-review fixes]',
    checks,
    passed: checks.filter((c) => c.pass).length,
    failed: checks.filter((c) => !c.pass).length,
  };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║           Synth · Eval Harness                   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('⚠️  Synth is not legal advice or financial advice.');
  console.log('   It is a document review aid. Consult a qualified professional.\n');

  const DOCS: Array<{ file: string; expectedType: string }> = [
    { file: 'sample-saas-agreement.txt', expectedType: 'SaaS Agreement' },
    { file: 'sample-term-sheet.txt', expectedType: 'Term Sheet' },
    { file: 'sample-contractor-agreement.txt', expectedType: 'Contractor Agreement' },
  ];

  const results: DocResult[] = [];

  for (const { file, expectedType } of DOCS) {
    console.log(`  📄 Evaluating: ${file}`);
    const result = await evalDocument(file, expectedType);
    results.push(result);

    for (const c of result.checks) {
      const icon = c.pass ? '  ✅' : '  ❌';
      console.log(`${icon} ${c.name}`);
      if (!c.pass) console.log(`       → ${c.message}`);
    }
    console.log(`     ${result.passed} passed, ${result.failed} failed\n`);
  }

  // v4: spreadsheet + dataroom checks
  console.log('  📊 Evaluating spreadsheets + data room (v4)...\n');
  const spreadsheetResults = await evalSpreadsheets();
  for (const result of spreadsheetResults) {
    console.log(`  📊 ${result.file}`);
    for (const c of result.checks) {
      const icon = c.pass ? '  ✅' : '  ❌';
      console.log(`${icon} ${c.name}`);
      if (!c.pass) console.log(`       → ${c.message}`);
    }
    console.log(`     ${result.passed} passed, ${result.failed} failed\n`);
  }
  results.push(...spreadsheetResults);

  // v5: issue log + evidence + export + compare checks
  console.log('  🗂  Evaluating issue log + evidence + exports (v5)...\n');
  const v5Result = await evalV5();
  console.log(`  🗂  [Issue Log + Evidence + Exports]`);
  for (const c of v5Result.checks) {
    const icon = c.pass ? '  ✅' : '  ❌';
    console.log(`${icon} ${c.name}`);
    if (!c.pass) console.log(`       → ${c.message}`);
  }
  console.log(`     ${v5Result.passed} passed, ${v5Result.failed} failed\n`);
  results.push(v5Result);

  // Regression checks for adversarial-review fixes
  console.log('  🛡  Evaluating adversarial regression checks...\n');
  const regressionResult = await evalRegression();
  console.log(`  🛡  ${regressionResult.file}`);
  for (const c of regressionResult.checks) {
    const icon = c.pass ? '  ✅' : '  ❌';
    console.log(`${icon} ${c.name}`);
    if (!c.pass) console.log(`       → ${c.message}`);
  }
  console.log(`     ${regressionResult.passed} passed, ${regressionResult.failed} failed\n`);
  results.push(regressionResult);

  const totalPassed = results.reduce((s, r) => s + r.passed, 0);
  const totalFailed = results.reduce((s, r) => s + r.failed, 0);
  const totalChecks = totalPassed + totalFailed;
  const allPass = totalFailed === 0;

  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║  ${allPass ? '✅ All checks passed' : '❌ Some checks failed'}${' '.repeat(allPass ? 28 : 27)}║`);
  console.log(`║  ${totalPassed}/${totalChecks} checks passed${' '.repeat(37 - String(totalPassed).length - String(totalChecks).length)}║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Save JSON report
  fs.mkdirSync(EVALS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const report = {
    runAt: new Date().toISOString(),
    totalChecks,
    totalPassed,
    totalFailed,
    allPass,
    results,
  };

  const jsonPath = path.join(EVALS_DIR, `eval-${ts}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`  JSON report → reports/evals/eval-${ts}.json`);

  // Save Markdown report
  const md = [
    '# Synth Eval Report',
    '',
    `**Run at:** ${new Date().toISOString()}  `,
    `**Result:** ${allPass ? '✅ All checks passed' : '❌ Some checks failed'}  `,
    `**Score:** ${totalPassed}/${totalChecks}`,
    '',
    '---',
    '',
    ...results.map((r) => [
      `## ${r.file}`,
      '',
      `${r.passed} passed, ${r.failed} failed`,
      '',
      ...r.checks.map((c) => `- ${c.pass ? '✅' : '❌'} **${c.name}**: ${c.message}`),
      '',
    ].join('\n')),
  ].join('\n');

  const mdPath = path.join(EVALS_DIR, `eval-${ts}.md`);
  fs.writeFileSync(mdPath, md);
  console.log(`  MD report  → reports/evals/eval-${ts}.md\n`);

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
