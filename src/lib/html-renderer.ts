import type { Review } from '../schemas/review.schema';
import type { Financial } from '../schemas/financial.schema';
import type { Memo } from '../schemas/memo.schema';
import type { Revision } from '../schemas/revision.schema';
import { getRiskBadgeColor } from './risk-scoring';

const DISCLAIMER =
  'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

function baseStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a2e; background: #fff; font-size: 14px; line-height: 1.6; }
      .page { max-width: 800px; margin: 0 auto; padding: 40px; }
      h1 { font-size: 24px; color: #0f172a; margin-bottom: 8px; }
      h2 { font-size: 18px; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 32px 0 16px; }
      h3 { font-size: 15px; color: #1e3a5f; margin: 20px 0 8px; }
      p { margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: left; font-size: 13px; }
      td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: top; }
      tr:nth-child(even) td { background: #f8fafc; }
      blockquote { border-left: 4px solid #3b82f6; padding: 8px 16px; margin: 12px 0; background: #eff6ff; color: #1e40af; font-style: italic; }
      .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; color: #fff; letter-spacing: 0.5px; }
      .cover { text-align: center; padding: 60px 40px; border-bottom: 3px solid #1e3a5f; margin-bottom: 40px; }
      .cover h1 { font-size: 28px; margin-bottom: 16px; }
      .cover .meta { color: #64748b; font-size: 13px; margin-top: 8px; }
      .cover .risk-score { font-size: 48px; font-weight: bold; color: #1e3a5f; margin: 16px 0 4px; }
      .disclaimer { background: #fef9c3; border: 1px solid #fde047; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #713f12; margin: 24px 0; }
      .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      ul { padding-left: 20px; }
      li { margin-bottom: 6px; }
      .risk-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
      .risk-card.Critical { border-left: 4px solid #dc2626; }
      .risk-card.High { border-left: 4px solid #ea580c; }
      .risk-card.Medium { border-left: 4px solid #d97706; }
      .risk-card.Low { border-left: 4px solid #16a34a; }
    </style>
  `;
}

function badgeHtml(level: string): string {
  const color = getRiskBadgeColor(level);
  return `<span class="badge" style="background:${color}">${level}</span>`;
}

export function renderReviewHTML(review: Review): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contract Review — ${review.documentTitle}</title>
${baseStyles()}
</head>
<body>
<div class="page">

<div class="cover">
  <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Synth · Contract Review</div>
  <h1>${review.documentTitle}</h1>
  <div class="meta">${review.documentType} · Parties: ${review.parties.join(', ')}</div>
  <div class="risk-score">${review.riskScore}</div>
  <div>${badgeHtml(review.riskLevel)} Risk Score</div>
  <div class="meta" style="margin-top:16px">Generated ${new Date(review.generatedAt).toLocaleDateString()}</div>
</div>

<div class="disclaimer">⚠️ ${DISCLAIMER}</div>

<h2>Executive Summary</h2>
<p>${review.executiveSummary}</p>

<h2>Key Terms</h2>
<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Payment Terms</td><td>${review.paymentTerms}</td></tr>
  <tr><td>Renewal Terms</td><td>${review.renewalTerms}</td></tr>
  <tr><td>Termination</td><td>${review.terminationTerms}</td></tr>
  <tr><td>Governing Law</td><td>${review.governingLaw}</td></tr>
  <tr><td>Liability</td><td>${review.liabilityIssues}</td></tr>
  <tr><td>Indemnification</td><td>${review.indemnificationIssues}</td></tr>
  <tr><td>Confidentiality</td><td>${review.confidentialityTerms}</td></tr>
</table>

<h2>Key Dates</h2>
<table>
  <tr><th>Date</th><th>Description</th></tr>
  ${review.keyDates.map((d) => `<tr><td>${d.date}</td><td>${d.label}</td></tr>`).join('')}
</table>

<h2>Risk Matrix</h2>
${review.topRisks
  .map(
    (r) => `
<div class="risk-card ${r.severity}">
  <div style="margin-bottom:8px">${badgeHtml(r.severity)} <strong>${r.title}</strong></div>
  <p><strong>Why it matters:</strong> ${r.whyItMatters}</p>
  <p>${r.explanation}</p>
  <blockquote>"${r.supportingQuote}"</blockquote>
  <p><strong>Suggested next step:</strong> ${r.suggestedNextStep}</p>
</div>`
  )
  .join('')}

<h2>Missing &amp; Unusual Clauses</h2>
<h3>Missing Clauses</h3>
<ul>${review.missingClauses.map((c) => `<li>${c}</li>`).join('')}</ul>
<h3>Unusual Clauses</h3>
<ul>${review.unusualClauses.map((c) => `<li>${c}</li>`).join('')}</ul>

<h2>Action Items</h2>
<ol>${review.actionItems.map((a) => `<li>${a}</li>`).join('')}</ol>

<h2>Citations</h2>
${review.citations
  .map(
    (c) => `
<div style="margin:12px 0">
  <strong>${c.section}</strong><br>
  <blockquote>"${c.quote}"</blockquote>
  <em>${c.relevance}</em>
</div>`
  )
  .join('')}

<div class="footer">
  <p>${DISCLAIMER}</p>
  <p>Generated by Synth · ${new Date(review.generatedAt).toLocaleString()} · Page 1</p>
</div>

</div>
</body>
</html>`;
}

export function renderFinancialHTML(financial: Financial): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Financial Analysis — ${financial.documentTitle}</title>
${baseStyles()}
</head>
<body>
<div class="page">

<div class="cover">
  <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Synth · Financial Analysis</div>
  <h1>${financial.documentTitle}</h1>
  <div class="meta">Generated ${new Date(financial.generatedAt).toLocaleDateString()}</div>
</div>

<div class="disclaimer">⚠️ ${DISCLAIMER}</div>

<h2>Financial Summary</h2>
<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Total Contract Value</td><td>${financial.totalContractValue}</td></tr>
  <tr><td>Recurring Fees</td><td>${financial.recurringFees}</td></tr>
  <tr><td>One-Time Fees</td><td>${financial.oneTimeFees}</td></tr>
  <tr><td>Payment Schedule</td><td>${financial.paymentSchedule}</td></tr>
  <tr><td>Late Fees</td><td>${financial.lateFees}</td></tr>
  <tr><td>Penalties</td><td>${financial.penalties}</td></tr>
  <tr><td>Discounts</td><td>${financial.discounts}</td></tr>
  <tr><td>Equity Terms</td><td>${financial.equityTerms}</td></tr>
  <tr><td>Revenue Share</td><td>${financial.revenueShare}</td></tr>
  <tr><td>Refund Terms</td><td>${financial.refundTerms}</td></tr>
  <tr><td>Renewal Cost Changes</td><td>${financial.renewalCostChanges}</td></tr>
</table>

<h2>Financial Red Flags</h2>
${financial.financialRedFlags
  .map(
    (f) => `
<div class="risk-card ${f.severity}">
  <div style="margin-bottom:8px">${badgeHtml(f.severity)} <strong>${f.issue}</strong></div>
  <p>${f.explanation}</p>
  <blockquote>"${f.supportingQuote}"</blockquote>
</div>`
  )
  .join('')}

<h2>Citations</h2>
${financial.citations.map((c) => `<div style="margin:12px 0"><strong>${c.section}</strong><br><blockquote>"${c.quote}"</blockquote><em>${c.relevance}</em></div>`).join('')}

<div class="footer">
  <p>${DISCLAIMER}</p>
  <p>Generated by Synth · ${new Date(financial.generatedAt).toLocaleString()}</p>
</div>

</div>
</body>
</html>`;
}

export function renderMemoHTML(memo: Memo): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Executive Memo — ${memo.documentTitle}</title>
${baseStyles()}
</head>
<body>
<div class="page">

<div class="cover">
  <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Synth · Executive Memo</div>
  <h1>${memo.documentTitle}</h1>
  <div class="meta">Memo Date: ${memo.memoDate}</div>
</div>

<div class="disclaimer">⚠️ ${DISCLAIMER}</div>

<h2>Executive Summary</h2>
<p>${memo.executiveSummary}</p>

<h2>Biggest Risks</h2>
${memo.biggestRisks.map((r) => `<div class="risk-card ${r.severity}" style="margin:12px 0">${badgeHtml(r.severity)} <strong>${r.risk}</strong><p style="margin-top:8px">${r.explanation}</p></div>`).join('')}

<h2>Financial Obligations</h2>
<ul>${memo.financialObligations.map((f) => `<li>${f}</li>`).join('')}</ul>

<h2>Important Deadlines</h2>
<table>
  <tr><th>Deadline</th><th>Date</th></tr>
  ${memo.importantDeadlines.map((d) => `<tr><td>${d.label}</td><td>${d.date}</td></tr>`).join('')}
</table>

<h2>Questions for Your Lawyer</h2>
<ol>${memo.questionsForLawyer.map((q) => `<li>${q}</li>`).join('')}</ol>

<h2>Action Items</h2>
<ol>${memo.actionItems.map((a) => `<li>${a}</li>`).join('')}</ol>

<div class="footer">
  <p>${DISCLAIMER}</p>
  <p>Generated by Synth · ${new Date(memo.generatedAt).toLocaleString()}</p>
</div>

</div>
</body>
</html>`;
}

export function renderRevisionHTML(revision: Revision): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Revision Packet — ${revision.documentTitle}</title>
${baseStyles()}
</head>
<body>
<div class="page">

<div class="cover">
  <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px">Synth · Revision Packet</div>
  <h1>${revision.documentTitle}</h1>
  <div class="meta">Generated ${new Date(revision.generatedAt).toLocaleDateString()}</div>
</div>

<div class="disclaimer">⚠️ ${revision.revisionDisclaimer}</div>

<h2>Revision Summary</h2>
<p>${revision.revisionSummary}</p>

<h2>Priority Changes</h2>
<ol>${revision.priorityChanges.map((c) => `<li>${c}</li>`).join('')}</ol>

<h2>Clause Revisions</h2>
${revision.clauseRevisions
  .map(
    (c) => `
<div class="risk-card ${c.severity}" style="margin:20px 0">
  <div style="margin-bottom:12px">${badgeHtml(c.severity)} <strong>${c.section}</strong></div>
  <p><strong>Issue:</strong> ${c.issue}</p>
  <h3>Original Language</h3>
  <blockquote>"${c.originalLanguage}"</blockquote>
  <h3>Suggested Replacement Language (For Professional Review)</h3>
  <blockquote style="border-color:#16a34a;background:#f0fdf4;color:#14532d">${c.suggestedReplacementLanguage}</blockquote>
  <p><strong>Why it matters:</strong> ${c.whyItMatters}</p>
</div>`
  )
  .join('')}

<h2>Negotiation Notes</h2>
<ul>${revision.negotiationNotes.map((n) => `<li>${n}</li>`).join('')}</ul>

<h2>Questions for Your Lawyer</h2>
<ol>${revision.lawyerQuestions.map((q) => `<li>${q}</li>`).join('')}</ol>

<div class="footer">
  <p>${revision.revisionDisclaimer}</p>
  <p>Generated by Synth · ${new Date(revision.generatedAt).toLocaleString()}</p>
</div>

</div>
</body>
</html>`;
}
