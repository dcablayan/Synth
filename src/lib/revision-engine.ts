import type { Review } from '../schemas/review.schema';

export function buildPriorityChanges(review: Review): string[] {
  const changes: string[] = [];
  for (const risk of review.topRisks) {
    if (risk.severity === 'Critical' || risk.severity === 'High') {
      changes.push(`Address: ${risk.title} — ${risk.suggestedNextStep}`);
    }
  }
  if (changes.length === 0) {
    changes.push('Review all flagged provisions with qualified legal counsel');
  }
  if (review.missingClauses.length > 0) {
    changes.push(`Add missing clauses: ${review.missingClauses.slice(0, 3).join(', ')}`);
  }
  return changes.slice(0, 6);
}

export function buildNegotiationNotes(): string[] {
  return [
    'Start with the highest-severity items first',
    'Document all verbal agreements in writing before signing',
    'Request a redline of any counter-proposals',
    'Consider requesting a 30-day review period before signing',
    'Get all changes confirmed in a written amendment or restated agreement',
  ];
}

export function buildLawyerQuestions(review: Review): string[] {
  const base: string[] = [
    'Is the liability cap sufficient for our potential exposure?',
    'Are the indemnification obligations reasonable and balanced?',
    'What is the practical impact of the governing law choice?',
    'What are our rights and remedies if the other party materially breaches?',
  ];

  const docTypeQuestions: Record<string, string[]> = {
    'SaaS Agreement': [
      'Does the provider have adequate data security and breach notification obligations?',
      'Can we negotiate SLA uptime guarantees with financial remedies?',
    ],
    'Term Sheet': [
      'How does the liquidation preference affect our payout in various exit scenarios?',
      'What triggers the anti-dilution provisions, and what are the mechanics?',
    ],
    'Contractor Agreement': [
      'Is the IP assignment clause broad enough to cover all work product?',
      'Is the non-compete enforceable in our jurisdiction and scope?',
    ],
    'Employment Agreement': [
      'Are the non-compete and non-solicitation clauses enforceable in our jurisdiction?',
      'What triggers the equity vesting acceleration provisions?',
    ],
    NDA: [
      'Is the definition of "confidential information" appropriately scoped?',
      'Does the NDA adequately protect our trade secrets and proprietary data?',
    ],
  };

  const extra = docTypeQuestions[review.documentType] ?? [];
  return [...base, ...extra].slice(0, 7);
}

export function buildRevisionSummary(review: Review): string {
  const highCount = review.topRisks.filter((r) => r.severity === 'High' || r.severity === 'Critical').length;
  return (
    `This revision packet identifies ${review.topRisks.length} area(s) of "${review.documentTitle}" ` +
    `warranting negotiation or revision, including ${highCount} high-priority item(s). ` +
    `All suggested language is for review by a qualified professional only and does not constitute legal advice.`
  );
}
