import type { Review, Risk } from '../schemas/review.schema';
import type { DataRoomSummary, CrossDocumentFinding, SpreadsheetAnalysis } from '../schemas/spreadsheet.schema';
import { IssueLogSchema } from '../schemas/issue.schema';
import type { Issue, EvidenceItem, IssueLog, IssueCategory } from '../schemas/issue.schema';

const DISCLAIMER =
  'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

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

function hasRealQuote(q: string | undefined): q is string {
  return !!q && q.length > 10 && !/^see document/i.test(q.trim());
}

export function buildIssueLogFromReports(
  reviews: Review[],
  spreadsheets: SpreadsheetAnalysis[],
  datarooms: DataRoomSummary[],
  sourceReportNames: string[],
): IssueLog {
  const now = new Date().toISOString();
  const ts = now.replace(/[:.]/g, '-').slice(0, 19);

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

  // Review risks → issues
  for (const review of reviews) {
    for (const risk of review.topRisks) {
      const realQuote = hasRealQuote(risk.supportingQuote);
      addIssue(
        {
          title: risk.title,
          severity: risk.severity,
          category: categoryFromRisk(risk),
          status: 'open',
          sourceFiles: [review.sourceFilename ?? review.documentTitle],
          evidenceQuotes: realQuote ? [risk.supportingQuote] : [],
          affectedRows: [],
          recommendation: risk.suggestedNextStep,
        },
        {
          documentQuote: realQuote ? risk.supportingQuote : '',
          sourceFilename: review.sourceFilename ?? review.documentTitle,
          fieldName: risk.location,
          isVerified: realQuote,
          verificationNote: realQuote
            ? undefined
            : 'Supporting quote not available — verify against source document.',
        },
      );
    }

    // Unusual clauses → low-severity legal issues (cap at 3)
    for (const clause of (review.unusualClauses ?? []).slice(0, 3)) {
      const hasText = clause.length > 20;
      addIssue(
        {
          title: `Unusual Clause: ${clause.slice(0, 70)}${clause.length > 70 ? '…' : ''}`,
          severity: 'Low',
          category: 'legal',
          status: 'open',
          sourceFiles: [review.sourceFilename ?? review.documentTitle],
          evidenceQuotes: hasText ? [clause] : [],
          affectedRows: [],
          recommendation: 'Review this clause with legal counsel to assess acceptability.',
        },
        {
          documentQuote: hasText ? clause : '',
          sourceFilename: review.sourceFilename ?? review.documentTitle,
          isVerified: hasText,
          verificationNote: hasText ? undefined : 'Clause text too short — check source document.',
        },
      );
    }
  }

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
          isVerified: !!quote,
          verificationNote: quote
            ? undefined
            : 'Values not extractable in mock mode — manual cross-reference required.',
        },
      );
    }

    // Overdue payments → high-severity payment issues
    for (const payment of dataroom.paymentScheduleFindings.filter((p) => /overdue/i.test(p.status)).slice(0, 5)) {
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
        },
      );
    }

    // Data quality warnings → low-severity issues (cap at 5)
    for (const warning of dataroom.dataQualityWarnings.slice(0, 5)) {
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

  // Spreadsheet-only warnings (deduplicated against dataroom issues)
  const existingTitles = new Set(issues.map((i) => i.title.toLowerCase().slice(0, 50)));
  for (const sheet of spreadsheets) {
    for (const warning of sheet.warnings.slice(0, 3)) {
      const key = warning.toLowerCase().slice(0, 50);
      if (existingTitles.has(key)) continue;
      existingTitles.add(key);
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
