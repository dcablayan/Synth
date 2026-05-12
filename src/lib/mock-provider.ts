import { detectDocumentType, extractDocumentTitle, extractParties } from './parser';

const DISCLAIMER = 'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

export function generateMockReview(documentText: string, documentTitle: string) {
  const docType = detectDocumentType(documentText);
  const parties = extractParties(documentText);
  const now = new Date().toISOString();

  return {
    documentTitle,
    documentType: docType,
    parties: parties.length > 0 ? parties : ['Party A', 'Party B'],
    executiveSummary: `This ${docType} has been reviewed by Synth in mock mode. The document contains several clauses that warrant attention, including payment terms, termination provisions, and liability limitations. This is a demonstration analysis using mock data — no actual AI analysis was performed. Review all findings with a qualified professional.`,
    keyDates: [
      { label: 'Effective Date', date: 'See document' },
      { label: 'Initial Term End', date: 'See document' },
    ],
    paymentTerms: 'See document — payment terms detected but mock mode is active. Run with an AI provider for full extraction.',
    renewalTerms: 'Auto-renewal terms detected. See document for specific notice periods.',
    terminationTerms: 'Termination provisions present. See document for cure periods and notice requirements.',
    liabilityIssues: 'Liability cap clauses detected. Caps may be significantly below potential damages. Verify with counsel.',
    indemnificationIssues: 'Indemnification provisions present. Review scope and carve-outs with legal counsel.',
    confidentialityTerms: 'Confidentiality obligations present. Duration and scope require review.',
    governingLaw: 'See document for governing law and dispute resolution provisions.',
    missingClauses: [
      'Force majeure clause (not clearly present)',
      'Data processing agreement / GDPR addendum',
      'SLA / uptime guarantees',
    ],
    unusualClauses: [
      'Unilateral modification rights may allow changes without consent',
      'Review auto-renewal notice window carefully',
    ],
    riskScore: 65,
    riskLevel: 'High' as const,
    topRisks: [
      {
        title: 'Unilateral Modification Rights',
        severity: 'High' as const,
        explanation: 'Provider may be able to modify terms without customer consent.',
        whyItMatters: 'Material terms could change after signing without recourse.',
        suggestedNextStep: 'Request a mutual written amendment requirement.',
        supportingQuote: 'See document for specific language — mock mode active.',
        location: 'General Provisions',
      },
      {
        title: 'Limited Liability Cap',
        severity: 'High' as const,
        explanation: 'Liability may be capped at a small fraction of potential damages.',
        whyItMatters: 'Company may have no meaningful recourse for serious failures.',
        suggestedNextStep: 'Negotiate a higher cap and carve-outs for willful misconduct.',
        supportingQuote: 'See document — mock mode active.',
        location: 'Liability',
      },
      {
        title: 'Auto-Renewal with Short Notice',
        severity: 'Medium' as const,
        explanation: 'Agreement auto-renews unless cancelled within a specific window.',
        whyItMatters: 'Missing the notice window locks in another full term.',
        suggestedNextStep: 'Calendar the cancellation deadline immediately.',
        supportingQuote: 'See document — mock mode active.',
        location: 'Term and Renewal',
      },
    ],
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
        relevance: 'All findings are illustrative only. Run with a real provider for document-specific analysis.',
      },
    ],
    generatedAt: now,
    disclaimer: DISCLAIMER,
  };
}

export function generateMockFinancial(documentText: string, documentTitle: string) {
  const now = new Date().toISOString();

  return {
    documentTitle,
    totalContractValue: 'See document — mock mode active',
    recurringFees: 'Recurring fee structure detected. See document for amounts.',
    oneTimeFees: 'One-time fees may be present. Review document.',
    paymentSchedule: 'Payment schedule requires review. See document.',
    lateFees: 'Late payment penalties may apply. See document for rate.',
    penalties: 'Penalty clauses detected. Review with counsel.',
    discounts: 'Not found in the document.',
    equityTerms: 'Not found in the document.',
    revenueShare: 'Not found in the document.',
    refundTerms: 'Refund provisions present. Review for limitations.',
    renewalCostChanges: 'Price increase provisions detected. Review escalation terms.',
    financialRedFlags: [
      {
        issue: 'Non-refundable fees',
        explanation: 'All fees may be non-refundable regardless of circumstances.',
        severity: 'High' as const,
        supportingQuote: 'See document — mock mode active.',
      },
      {
        issue: 'Automatic price increases',
        explanation: 'Price may increase automatically on renewal.',
        severity: 'Medium' as const,
        supportingQuote: 'See document — mock mode active.',
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

export function generateMockMemo(review: { documentTitle: string; riskLevel: string; riskScore: number; topRisks: Array<{ title: string; severity: string; explanation: string }>; keyDates: Array<{ label: string; date: string }>; actionItems: string[] }) {
  const now = new Date().toISOString();

  return {
    documentTitle: review.documentTitle,
    memoDate: now.split('T')[0],
    executiveSummary: `This memo summarizes key findings from the Synth review of "${review.documentTitle}". The document presents ${review.riskLevel} risk (score: ${review.riskScore}/100). Several provisions require immediate attention, including liability limitations, renewal terms, and modification rights. This memo was generated in mock mode.`,
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
    disclaimer: 'This memo is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.',
    generatedAt: now,
  };
}

export function generateMockRevision(documentText: string, review: { documentTitle: string }) {
  const now = new Date().toISOString();

  return {
    documentTitle: review.documentTitle,
    revisionSummary: `This revision packet identifies key areas of "${review.documentTitle}" that warrant negotiation or revision. Generated in mock mode — document-specific language requires real AI analysis. All suggested language is for review by a qualified professional only.`,
    priorityChanges: [
      'Negotiate mutual written amendment requirement',
      'Increase liability cap or add carve-outs',
      'Reduce or eliminate auto-renewal notice window',
      'Clarify data rights and usage restrictions',
      'Add force majeure provision',
    ],
    clauseRevisions: [
      {
        section: 'Liability Limitation',
        originalLanguage: 'See document — mock mode active',
        issue: 'Liability cap may be significantly below potential damages',
        suggestedReplacementLanguage:
          '[SUGGESTED FOR PROFESSIONAL REVIEW] Consider negotiating a higher cap, or carve-outs for willful misconduct, gross negligence, and data breach scenarios.',
        whyItMatters: 'Low liability caps leave you with no meaningful recourse for serious failures.',
        severity: 'High' as const,
        supportingQuote: 'See document — run with AI provider for document-specific quotes.',
      },
      {
        section: 'Auto-Renewal',
        originalLanguage: 'See document — mock mode active',
        issue: 'Auto-renewal with potentially short cancellation window',
        suggestedReplacementLanguage:
          '[SUGGESTED FOR PROFESSIONAL REVIEW] Negotiate a shorter notice window (e.g., 30 days) and require affirmative renewal consent.',
        whyItMatters: 'Missing the cancellation window locks you into another full-term commitment.',
        severity: 'Medium' as const,
        supportingQuote: 'See document — mock mode active.',
      },
    ],
    negotiationNotes: [
      'Start with the highest-severity items first',
      'Document all verbal agreements in writing',
      'Request a redline of any counter-proposals',
      'Consider requesting a 30-day review period before signing',
    ],
    lawyerQuestions: [
      'Is the arbitration clause enforceable in our jurisdiction?',
      'What are our rights if the other party breaches?',
      'How should we handle data security requirements?',
      'Are there any jurisdiction-specific requirements we need to address?',
    ],
    revisionDisclaimer:
      'Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language.',
    generatedAt: now,
  };
}
