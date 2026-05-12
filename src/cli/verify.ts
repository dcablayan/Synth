#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];

function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}
function warn(msg: string) {
  console.log(`  ⚠️  ${msg}`);
  warnings.push(msg);
}
function fail(msg: string) {
  console.log(`  ❌ ${msg}`);
  errors.push(msg);
}

function requireFile(relPath: string) {
  if (fs.existsSync(path.join(ROOT, relPath))) {
    ok(relPath);
  } else {
    fail(`Missing: ${relPath}`);
  }
}

function requireNonEmpty(relPath: string) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing: ${relPath}`);
    return;
  }
  if (fs.statSync(fullPath).size < 50) {
    warn(`Empty or near-empty: ${relPath}`);
    return;
  }
  ok(relPath);
}

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║           Synth · Repo Verify                    ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log('⚠️  Synth is not legal advice or financial advice.\n   It is a document review aid.\n');

// Required source files
console.log('── Source Files ──────────────────────────────────');
const SRC_FILES = [
  'src/cli/doctor.ts',
  'src/cli/verify.ts',
  'src/cli/demo.ts',
  'src/cli/analyze.ts',
  'src/cli/memo.ts',
  'src/cli/revise.ts',
  'src/cli/generate-pdf.ts',
  'src/cli/packet.ts',
  'src/cli/seed-demo.ts',
  'src/cli/eval.ts',
  'src/lib/document-loader.ts',
  'src/lib/parser.ts',
  'src/lib/ai-provider.ts',
  'src/lib/mock-provider.ts',
  'src/lib/risk-scoring.ts',
  'src/lib/report-writer.ts',
  'src/lib/html-renderer.ts',
  'src/lib/pdf-writer.ts',
  'src/lib/template-loader.ts',
  'src/lib/revision-engine.ts',
  'src/schemas/review.schema.ts',
  'src/schemas/financial.schema.ts',
  'src/schemas/memo.schema.ts',
  'src/schemas/revision.schema.ts',
  'src/prompts/contract-review.prompt.ts',
  'src/prompts/financial-analysis.prompt.ts',
  'src/prompts/memo.prompt.ts',
  'src/prompts/revision.prompt.ts',
];
for (const f of SRC_FILES) requireFile(f);

// Sample documents
console.log('\n── Sample Documents ──────────────────────────────');
requireNonEmpty('documents/inbox/sample-saas-agreement.txt');
requireNonEmpty('documents/inbox/sample-term-sheet.txt');
requireNonEmpty('documents/inbox/sample-contractor-agreement.txt');

// Supported input formats note
console.log('\n── Supported Input Formats ───────────────────────');
ok('.txt  — plain text');
ok('.md   — markdown');
ok('.pdf  — PDF (text-based, requires pdf-parse)');
ok('.docx — Word document (requires mammoth)');
try {
  require.resolve('pdf-parse');
  ok('pdf-parse installed');
} catch {
  warn('pdf-parse not installed — PDF ingestion unavailable (run: npm install pdf-parse)');
}
try {
  require.resolve('mammoth');
  ok('mammoth installed');
} catch {
  warn('mammoth not installed — DOCX ingestion unavailable (run: npm install mammoth)');
}

// PDF templates
console.log('\n── PDF Templates ─────────────────────────────────');
requireNonEmpty('templates/review-pdf.html');
requireNonEmpty('templates/financial-pdf.html');
requireNonEmpty('templates/revision-packet.html');
requireNonEmpty('templates/full-packet.html');

// Agent docs
console.log('\n── Agent Docs ────────────────────────────────────');
requireNonEmpty('agent/CLAUDE.md');
requireNonEmpty('agent/CODEX.md');
requireNonEmpty('agent/SYSTEM_OVERVIEW.md');
requireNonEmpty('agent/WORKFLOWS.md');
requireNonEmpty('agent/SAFETY.md');

// README
console.log('\n── README ────────────────────────────────────────');
requireNonEmpty('README.md');

// Package scripts
console.log('\n── Package Scripts ───────────────────────────────');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const required = ['doctor', 'verify', 'demo', 'analyze', 'memo', 'revise', 'pdf', 'packet', 'seed-demo', 'eval', 'dashboard', 'build'];
  for (const s of required) {
    if (pkg.scripts?.[s]) {
      ok(`script: ${s}`);
    } else {
      fail(`Missing script: ${s}`);
    }
  }
} catch {
  fail('Could not read package.json');
}

// Demo data fixtures
console.log('\n── Demo Data (v3) ────────────────────────────────');
requireNonEmpty('src/data/demo/demo-review.json');
requireNonEmpty('src/data/demo/demo-financial.json');
requireNonEmpty('src/data/demo/demo-memo.json');
requireNonEmpty('src/data/demo/demo-revision.json');
requireNonEmpty('src/data/demo/demo-manifest.json');

// Demo artifacts
console.log('\n── Demo Artifacts (v3) ───────────────────────────');
requireNonEmpty('public/demo-artifacts/demo-full-packet.html');
requireNonEmpty('public/demo-artifacts/demo-review.html');
requireNonEmpty('public/demo-artifacts/demo-review.md');
requireNonEmpty('public/demo-artifacts/demo-review.json');

// CI
console.log('\n── CI ────────────────────────────────────────────');
requireNonEmpty('.github/workflows/ci.yml');

// Report directories
console.log('\n── Report Directories ────────────────────────────');
const REPORT_DIRS = [
  'reports/reviews',
  'reports/memos',
  'reports/financials',
  'reports/revisions',
  'reports/html',
  'reports/pdfs',
  'reports/exports',
  'reports/evals',
];
for (const d of REPORT_DIRS) {
  if (fs.existsSync(path.join(ROOT, d))) {
    ok(d);
  } else {
    fail(`Missing directory: ${d}`);
  }
}

// Summary
console.log(`\n  Errors: ${errors.length}  Warnings: ${warnings.length}`);
if (errors.length > 0) {
  console.log('\n  ❌ Verification failed. Fix errors before running.');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n  ⚠️  Verification passed with warnings.');
} else {
  console.log('\n  ✅ Repo verified. All checks passed.');
}
console.log();
