import fs from 'fs';
import path from 'path';
import type { Review } from '../schemas/review.schema';
import type { Financial } from '../schemas/financial.schema';
import type { Memo } from '../schemas/memo.schema';
import type { Revision } from '../schemas/revision.schema';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function saveReviewJSON(review: Review): string {
  const dir = path.join(REPORTS_DIR, 'reviews');
  ensureDir(dir);
  const filename = `${slug(review.documentTitle)}-review.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(review, null, 2));
  return filepath;
}

export function saveFinancialJSON(financial: Financial): string {
  const dir = path.join(REPORTS_DIR, 'financials');
  ensureDir(dir);
  const filename = `${slug(financial.documentTitle)}-financial.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(financial, null, 2));
  return filepath;
}

export function saveMemoJSON(memo: Memo): string {
  const dir = path.join(REPORTS_DIR, 'memos');
  ensureDir(dir);
  const filename = `${slug(memo.documentTitle)}-memo.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(memo, null, 2));
  return filepath;
}

export function saveRevisionJSON(revision: Revision): string {
  const dir = path.join(REPORTS_DIR, 'revisions');
  ensureDir(dir);
  const filename = `${slug(revision.documentTitle)}-revision.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(revision, null, 2));
  return filepath;
}

export function saveReviewMarkdown(review: Review): string {
  const dir = path.join(REPORTS_DIR, 'reviews');
  ensureDir(dir);
  const filename = `${slug(review.documentTitle)}-review.md`;
  const filepath = path.join(dir, filename);
  const md = buildReviewMarkdown(review);
  fs.writeFileSync(filepath, md);
  return filepath;
}

export function saveMemoMarkdown(memo: Memo): string {
  const dir = path.join(REPORTS_DIR, 'memos');
  ensureDir(dir);
  const filename = `${slug(memo.documentTitle)}-memo.md`;
  const filepath = path.join(dir, filename);
  const md = buildMemoMarkdown(memo);
  fs.writeFileSync(filepath, md);
  return filepath;
}

export function saveRevisionMarkdown(revision: Revision): string {
  const dir = path.join(REPORTS_DIR, 'revisions');
  ensureDir(dir);
  const filename = `${slug(revision.documentTitle)}-revision.md`;
  const filepath = path.join(dir, filename);
  const md = buildRevisionMarkdown(revision);
  fs.writeFileSync(filepath, md);
  return filepath;
}

function buildReviewMarkdown(r: Review): string {
  return `# Contract Review: ${r.documentTitle}

> **Disclaimer:** ${r.disclaimer}

**Document Type:** ${r.documentType}
**Risk Score:** ${r.riskScore}/100 — **${r.riskLevel}**
**Generated:** ${r.generatedAt}
**Parties:** ${r.parties.join(', ')}

---

## Executive Summary

${r.executiveSummary}

---

## Key Terms

| Field | Value |
|-------|-------|
| Payment Terms | ${r.paymentTerms} |
| Renewal Terms | ${r.renewalTerms} |
| Termination | ${r.terminationTerms} |
| Governing Law | ${r.governingLaw} |
| Liability | ${r.liabilityIssues} |
| Indemnification | ${r.indemnificationIssues} |
| Confidentiality | ${r.confidentialityTerms} |

---

## Key Dates

${r.keyDates.map((d) => `- **${d.label}:** ${d.date}`).join('\n')}

---

## Risk Matrix

${r.topRisks
  .map(
    (risk) => `### ${risk.severity}: ${risk.title}

**Why it matters:** ${risk.whyItMatters}

**Explanation:** ${risk.explanation}

**Suggested next step:** ${risk.suggestedNextStep}

**Supporting quote:** > "${risk.supportingQuote}"

${risk.location ? `**Location:** ${risk.location}` : ''}
`
  )
  .join('\n---\n\n')}

---

## Missing or Unusual Clauses

**Missing clauses:**
${r.missingClauses.map((c) => `- ${c}`).join('\n')}

**Unusual clauses:**
${r.unusualClauses.map((c) => `- ${c}`).join('\n')}

---

## Action Items

${r.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---

## Citations

${r.citations.map((c) => `**${c.section}**\n> "${c.quote}"\n*${c.relevance}*`).join('\n\n')}

---

*${r.disclaimer}*
`;
}

function buildMemoMarkdown(m: Memo): string {
  return `# Executive Memo: ${m.documentTitle}

> **Disclaimer:** ${m.disclaimer}

**Date:** ${m.memoDate}
**Generated:** ${m.generatedAt}

---

## Executive Summary

${m.executiveSummary}

---

## Biggest Risks

${m.biggestRisks
  .map(
    (r) => `### [${r.severity}] ${r.risk}

${r.explanation}`
  )
  .join('\n\n')}

---

## Financial Obligations

${m.financialObligations.map((f) => `- ${f}`).join('\n')}

---

## Important Deadlines

${m.importantDeadlines.map((d) => `- **${d.label}:** ${d.date}`).join('\n')}

---

## Questions for Your Lawyer

${m.questionsForLawyer.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---

## Action Items

${m.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---

*${m.disclaimer}*
`;
}

function buildRevisionMarkdown(r: Revision): string {
  return `# Revision Packet: ${r.documentTitle}

> **Disclaimer:** ${r.revisionDisclaimer}

**Generated:** ${r.generatedAt}

---

## Revision Summary

${r.revisionSummary}

---

## Priority Changes

${r.priorityChanges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---

## Clause Revisions

${r.clauseRevisions
  .map(
    (c) => `### [${c.severity}] ${c.section}

**Issue:** ${c.issue}

**Original language:**
> "${c.originalLanguage}"

**Suggested replacement language (for professional review):**
> ${c.suggestedReplacementLanguage}

**Why it matters:** ${c.whyItMatters}
`
  )
  .join('\n---\n\n')}

---

## Negotiation Notes

${r.negotiationNotes.map((n) => `- ${n}`).join('\n')}

---

## Questions for Your Lawyer

${r.lawyerQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---

*${r.revisionDisclaimer}*
`;
}

export function getLatestReview(): Review | null {
  const dir = path.join(REPORTS_DIR, 'reviews');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('-review.json'));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const sa = fs.statSync(path.join(dir, a)).mtime.getTime();
    const sb = fs.statSync(path.join(dir, b)).mtime.getTime();
    return sb - sa;
  });
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8')) as Review;
}

export function getAllReviews(): Review[] {
  const dir = path.join(REPORTS_DIR, 'reviews');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('-review.json'));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as Review);
}

export function getLatestRevision(): Revision | null {
  const dir = path.join(REPORTS_DIR, 'revisions');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('-revision.json'));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const sa = fs.statSync(path.join(dir, a)).mtime.getTime();
    const sb = fs.statSync(path.join(dir, b)).mtime.getTime();
    return sb - sa;
  });
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8')) as Revision;
}

export function getLatestMemo(): Memo | null {
  const dir = path.join(REPORTS_DIR, 'memos');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('-memo.json'));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const sa = fs.statSync(path.join(dir, a)).mtime.getTime();
    const sb = fs.statSync(path.join(dir, b)).mtime.getTime();
    return sb - sa;
  });
  return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8')) as Memo;
}
