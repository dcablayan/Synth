import { detectDocumentType, extractDocumentTitle, extractParties } from './parser';
import {
  extractPaymentTerms,
  extractRenewalTerms,
  extractTerminationTerms,
  extractGoverningLaw,
  extractConfidentialityTerms,
  extractLiabilityCap,
  extractKeyDates,
} from './parser';
import {
  buildPriorityChanges,
  buildNegotiationNotes,
  buildLawyerQuestions,
  buildRevisionSummary,
} from './revision-engine';
import { calculateRiskScore, deriveRiskLevel, reconcileRisk } from './risk-scoring';
import type { Risk } from '../schemas/review.schema';
import { DISCLAIMER, REVISION_DISCLAIMER } from './brand';

const NOT_FOUND = 'Not found in the document.';

export function generateMockReview(documentText: string, documentTitle: string) {
  const docType = detectDocumentType(documentText);
  const parties = extractParties(documentText);
  const now = new Date().toISOString();

  const paymentTerms = extractPaymentTerms(documentText);
  const renewalTerms = extractRenewalTerms(documentText);
  const terminationTerms = extractTerminationTerms(documentText);
  const governingLaw = extractGoverningLaw(documentText);
  const confidentialityTerms = extractConfidentialityTerms(documentText);
  const liabilityIssues = extractLiabilityCap(documentText);
  const keyDates = extractKeyDates(documentText);

  // supportingQuote must be real document text or the honest NOT_FOUND sentinel —
  // never explanatory prose, which downstream consumers would mistake for a quote.
  const liabilityQuote = liabilityIssues !== NOT_FOUND ? liabilityIssues : NOT_FOUND;
  const renewalQuote = renewalTerms !== NOT_FOUND ? renewalTerms : NOT_FOUND;

  const topRisks: Risk[] = [
    {
      title: 'Unilateral Modification Rights',
      severity: 'High',
      explanation: 'Provider may be able to modify terms without customer consent.',
      whyItMatters: 'Material terms could change after signing without recourse.',
      suggestedNextStep: 'Request a mutual written amendment requirement.',
      supportingQuote: renewalQuote,
      location: 'General Provisions',
    },
    {
      title: 'Limited Liability Cap',
      severity: 'High',
      explanation: 'Liability may be capped at a small fraction of potential damages.',
      whyItMatters: 'Company may have no meaningful recourse for serious failures.',
      suggestedNextStep: 'Negotiate a higher cap and carve-outs for willful misconduct.',
      supportingQuote: liabilityQuote,
      location: 'Liability',
    },
    {
      title: 'Auto-Renewal with Short Notice',
      severity: 'Medium',
      explanation: 'Agreement auto-renews unless cancelled within a specific window.',
      whyItMatters: 'Missing the notice window locks in another full term.',
      suggestedNextStep: 'Calendar the cancellation deadline immediately.',
      supportingQuote: renewalQuote,
      location: 'Term and Renewal',
    },
  ];
  // Same reconciliation as the AI path: level floors at the worst individual
  // risk, and the score is lifted into that level's band.
  const rawScore = calculateRiskScore(topRisks);
  const { riskScore, riskLevel } = reconcileRisk(rawScore, deriveRiskLevel(topRisks, rawScore), topRisks);

  return {
    documentTitle,
    documentType: docType,
    parties: parties.length > 0 ? parties : ['Party A', 'Party B'],
    executiveSummary: `This ${docType} has been reviewed by Synth in mock mode. The document contains several clauses that warrant attention, including payment terms, termination provisions, and liability limitations. This is a demonstration analysis — no actual AI analysis was performed. Review all findings with a qualified professional.`,
    keyDates,
    paymentTerms,
    renewalTerms,
    terminationTerms,
    liabilityIssues,
    indemnificationIssues: 'Indemnification provisions present. Review scope and carve-outs with legal counsel.',
    confidentialityTerms,
    governingLaw,
    missingClauses: [
      'Force majeure clause (not clearly present)',
      'Data processing agreement / GDPR addendum',
      'SLA / uptime guarantees',
    ],
    unusualClauses: [
      'Unilateral modification rights may allow changes without consent',
      'Review auto-renewal notice window carefully',
    ],
    riskScore,
    riskLevel,
    topRisks,
    actionItems: [
      'Review all payment and fee terms with finance team',
      'Calendar all notice and cancellation deadlines',
      'Have legal counsel review liability and indemnification provisions',
      'Request data processing agreement if applicable',
      'Verify governing law is acceptable for your jurisdiction',
    ],
    citations: [
      {
        section: 'Mock Mode Notice',
        quote: 'This analysis was generated in mock mode. No AI provider was used.',
        relevance: 'All findings are illustrative. Run with a real provider for document-specific analysis.',
      },
    ],
    generatedAt: now,
    disclaimer: DISCLAIMER,
  };
}

export function generateMockFinancial(documentText: string, documentTitle: string) {
  const now = new Date().toISOString();
  const paymentTerms = extractPaymentTerms(documentText);
  const renewalTerms = extractRenewalTerms(documentText);

  return {
    documentTitle,
    totalContractValue: paymentTerms !== NOT_FOUND ? paymentTerms : NOT_FOUND,
    recurringFees: paymentTerms !== NOT_FOUND ? paymentTerms : 'Recurring fee structure not identified in parsed text.',
    oneTimeFees: NOT_FOUND,
    paymentSchedule: paymentTerms !== NOT_FOUND ? paymentTerms : 'Payment schedule not identified in parsed text. Review document for fee structure.',
    lateFees: 'Late payment penalty terms not identified in parsed text. Review document for late fee provisions.',
    penalties: 'Penalty clauses may be present. Review with counsel.',
    discounts: NOT_FOUND,
    equityTerms: NOT_FOUND,
    revenueShare: NOT_FOUND,
    refundTerms: 'Refund provisions not identified in parsed text. Review document for refund conditions.',
    renewalCostChanges: renewalTerms !== NOT_FOUND ? renewalTerms : 'Price escalation terms not identified in parsed text. Review document for renewal cost provisions.',
    financialRedFlags: [
      {
        issue: 'Non-refundable fees',
        explanation: 'All fees may be non-refundable regardless of circumstances. Review for fee non-refundability provisions.',
        severity: 'High' as const,
        supportingQuote: paymentTerms,
      },
      {
        issue: 'Automatic price increases',
        explanation: 'Price may increase automatically on renewal. Review for price escalation provisions.',
        severity: 'Medium' as const,
        supportingQuote: renewalTerms,
      },
    ],
    citations: [
      {
        section: 'Mock Mode Notice',
        quote: 'Financial analysis generated in mock mode.',
        relevance: 'Run with an AI provider for document-specific financial extraction.',
      },
    ],
    generatedAt: now,
    disclaimer: DISCLAIMER,
  };
}

export function generateMockMemo(review: {
  documentTitle: string;
  riskLevel: string;
  riskScore: number;
  topRisks: Array<{ title: string; severity: string; explanation: string }>;
  keyDates: Array<{ label: string; date: string }>;
  actionItems: string[];
}) {
  const now = new Date().toISOString();

  return {
    documentTitle: review.documentTitle,
    memoDate: now.split('T')[0],
    executiveSummary: `This memo summarizes key findings from the Synth review of "${review.documentTitle}". The document presents ${review.riskLevel} risk (score: ${review.riskScore}/100). Several provisions require immediate attention, including liability limitations, renewal terms, and modification rights. This memo was generated in mock mode — run with a real AI provider for document-specific analysis.`,
    biggestRisks: review.topRisks.map((r) => ({
      risk: r.title,
      severity: r.severity,
      explanation: r.explanation,
    })),
    financialObligations: ['Review all fee structures in document', 'Note all payment deadlines', 'Check for auto-renewal costs'],
    importantDeadlines: review.keyDates,
    questionsForLawyer: [
      'Is the liability cap sufficient for our exposure?',
      'Are the indemnification obligations reasonable?',
      'What is the practical impact of the governing law choice?',
      'Can we negotiate a mutual written amendment requirement?',
      'What data rights does the other party retain?',
    ],
    actionItems: review.actionItems,
    disclaimer: DISCLAIMER,
    generatedAt: now,
  };
}

export function generateMockRevision(documentText: string, review: {
  documentTitle: string;
  documentType?: string;
  topRisks?: Array<{ title: string; severity: string; suggestedNextStep: string; supportingQuote?: string }>;
  missingClauses?: string[];
}) {
  const now = new Date().toISOString();
  const liabilityQuote = extractLiabilityCap(documentText);
  const renewalQuote = extractRenewalTerms(documentText);

  const fullReview = {
    documentTitle: review.documentTitle,
    documentType: (review.documentType ?? 'Other') as Parameters<typeof buildPriorityChanges>[0]['documentType'],
    topRisks: (review.topRisks ?? []) as Parameters<typeof buildPriorityChanges>[0]['topRisks'],
    missingClauses: review.missingClauses ?? [],
  } as Parameters<typeof buildPriorityChanges>[0];

  return {
    documentTitle: review.documentTitle,
    revisionSummary: buildRevisionSummary(fullReview),
    priorityChanges: buildPriorityChanges(fullReview),
    clauseRevisions: [
      {
        section: 'Liability Limitation',
        originalLanguage: liabilityQuote,
        issue: 'Liability cap may be significantly below potential damages',
        suggestedReplacementLanguage:
          '[SUGGESTED FOR PROFESSIONAL REVIEW] Consider negotiating a higher cap, or carve-outs for willful misconduct, gross negligence, and data breach scenarios.',
        whyItMatters: 'Low liability caps leave you with no meaningful recourse for serious failures.',
        severity: 'High' as const,
        supportingQuote: liabilityQuote,
      },
      {
        section: 'Auto-Renewal',
        originalLanguage: renewalQuote,
        issue: 'Auto-renewal with potentially short cancellation window',
        suggestedReplacementLanguage:
          '[SUGGESTED FOR PROFESSIONAL REVIEW] Negotiate a shorter notice window (e.g., 30 days) and require affirmative renewal consent.',
        whyItMatters: 'Missing the cancellation window locks you into another full-term commitment.',
        severity: 'Medium' as const,
        supportingQuote: renewalQuote,
      },
    ],
    negotiationNotes: buildNegotiationNotes(),
    lawyerQuestions: buildLawyerQuestions(fullReview),
    revisionDisclaimer: REVISION_DISCLAIMER,
    generatedAt: now,
  };
}
