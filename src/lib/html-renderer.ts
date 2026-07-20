import type { Review } from '../schemas/review.schema';
import type { Financial } from '../schemas/financial.schema';
import type { Memo } from '../schemas/memo.schema';
import type { Revision } from '../schemas/revision.schema';

export type { Review, Financial, Memo, Revision };
import { escapeHtml, safeCssToken } from './output-safety';
import {
  documentCss,
  documentBadge,
  documentEyebrow,
  documentCoverFinePrint,
  documentFooter,
  BRAND,
} from './brand';

const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

function h(value: unknown): string {
  return escapeHtml(value);
}

function riskLevel(level: string): typeof RISK_LEVELS[number] {
  return safeCssToken(level, RISK_LEVELS, 'Low');
}

function listItems(items: string[]): string {
  return items.map((item) => `<li>${h(item)}</li>`).join('');
}

function quoteHtml(value: unknown): string {
  return `<blockquote>"${h(value)}"</blockquote>`;
}

function warningsHtml(warnings: string[] | undefined): string {
  if (!warnings || warnings.length === 0) return '';
  return `<div class="notice">⚠️ <strong>Analysis warnings:</strong><ul style="margin-top:6px">${warnings
    .map((w) => `<li>${h(w)}</li>`)
    .join('')}</ul></div>`;
}

function head(kind: string, title: string): string {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(BRAND.name)} — ${h(kind)}: ${h(title)}</title>
${documentCss()}`;
}

export function renderReviewHTML(review: Review): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head('Contract Review', review.documentTitle)}
</head>
<body>
<div class="page">

<div class="cover">
  ${documentEyebrow('Contract Review')}
  <h1>${h(review.documentTitle)}</h1>
  <div class="meta">${h(review.documentType)} · Parties: ${review.parties.map(h).join(', ')}</div>
  <div class="risk-score">${review.riskScore}</div>
  <div>${documentBadge(review.riskLevel)} <span class="meta">Risk Score</span></div>
  <div class="meta" style="margin-top:14px">Generated ${new Date(review.generatedAt).toLocaleDateString()}</div>
  ${documentCoverFinePrint()}
</div>
${warningsHtml(review.warnings)}
<h2>Executive Summary</h2>
<p>${h(review.executiveSummary)}</p>

<h2>Key Terms</h2>
<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Payment Terms</td><td>${h(review.paymentTerms)}</td></tr>
  <tr><td>Renewal Terms</td><td>${h(review.renewalTerms)}</td></tr>
  <tr><td>Termination</td><td>${h(review.terminationTerms)}</td></tr>
  <tr><td>Governing Law</td><td>${h(review.governingLaw)}</td></tr>
  <tr><td>Liability</td><td>${h(review.liabilityIssues)}</td></tr>
  <tr><td>Indemnification</td><td>${h(review.indemnificationIssues)}</td></tr>
  <tr><td>Confidentiality</td><td>${h(review.confidentialityTerms)}</td></tr>
</table>

<h2>Key Dates</h2>
<table>
  <tr><th>Date</th><th>Description</th></tr>
  ${review.keyDates.map((d) => `<tr><td>${h(d.date)}</td><td>${h(d.label)}</td></tr>`).join('')}
</table>

<h2>Risk Matrix</h2>
${review.topRisks
  .map(
    (r) => `
<div class="risk-card ${riskLevel(r.severity)}">
  <div style="margin-bottom:8px">${documentBadge(r.severity)} <strong>${h(r.title)}</strong></div>
  <p><strong>Why it matters:</strong> ${h(r.whyItMatters)}</p>
  <p>${h(r.explanation)}</p>
  ${quoteHtml(r.supportingQuote)}
  <p><strong>Suggested next step:</strong> ${h(r.suggestedNextStep)}</p>
</div>`
  )
  .join('')}

<h2>Missing &amp; Unusual Clauses</h2>
<h3>Missing Clauses</h3>
<ul>${listItems(review.missingClauses)}</ul>
<h3>Unusual Clauses</h3>
<ul>${listItems(review.unusualClauses)}</ul>

<h2>Action Items</h2>
<ol>${listItems(review.actionItems)}</ol>

<h2>Citations</h2>
${review.citations
  .map(
    (c) => `
<div style="margin:12px 0">
  <strong>${h(c.section)}</strong><br>
  ${quoteHtml(c.quote)}
  <em>${h(c.relevance)}</em>
</div>`
  )
  .join('')}

${documentFooter(new Date(review.generatedAt).toLocaleString())}

</div>
</body>
</html>`;
}

export function renderFinancialHTML(financial: Financial): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head('Financial Analysis', financial.documentTitle)}
</head>
<body>
<div class="page">

<div class="cover">
  ${documentEyebrow('Financial Analysis')}
  <h1>${h(financial.documentTitle)}</h1>
  <div class="meta">Generated ${new Date(financial.generatedAt).toLocaleDateString()}</div>
  ${documentCoverFinePrint()}
</div>
${warningsHtml(financial.warnings)}
<h2>Financial Summary</h2>
<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Total Contract Value</td><td>${h(financial.totalContractValue)}</td></tr>
  <tr><td>Recurring Fees</td><td>${h(financial.recurringFees)}</td></tr>
  <tr><td>One-Time Fees</td><td>${h(financial.oneTimeFees)}</td></tr>
  <tr><td>Payment Schedule</td><td>${h(financial.paymentSchedule)}</td></tr>
  <tr><td>Late Fees</td><td>${h(financial.lateFees)}</td></tr>
  <tr><td>Penalties</td><td>${h(financial.penalties)}</td></tr>
  <tr><td>Discounts</td><td>${h(financial.discounts)}</td></tr>
  <tr><td>Equity Terms</td><td>${h(financial.equityTerms)}</td></tr>
  <tr><td>Revenue Share</td><td>${h(financial.revenueShare)}</td></tr>
  <tr><td>Refund Terms</td><td>${h(financial.refundTerms)}</td></tr>
  <tr><td>Renewal Cost Changes</td><td>${h(financial.renewalCostChanges)}</td></tr>
</table>

<h2>Financial Red Flags</h2>
${financial.financialRedFlags
  .map(
    (f) => `
<div class="risk-card ${riskLevel(f.severity)}">
  <div style="margin-bottom:8px">${documentBadge(f.severity)} <strong>${h(f.issue)}</strong></div>
  <p>${h(f.explanation)}</p>
  ${quoteHtml(f.supportingQuote)}
</div>`
  )
  .join('')}

<h2>Citations</h2>
${financial.citations.map((c) => `<div style="margin:12px 0"><strong>${h(c.section)}</strong><br>${quoteHtml(c.quote)}<em>${h(c.relevance)}</em></div>`).join('')}

${documentFooter(new Date(financial.generatedAt).toLocaleString())}

</div>
</body>
</html>`;
}

export function renderMemoHTML(memo: Memo): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head('Executive Memo', memo.documentTitle)}
</head>
<body>
<div class="page">

<div class="cover">
  ${documentEyebrow('Executive Memo')}
  <h1>${h(memo.documentTitle)}</h1>
  <div class="meta">Memo Date: ${h(memo.memoDate)}</div>
  ${documentCoverFinePrint()}
</div>

<h2>Executive Summary</h2>
<p>${h(memo.executiveSummary)}</p>

<h2>Biggest Risks</h2>
${memo.biggestRisks.map((r) => `<div class="risk-card ${riskLevel(r.severity)}" style="margin:12px 0">${documentBadge(r.severity)} <strong>${h(r.risk)}</strong><p style="margin-top:8px">${h(r.explanation)}</p></div>`).join('')}

<h2>Financial Obligations</h2>
<ul>${listItems(memo.financialObligations)}</ul>

<h2>Important Deadlines</h2>
<table>
  <tr><th>Deadline</th><th>Date</th></tr>
  ${memo.importantDeadlines.map((d) => `<tr><td>${h(d.label)}</td><td>${h(d.date)}</td></tr>`).join('')}
</table>

<h2>Questions for Your Lawyer</h2>
<ol>${listItems(memo.questionsForLawyer)}</ol>

<h2>Action Items</h2>
<ol>${listItems(memo.actionItems)}</ol>

${documentFooter(new Date(memo.generatedAt).toLocaleString())}

</div>
</body>
</html>`;
}

export function renderRevisionHTML(revision: Revision): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head('Revision Packet', revision.documentTitle)}
</head>
<body>
<div class="page">

<div class="cover">
  ${documentEyebrow('Revision Packet')}
  <h1>${h(revision.documentTitle)}</h1>
  <div class="meta">Generated ${new Date(revision.generatedAt).toLocaleDateString()}</div>
  ${documentCoverFinePrint()}
</div>

<h2>Revision Summary</h2>
<p>${h(revision.revisionSummary)}</p>

<h2>Priority Changes</h2>
<ol>${listItems(revision.priorityChanges)}</ol>

<h2>Clause Revisions</h2>
<div class="notice">✏️ ${h(revision.revisionDisclaimer)}</div>
${revision.clauseRevisions
  .map(
    (c) => `
<div class="risk-card ${riskLevel(c.severity)}" style="margin:20px 0">
  <div style="margin-bottom:12px">${documentBadge(c.severity)} <strong>${h(c.section)}</strong></div>
  <p><strong>Issue:</strong> ${h(c.issue)}</p>
  <h3>Original Language</h3>
  ${quoteHtml(c.originalLanguage)}
  <h3>Suggested Replacement Language (For Professional Review)</h3>
  <blockquote style="border-color:#15803d;background:#f0fdf4;color:#14532d">${h(c.suggestedReplacementLanguage)}</blockquote>
  <p><strong>Why it matters:</strong> ${h(c.whyItMatters)}</p>
</div>`
  )
  .join('')}

<h2>Negotiation Notes</h2>
<ul>${listItems(revision.negotiationNotes)}</ul>

<h2>Questions for Your Lawyer</h2>
<ol>${listItems(revision.lawyerQuestions)}</ol>

${documentFooter(new Date(revision.generatedAt).toLocaleString())}

</div>
</body>
</html>`;
}

export function renderFullPacketHTML(
  review: Review,
  financial: Financial | null,
  memo: Memo | null,
  revision: Revision | null
): string {
  function innerReview(): string {
    return `
<h2>Executive Summary</h2>
<p>${h(review.executiveSummary)}</p>

<h2>Key Terms</h2>
<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Payment Terms</td><td>${h(review.paymentTerms)}</td></tr>
  <tr><td>Renewal Terms</td><td>${h(review.renewalTerms)}</td></tr>
  <tr><td>Termination</td><td>${h(review.terminationTerms)}</td></tr>
  <tr><td>Governing Law</td><td>${h(review.governingLaw)}</td></tr>
  <tr><td>Liability</td><td>${h(review.liabilityIssues)}</td></tr>
  <tr><td>Confidentiality</td><td>${h(review.confidentialityTerms)}</td></tr>
</table>

<h2>Risk Matrix</h2>
${review.topRisks.map((r) => `
<div class="risk-card ${riskLevel(r.severity)}">
  <div style="margin-bottom:6px">${documentBadge(r.severity)} <strong>${h(r.title)}</strong></div>
  <p>${h(r.explanation)}</p>
  ${quoteHtml(r.supportingQuote)}
  <p><strong>Next step:</strong> ${h(r.suggestedNextStep)}</p>
</div>`).join('')}

<h2>Action Items</h2>
<ol>${listItems(review.actionItems)}</ol>`;
  }

  function innerFinancial(): string {
    if (!financial) return '<p>No financial analysis available.</p>';
    return `
<h2>Financial Summary</h2>
<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Total Contract Value</td><td>${h(financial.totalContractValue)}</td></tr>
  <tr><td>Recurring Fees</td><td>${h(financial.recurringFees)}</td></tr>
  <tr><td>One-Time Fees</td><td>${h(financial.oneTimeFees)}</td></tr>
  <tr><td>Payment Schedule</td><td>${h(financial.paymentSchedule)}</td></tr>
  <tr><td>Late Fees</td><td>${h(financial.lateFees)}</td></tr>
  <tr><td>Refund Terms</td><td>${h(financial.refundTerms)}</td></tr>
  <tr><td>Renewal Cost Changes</td><td>${h(financial.renewalCostChanges)}</td></tr>
</table>

<h2>Financial Red Flags</h2>
${financial.financialRedFlags.map((f) => `
<div class="risk-card ${riskLevel(f.severity)}">
  ${documentBadge(f.severity)} <strong>${h(f.issue)}</strong>
  <p style="margin-top:6px">${h(f.explanation)}</p>
  ${quoteHtml(f.supportingQuote)}
</div>`).join('')}`;
  }

  function innerMemo(): string {
    if (!memo) return '<p>No executive memo available.</p>';
    return `
<h2>Executive Summary</h2>
<p>${h(memo.executiveSummary)}</p>

<h2>Biggest Risks</h2>
${memo.biggestRisks.map((r) => `
<div class="risk-card ${riskLevel(r.severity)}" style="margin:10px 0">
  ${documentBadge(r.severity)} <strong>${h(r.risk)}</strong>
  <p style="margin-top:6px">${h(r.explanation)}</p>
</div>`).join('')}

<h2>Financial Obligations</h2>
<ul>${listItems(memo.financialObligations)}</ul>

<h2>Questions for Your Lawyer</h2>
<ol>${listItems(memo.questionsForLawyer)}</ol>

<h2>Action Items</h2>
<ol>${listItems(memo.actionItems)}</ol>`;
  }

  function innerRevision(): string {
    if (!revision) return '<p>No revision packet available.</p>';
    return `
<h2>Revision Summary</h2>
<p>${h(revision.revisionSummary)}</p>

<h2>Priority Changes</h2>
<ol>${listItems(revision.priorityChanges)}</ol>

<h2>Clause Revisions</h2>
<div class="notice">✏️ ${h(revision.revisionDisclaimer)}</div>
${revision.clauseRevisions.map((c) => `
<div class="risk-card ${riskLevel(c.severity)}" style="margin:16px 0">
  ${documentBadge(c.severity)} <strong>${h(c.section)}</strong>
  <p style="margin-top:8px"><strong>Issue:</strong> ${h(c.issue)}</p>
  <p><strong>Original:</strong></p>
  ${quoteHtml(c.originalLanguage)}
  <p><strong>Suggested (for professional review):</strong></p>
  <blockquote style="border-color:#15803d;background:#f0fdf4;color:#14532d">${h(c.suggestedReplacementLanguage)}</blockquote>
</div>`).join('')}

<h2>Negotiation Notes</h2>
<ul>${listItems(revision.negotiationNotes)}</ul>

<h2>Questions for Your Lawyer</h2>
<ol>${listItems(revision.lawyerQuestions)}</ol>`;
  }

  const generatedAt = new Date(review.generatedAt).toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head('Full Review Packet', review.documentTitle)}
</head>
<body>
<div class="page">

<div class="cover">
  ${documentEyebrow('Full Review Packet')}
  <h1>${h(review.documentTitle)}</h1>
  <div class="meta">${h(review.documentType)} · Parties: ${review.parties.map(h).join(', ')}</div>
  <div class="risk-score">${review.riskScore}</div>
  <div>${documentBadge(review.riskLevel)} <span class="meta">Risk Score</span></div>
  <div class="meta" style="margin-top:12px">Generated ${h(generatedAt)}</div>
  ${documentCoverFinePrint()}
</div>
${warningsHtml(review.warnings)}
<div class="section-header">Part 1 — Contract Review</div>
${innerReview()}

<div class="section-break">
  <div class="section-header">Part 2 — Financial Analysis</div>
  ${innerFinancial()}
</div>

<div class="section-break">
  <div class="section-header">Part 3 — Executive Memo</div>
  ${innerMemo()}
</div>

<div class="section-break">
  <div class="section-header">Part 4 — Revision Packet</div>
  ${innerRevision()}
</div>

${documentFooter(`${generatedAt} · Full Review Packet`)}

</div>
</body>
</html>`;
}
