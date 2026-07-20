import fs from 'fs';
import path from 'path';
import type { z } from 'zod';
import { ReviewSchema, type Review } from '../schemas/review.schema';
import { FinancialSchema, type Financial } from '../schemas/financial.schema';
import { MemoSchema, type Memo } from '../schemas/memo.schema';
import { RevisionSchema, type Revision } from '../schemas/revision.schema';
import { listRegularFiles, resolveInside, resolveRegularFileInside, safeFileStem } from './path-safety';
import { DISCLAIMER } from './brand';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

// Stems are keyed by title AND source filename: two documents whose first line
// matches would otherwise silently overwrite each other's reports.
export function reportStem(title: string, sourceFilename?: string): string {
  const base = safeFileStem(title).slice(0, 60);
  if (!sourceFilename) return base;
  const src = safeFileStem(path.basename(sourceFilename));
  if (!src || src === base) return base;
  return `${base}--${src}`.slice(0, 100);
}

export function saveReviewJSON(review: Review): string {
  const dir = path.join(REPORTS_DIR, 'reviews');
  ensureDir(dir);
  const filename = `${reportStem(review.documentTitle, review.sourceFilename)}-review.json`;
  const filepath = resolveInside(dir, filename, 'review JSON output');
  fs.writeFileSync(filepath, JSON.stringify(review, null, 2));
  return filepath;
}

export function saveFinancialJSON(financial: Financial): string {
  const dir = path.join(REPORTS_DIR, 'financials');
  ensureDir(dir);
  const filename = `${reportStem(financial.documentTitle, financial.sourceFilename)}-financial.json`;
  const filepath = resolveInside(dir, filename, 'financial JSON output');
  fs.writeFileSync(filepath, JSON.stringify(financial, null, 2));
  return filepath;
}

export function saveMemoJSON(memo: Memo): string {
  const dir = path.join(REPORTS_DIR, 'memos');
  ensureDir(dir);
  const filename = `${reportStem(memo.documentTitle, memo.sourceFilename)}-memo.json`;
  const filepath = resolveInside(dir, filename, 'memo JSON output');
  fs.writeFileSync(filepath, JSON.stringify(memo, null, 2));
  return filepath;
}

export function saveRevisionJSON(revision: Revision): string {
  const dir = path.join(REPORTS_DIR, 'revisions');
  ensureDir(dir);
  const filename = `${reportStem(revision.documentTitle, revision.sourceFilename)}-revision.json`;
  const filepath = resolveInside(dir, filename, 'revision JSON output');
  fs.writeFileSync(filepath, JSON.stringify(revision, null, 2));
  return filepath;
}

export function saveReviewMarkdown(review: Review): string {
  const dir = path.join(REPORTS_DIR, 'reviews');
  ensureDir(dir);
  const filename = `${reportStem(review.documentTitle, review.sourceFilename)}-review.md`;
  const filepath = resolveInside(dir, filename, 'review markdown output');
  const md = buildReviewMarkdown(review);
  fs.writeFileSync(filepath, md);
  return filepath;
}

export function saveMemoMarkdown(memo: Memo): string {
  const dir = path.join(REPORTS_DIR, 'memos');
  ensureDir(dir);
  const filename = `${reportStem(memo.documentTitle, memo.sourceFilename)}-memo.md`;
  const filepath = resolveInside(dir, filename, 'memo markdown output');
  const md = buildMemoMarkdown(memo);
  fs.writeFileSync(filepath, md);
  return filepath;
}

export function saveRevisionMarkdown(revision: Revision): string {
  const dir = path.join(REPORTS_DIR, 'revisions');
  ensureDir(dir);
  const filename = `${reportStem(revision.documentTitle, revision.sourceFilename)}-revision.md`;
  const filepath = resolveInside(dir, filename, 'revision markdown output');
  const md = buildRevisionMarkdown(revision);
  fs.writeFileSync(filepath, md);
  return filepath;
}

function buildReviewMarkdown(r: Review): string {
  const warningsBlock = r.warnings && r.warnings.length > 0
    ? `\n> ⚠️ **Analysis warnings:**\n${r.warnings.map((w) => `> - ${w}`).join('\n')}\n`
    : '';
  return `# Contract Review: ${r.documentTitle}
${warningsBlock}
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

**Generated:** ${r.generatedAt}

---

## Revision Summary

${r.revisionSummary}

---

## Priority Changes

${r.priorityChanges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---

## Clause Revisions

> ✏️ ${r.revisionDisclaimer}

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

*${DISCLAIMER}*
`;
}

// Reports are re-read from disk across process runs, so they are revalidated
// against their schema on load: a hand-edited or corrupted file is skipped with
// a warning instead of being cast blindly and crashing downstream consumers.
function readValidated<T>(dir: string, filename: string, schema: z.ZodType<T>, label: string): T | null {
  try {
    const raw = JSON.parse(fs.readFileSync(resolveRegularFileInside(dir, filename, label), 'utf-8'));
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      console.warn(`  ⚠️  Skipping ${filename}: does not match the ${label} schema`);
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.warn(`  ⚠️  Skipping ${filename}: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

function latestByMtime(dir: string, suffix: string, label: string): string[] {
  const files = listRegularFiles(dir, (f) => f.endsWith(suffix));
  files.sort((a, b) => {
    const sa = fs.statSync(resolveRegularFileInside(dir, a, label)).mtime.getTime();
    const sb = fs.statSync(resolveRegularFileInside(dir, b, label)).mtime.getTime();
    return sb - sa;
  });
  return files;
}

export function getLatestReview(): Review | null {
  const dir = path.join(REPORTS_DIR, 'reviews');
  if (!fs.existsSync(dir)) return null;
  for (const f of latestByMtime(dir, '-review.json', 'review report')) {
    const review = readValidated(dir, f, ReviewSchema, 'review report');
    if (review) return review;
  }
  return null;
}

export function getAllReviews(): Review[] {
  const dir = path.join(REPORTS_DIR, 'reviews');
  if (!fs.existsSync(dir)) return [];
  const files = listRegularFiles(dir, (f) => f.endsWith('-review.json'));
  return files
    .map((f) => readValidated(dir, f, ReviewSchema, 'review report'))
    .filter((r): r is Review => r !== null);
}

export function getLatestRevision(): Revision | null {
  const dir = path.join(REPORTS_DIR, 'revisions');
  if (!fs.existsSync(dir)) return null;
  for (const f of latestByMtime(dir, '-revision.json', 'revision report')) {
    const revision = readValidated(dir, f, RevisionSchema, 'revision report');
    if (revision) return revision;
  }
  return null;
}

export function getLatestMemo(): Memo | null {
  const dir = path.join(REPORTS_DIR, 'memos');
  if (!fs.existsSync(dir)) return null;
  for (const f of latestByMtime(dir, '-memo.json', 'memo report')) {
    const memo = readValidated(dir, f, MemoSchema, 'memo report');
    if (memo) return memo;
  }
  return null;
}

export function getLatestFinancial(): Financial | null {
  const dir = path.join(REPORTS_DIR, 'financials');
  if (!fs.existsSync(dir)) return null;
  for (const f of latestByMtime(dir, '-financial.json', 'financial report')) {
    const financial = readValidated(dir, f, FinancialSchema, 'financial report');
    if (financial) return financial;
  }
  return null;
}

// "Latest memo / financial / revision" is only meaningful relative to a review:
// when several documents have been analyzed, the newest artifact of each type can
// belong to a DIFFERENT document. Packets must never mix documents silently.
export function matchesReview<T extends { documentTitle: string; sourceFilename?: string }>(
  review: Review,
  artifact: T | null,
  label: string,
): T | null {
  if (!artifact) return null;
  const sameDocument =
    review.sourceFilename && artifact.sourceFilename
      ? review.sourceFilename === artifact.sourceFilename
      : artifact.documentTitle === review.documentTitle;
  if (!sameDocument) {
    console.warn(
      `  ⚠️  Latest ${label} is for "${artifact.documentTitle}", not "${review.documentTitle}" — skipping it. Re-run the pipeline to regenerate it for this document.`
    );
    return null;
  }
  return artifact;
}
