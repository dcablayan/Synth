#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { chunkText, extractDocumentTitle, detectDocumentType } from '../lib/parser';
import { runContractReview, runFinancialAnalysis, runMemoGeneration, runRevisionGeneration } from '../lib/ai-provider';

const CWD = process.cwd();
const INBOX = path.join(CWD, 'documents', 'inbox');
const EVALS_DIR = path.join(CWD, 'reports', 'evals');

const NOT_FOUND = 'Not found in the document.';
const GENERIC_SEE_DOC = /^see document/i;

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

function hasRealQuote(quote: string): boolean {
  return !!quote && quote.length > 10 && !GENERIC_SEE_DOC.test(quote.trim());
}

async function evalDocument(filename: string, expectedType: string): Promise<DocResult> {
  const filepath = path.join(INBOX, filename);
  const checks: Check[] = [];

  // Check 1: File exists and parses
  if (!fs.existsSync(filepath)) {
    return {
      file: filename,
      checks: [{ name: 'File exists', pass: false, message: `File not found: ${filepath}` }],
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

  // Check 6: topRisks all have real supporting quotes (not generic "See document")
  const risksWithRealQuotes = review.topRisks.filter((r) => hasRealQuote(r.supportingQuote));
  const genericQuoteRisks = review.topRisks.filter((r) => !hasRealQuote(r.supportingQuote) && r.supportingQuote);
  checks.push(check(
    'Risk supporting quotes are specific (not "See document")',
    genericQuoteRisks.length === 0,
    `All ${review.topRisks.length} risks have specific quotes`,
    `${genericQuoteRisks.length} risk(s) use generic "See document" quotes: ${genericQuoteRisks.map((r) => r.title).join(', ')}`
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
