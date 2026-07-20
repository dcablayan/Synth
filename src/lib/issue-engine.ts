import type { Review, Risk } from '../schemas/review.schema';
import type { DataRoomSummary, CrossDocumentFinding, SpreadsheetAnalysis } from '../schemas/spreadsheet.schema';
import { IssueLogSchema } from '../schemas/issue.schema';
import type { Issue, EvidenceItem, IssueLog, IssueCategory } from '../schemas/issue.schema';
import { DISCLAIMER } from './brand';


const SEV_ORDER: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

function categoryFromRisk(risk: Risk): IssueCategory {
  const text = (risk.title + ' ' + risk.explanation).toLowerCase();
  if (/payment|invoice|fee|billing|overdue|late.pay/.test(text)) return 'payment';
  if (/renew|auto.renew|evergreen|extension|roll.?over/.test(text)) return 'renewal';
  if (/cap.?table|equity|stock|share|dilut/.test(text)) return 'cap-table';
  if (/party.?mismatch|wrong.?party|missing.?party|counterpart/.test(text)) return 'party-mismatch';
  if (/data.quality|blank|duplicate|missing.?field|corrupt/.test(text)) return 'data-quality';
  if (/liabilit|indemnif|damages|warranty|disclaim/.test(text)) return 'legal';
  if (/financ|revenue|cost|price|discount|valuation/.test(text)) return 'financial';
  return 'other';
}

function categoryFromFinding(finding: CrossDocumentFinding): IssueCategory {
  switch (finding.findingType) {
    case 'payment-mismatch': case 'duplicate-vendor': return 'payment';
    case 'party-mismatch': case 'missing-party': return 'party-mismatch';
    case 'cap-table-conflict': return 'cap-table';
    case 'renewal-mismatch': return 'renewal';
    case 'amount-mismatch': return 'financial';
    case 'date-mismatch': return 'legal';
    default: return 'other';
  }
}

// A candidate quote is text the report CLAIMS came from the document. Sentinels
// and "see document" strings are not quotes.
function isCandidateQuote(q: string | undefined): q is string {
  return !!q && q.length > 10 && !/^see document/i.test(q.trim()) && !/^not found/i.test(q.trim());
}

export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Verifies claimed quotes against actual source text. Verification is the whole
// point of the evidence ledger: a quote is "verified" only when it literally
// appears in the source document (whitespace- and quote-mark-insensitive).
class QuoteVerifier {
  private normalized = new Map<string, string>();

  constructor(private sourceTexts: Map<string, string>) {}

  private normalizedSource(key: string | undefined): string | undefined {
    if (!key) return undefined;
    if (this.normalized.has(key)) return this.normalized.get(key);
    // Allow lookup by exact filename or case-insensitive match.
    let raw = this.sourceTexts.get(key);
    if (raw === undefined) {
      for (const [k, v] of this.sourceTexts) {
        if (k.toLowerCase() === key.toLowerCase()) { raw = v; break; }
      }
    }
    if (raw === undefined) return undefined;
    const norm = normalizeForMatch(raw);
    this.normalized.set(key, norm);
    return norm;
  }

  verify(quote: string | undefined, sourceKeys: Array<string | undefined>): { isVerified: boolean; note?: string } {
    if (!isCandidateQuote(quote)) {
      return { isVerified: false, note: 'Supporting quote not available — verify against source document.' };
    }
    const q = normalizeForMatch(quote);
    let sawSource = false;
    for (const key of sourceKeys) {
      const source = this.normalizedSource(key);
      if (source === undefined) continue;
      sawSource = true;
      if (source.includes(q)) return { isVerified: true };
    }
    if (!sawSource) {
      return { isVerified: false, note: 'Source document not available for verification — verify quote manually.' };
    }
    return {
      isVerified: false,
      note: 'Quote could not be located in the source document — do not rely on it without manual verification.',
    };
  }
}

export function buildIssueLogFromReports(
  reviews: Review[],
  spreadsheets: SpreadsheetAnalysis[],
  datarooms: DataRoomSummary[],
  sourceReportNames: string[],
  sourceTexts: Map<string, string> = new Map(),
): IssueLog {
  const now = new Date().toISOString();
  const ts = now.replace(/[:.]/g, '-').slice(0, 19);
  const verifier = new QuoteVerifier(sourceTexts);

  let issueSeq = 0;
  let evidenceSeq = 0;
  const mkIssueId = () => `iss-${ts}-${String(++issueSeq).padStart(3, '0')}`;
  const mkEvidenceId = () => `ev-${ts}-${String(++evidenceSeq).padStart(3, '0')}`;

  const issues: Issue[] = [];
  const evidence: EvidenceItem[] = [];

  function addIssue(partial: Omit<Issue, 'id' | 'evidenceIds' | 'createdAt' | 'updatedAt'>, evItem: Omit<EvidenceItem, 'evidenceId' | 'issueId'>): void {
    const issueId = mkIssueId();
    const evidenceId = mkEvidenceId();
    evidence.push({ ...evItem, evidenceId, issueId });
    issues.push({ ...partial, id: issueId, evidenceIds: [evidenceId], createdAt: now, updatedAt: now });
  }

  // Review risks → issues; quotes verified against the source document text.
  for (const review of reviews) {
    const sourceKey = review.sourceFilename;
    for (const risk of review.topRisks) {
      const candidate = isCandidateQuote(risk.supportingQuote);
      const verdict = verifier.verify(risk.supportingQuote, [sourceKey, review.documentTitle]);
      addIssue(
        {
          title: risk.title,
          severity: risk.severity,
          category: categoryFromRisk(risk),
          status: 'open',
          sourceFiles: [review.sourceFilename ?? review.documentTitle],
          evidenceQuotes: verdict.isVerified ? [risk.supportingQuote] : [],
          affectedRows: [],
          recommendation: risk.suggestedNextStep,
        },
        {
          documentQuote: candidate ? risk.supportingQuote : '',
          sourceFilename: review.sourceFilename ?? review.documentTitle,
          fieldName: risk.location,
          isVerified: verdict.isVerified,
          verificationNote: verdict.note,
        },
      );
    }

    // Unusual clauses → low-severity legal issues (cap at 3). Clause text is a
    // description, not a quote — verified only if it literally appears.
    for (const clause of (review.unusualClauses ?? []).slice(0, 3)) {
      const verdict = verifier.verify(clause, [sourceKey, review.documentTitle]);
      addIssue(
        {
          title: `Unusual Clause: ${clause.slice(0, 70)}${clause.length > 70 ? '…' : ''}`,
          severity: 'Low',
          category: 'legal',
          status: 'open',
          sourceFiles: [review.sourceFilename ?? review.documentTitle],
          evidenceQuotes: verdict.isVerified ? [clause] : [],
          affectedRows: [],
          recommendation: 'Review this clause with legal counsel to assess acceptability.',
        },
        {
          documentQuote: isCandidateQuote(clause) ? clause : '',
          sourceFilename: review.sourceFilename ?? review.documentTitle,
          isVerified: verdict.isVerified,
          verificationNote: verdict.note,
        },
      );
    }
  }

  // Warning-derived issues are deduplicated by the warning text itself — the same
  // warning reaches us via both the data room summary and per-spreadsheet analyses.
  const seenWarnings = new Set<string>();
  const warningKey = (w: string) => normalizeForMatch(w).slice(0, 100);

  // Dataroom cross-doc findings → issues
  for (const dataroom of datarooms) {
    for (const finding of dataroom.crossDocumentFindings) {
      const quote = [finding.valueA, finding.valueB]
        .filter((v) => v && !/^not found/i.test(v))
        .join(' vs. ');
      addIssue(
        {
          title: finding.title,
          severity: finding.severity,
          category: categoryFromFinding(finding),
          status: 'open',
          sourceFiles: [finding.sourceA, finding.sourceB].filter(Boolean),
          evidenceQuotes: quote ? [quote] : [],
          affectedRows: [],
          recommendation: finding.recommendation,
        },
        {
          documentQuote: quote,
          sourceFilename: finding.sourceA,
          isVerified: false,
          verificationNote: quote
            ? 'Derived from cross-document comparison — verify the underlying values in both source files.'
            : 'Values not extractable — manual cross-reference required.',
        },
      );
    }

    // Overdue payments → high-severity payment issues. Every overdue row becomes
    // an issue; the findings list itself is capped upstream with a warning.
    for (const payment of dataroom.paymentScheduleFindings.filter((p) => /overdue/i.test(p.status))) {
      const rowText = `Vendor: ${payment.vendor} | Amount: ${payment.amount} | Due: ${payment.dueDate}`;
      addIssue(
        {
          title: `Overdue Payment: ${payment.vendor} (${payment.amount})`,
          severity: 'High',
          category: 'payment',
          status: 'open',
          sourceFiles: [payment.sourceFile],
          evidenceQuotes: [],
          affectedRows: [rowText],
          recommendation: `Resolve overdue payment of ${payment.amount} to ${payment.vendor}. Due: ${payment.dueDate}.`,
        },
        {
          documentQuote: '',
          spreadsheetRow: rowText,
          sourceFilename: payment.sourceFile,
          isVerified: true,
          verificationNote: 'Extracted directly from the spreadsheet row.',
        },
      );
    }

    // Data quality warnings → low-severity issues (cap at 5)
    for (const warning of dataroom.dataQualityWarnings.slice(0, 5)) {
      const key = warningKey(warning);
      if (seenWarnings.has(key)) continue;
      seenWarnings.add(key);
      addIssue(
        {
          title: `Data Quality: ${warning.slice(0, 80)}${warning.length > 80 ? '…' : ''}`,
          severity: 'Low',
          category: 'data-quality',
          status: 'open',
          sourceFiles: dataroom.documents.slice(0, 3).map((d) => d.filename),
          evidenceQuotes: [],
          affectedRows: [warning],
          recommendation: 'Review spreadsheet data for completeness and accuracy.',
        },
        {
          documentQuote: '',
          sourceFilename: dataroom.documents[0]?.filename ?? 'data-room',
          isVerified: false,
          verificationNote: 'Auto-detected from spreadsheet structure analysis.',
        },
      );
    }
  }

  // Spreadsheet-only warnings (deduplicated against dataroom warnings above)
  for (const sheet of spreadsheets) {
    for (const warning of sheet.warnings.slice(0, 3)) {
      const key = warningKey(warning);
      if (seenWarnings.has(key)) continue;
      seenWarnings.add(key);
      addIssue(
        {
          title: `Spreadsheet Warning: ${warning.slice(0, 70)}${warning.length > 70 ? '…' : ''}`,
          severity: 'Low',
          category: 'data-quality',
          status: 'open',
          sourceFiles: [sheet.sourceFilename],
          evidenceQuotes: [],
          affectedRows: [warning],
          recommendation: 'Review spreadsheet for completeness.',
        },
        {
          documentQuote: '',
          sourceFilename: sheet.sourceFilename,
          isVerified: false,
          verificationNote: 'Auto-detected from spreadsheet structure analysis.',
        },
      );
    }
  }

  // Sort by severity descending
  issues.sort((a, b) => (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0));

  return IssueLogSchema.parse({
    logId: `issuelog-${ts}`,
    title: 'Issue Log',
    generatedAt: now,
    sourceReports: sourceReportNames,
    issues,
    evidence,
    totalIssues: issues.length,
    openCount: issues.filter((i) => i.status === 'open').length,
    criticalCount: issues.filter((i) => i.severity === 'Critical').length,
    highCount: issues.filter((i) => i.severity === 'High').length,
    disclaimer: DISCLAIMER,
  });
}
