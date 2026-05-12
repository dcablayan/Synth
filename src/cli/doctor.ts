#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

interface Check {
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
}

const checks: Check[] = [];

function check(label: string, fn: () => 'pass' | 'fail' | 'warn', detail?: string): void {
  try {
    const status = fn();
    checks.push({ label, status, detail });
  } catch (e) {
    checks.push({ label, status: 'fail', detail: e instanceof Error ? e.message : String(e) });
  }
}

function dirExists(p: string): 'pass' | 'fail' {
  return fs.existsSync(path.join(ROOT, p)) ? 'pass' : 'fail';
}

// Node version
check('Node.js version ≥ 18', () => {
  const version = parseInt(process.version.replace('v', '').split('.')[0]);
  return version >= 18 ? 'pass' : 'fail';
}, `Found ${process.version}`);

// Required directories
const REQUIRED_DIRS = [
  'documents/inbox',
  'documents/processed',
  'reports/reviews',
  'reports/memos',
  'reports/financials',
  'reports/revisions',
  'reports/html',
  'reports/pdfs',
  'reports/exports',
  'templates',
  'src/cli',
  'src/lib',
  'src/schemas',
  'src/prompts',
  'agent',
];

for (const dir of REQUIRED_DIRS) {
  check(`Directory: /${dir}`, () => dirExists(dir));
}

// Sample documents
check('Sample: sample-saas-agreement.txt', () =>
  fs.existsSync(path.join(ROOT, 'documents/inbox/sample-saas-agreement.txt')) ? 'pass' : 'fail'
);
check('Sample: sample-term-sheet.txt', () =>
  fs.existsSync(path.join(ROOT, 'documents/inbox/sample-term-sheet.txt')) ? 'pass' : 'fail'
);
check('Sample: sample-contractor-agreement.txt', () =>
  fs.existsSync(path.join(ROOT, 'documents/inbox/sample-contractor-agreement.txt')) ? 'pass' : 'fail'
);

// PDF templates
const TEMPLATES = ['review-pdf.html', 'financial-pdf.html', 'revision-packet.html', 'full-packet.html'];
for (const t of TEMPLATES) {
  check(`Template: ${t}`, () => {
    const p = path.join(ROOT, 'templates', t);
    if (!fs.existsSync(p)) return 'fail';
    if (fs.statSync(p).size < 100) return 'warn';
    return 'pass';
  });
}

// Environment variables
check('AI Provider config', () => {
  if (process.env.OPENAI_API_KEY) return 'pass';
  return 'warn';
}, process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY is set' : 'No API key found — mock mode will be used');

check('Mock mode available', () => 'pass', 'Mock mode always available (no API key required)');

// Reports directory writable
check('Reports directory is writable', () => {
  const dir = path.join(ROOT, 'reports');
  try {
    const testFile = path.join(dir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return 'pass';
  } catch {
    return 'fail';
  }
});

// Playwright / Chromium
check('Playwright / Chromium installed', () => {
  try {
    execSync('npx playwright --version', { stdio: 'ignore' });
    try {
      const chromiumPath = execSync('npx playwright chromium-path 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
      if (chromiumPath && fs.existsSync(chromiumPath)) return 'pass';
      return 'warn';
    } catch {
      return 'warn';
    }
  } catch {
    return 'warn';
  }
}, 'Run: npx playwright install chromium (required for PDF generation)');

// package.json scripts
check('package.json scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const required = ['doctor', 'verify', 'demo', 'analyze', 'memo', 'revise', 'pdf', 'packet', 'dashboard', 'build'];
  const missing = required.filter((s) => !pkg.scripts?.[s]);
  if (missing.length > 0) return 'fail';
  return 'pass';
}, 'All CLI scripts registered in package.json');

// Print results
console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║           Synth · System Doctor                  ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log('⚠️  Synth is not legal advice or financial advice.\n   It is a document review aid. Consult a qualified professional.\n');

const passed = checks.filter((c) => c.status === 'pass').length;
const warned = checks.filter((c) => c.status === 'warn').length;
const failed = checks.filter((c) => c.status === 'fail').length;

for (const c of checks) {
  const icon = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️ ' : '❌';
  const detail = c.detail ? `  → ${c.detail}` : '';
  console.log(`  ${icon} ${c.label}${detail}`);
}

console.log(`\n  Passed: ${passed}  Warnings: ${warned}  Failed: ${failed}`);

if (failed > 0) {
  console.log('\n  ❌ Some checks failed. Run npm install and check the setup.');
  process.exit(1);
} else if (warned > 0) {
  console.log('\n  ⚠️  Ready with warnings. PDF generation requires: npx playwright install chromium');
} else {
  console.log('\n  ✅ Synth is ready. Run: npm run demo');
}
console.log();
