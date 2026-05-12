import Link from 'next/link';

export default function CaseStudyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-slate-950/90 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-400 font-mono font-bold text-lg">&#9123; Synth</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm">Case Study</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Demo</Link>
            <Link href="/artifacts" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Artifacts</Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Dashboard</Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="text-blue-400 text-xs uppercase tracking-widest font-semibold mb-4">Case Study</div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Building Synth v5: Local AI Diligence Cockpit
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            How I built a local-first, CLI-driven document review system that turns contracts, spreadsheets, cap tables,
            and cross-document data room reports into a structured analyst workflow — with an issue log, evidence ledger,
            CSV/XLSX exports, and run comparison baked in.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>Solo build · 2026</span>
            <span>·</span>
            <span>TypeScript · Next.js · Playwright · Zod · xlsx</span>
            <span>·</span>
            <span>v5</span>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          {/* Problem */}
          <Section title="The Problem">
            <p>
              Most &ldquo;AI contract review&rdquo; tools are chat interfaces. You paste in a contract, ask questions, and get
              free-form answers. This is useful for quick lookups but falls short for serious document work:
            </p>
            <ul>
              <li>Results aren&rsquo;t structured or repeatable</li>
              <li>No generated artifacts — no PDFs, no revision packets, no memos</li>
              <li>Hard to integrate into a professional workflow</li>
              <li>No audit trail of what was analyzed and when</li>
              <li>Can&rsquo;t be operated by another AI agent or automated pipeline</li>
              <li>No way to track which issues are open, resolved, or waived across documents</li>
            </ul>
            <p>
              Founders, analysts, and early-career professionals often need to review contracts, term sheets, and financial
              schedules quickly — without immediate access to legal counsel. They need structured analysis they can act on,
              not a chat box.
            </p>
          </Section>

          {/* Why Not Just Chat With PDF */}
          <Section title="Why This Is Not Just &ldquo;Chat With PDF&rdquo;">
            <p>
              Chat-with-PDF tools answer questions. Synth produces structured artifacts. The distinction matters:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Chat with PDF', items: ['Freeform Q&A output', 'Nothing to audit', 'Re-run = different answer', 'No downstream format', 'No validation layer', 'No PDF, no memo, no revision packet', 'No issue tracking or evidence', 'No exports or run comparison'] },
                { label: 'Synth v5', items: ['Zod-validated JSON output', 'Reports are saved artifacts', 'Re-run = same schema, consistent structure', 'HTML → PDF → dashboard', 'CSV/XLSX ingestion + table profiling', 'Cross-document: contracts + spreadsheets + cap tables', 'Issue log + evidence ledger per run', 'CSV/XLSX exports + run diff comparison'] },
              ].map(({ label, items }) => (
                <div key={label} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-white text-xs font-semibold mb-2">{label}</div>
                  <ul className="space-y-1 list-none p-0">
                    {items.map((item) => (
                      <li key={item} className="text-slate-400 text-xs flex items-start gap-2">
                        <span className="text-slate-600 mt-0.5">{label === 'Synth v5' ? '✓' : '✗'}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* My Role */}
          <Section title="My Role">
            <p>I designed and built Synth end-to-end as a solo portfolio project. The goal was to demonstrate:</p>
            <ul>
              <li>Full-stack TypeScript architecture (Next.js App Router + Node CLI)</li>
              <li>AI system design with mock mode, schema validation, and graceful fallback</li>
              <li>Document processing pipelines (.txt, .md, .pdf, .docx, .csv, .xlsx) with structured outputs</li>
              <li>PDF generation from HTML templates via Playwright Chromium</li>
              <li>Issue tracking layer: convert report outputs to actionable issues with evidence links</li>
              <li>Export engine: CSV and multi-sheet XLSX from structured report data</li>
              <li>Compare engine: diff two data room runs to detect added, removed, and changed findings</li>
              <li>Agent-native documentation (CLAUDE.md, CODEX.md)</li>
              <li>Local-first, cloneable repo — not just a deployed UI</li>
              <li>Eval harness for deterministic correctness checks (98 checks in v5)</li>
            </ul>
          </Section>

          {/* Architecture Diagram */}
          <Section title="Architecture">
            <p>Synth is organized into four layers:</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300 mb-4">
              <div className="text-slate-500 mb-2">┌─────────────────────────────────────────┐</div>
              <div className="text-slate-500">│  CLI Layer  (<span className="text-blue-400">src/cli/</span>)                   │</div>
              <div className="text-slate-500">│  analyze · demo · memo · revise · packet  │</div>
              <div className="text-slate-500">│  ingest · spreadsheet · dataroom (v4)     │</div>
              <div className="text-slate-500">│  triage · export · compare (v5)           │</div>
              <div className="text-slate-500">│  seed-demo · eval · pdf · doctor · verify │</div>
              <div className="text-slate-500">├─────────────────────────────────────────┤</div>
              <div className="text-slate-500">│  Library Layer  (<span className="text-blue-400">src/lib/</span>)              │</div>
              <div className="text-slate-500">│  ai-provider · mock-provider · parser     │</div>
              <div className="text-slate-500">│  spreadsheet-parser · mock-spreadsheet-provider (v4)│</div>
              <div className="text-slate-500">│  issue-engine · export-engine · compare-engine (v5)│</div>
              <div className="text-slate-500">│  html-renderer · pdf-writer · risk-scoring│</div>
              <div className="text-slate-500">├─────────────────────────────────────────┤</div>
              <div className="text-slate-500">│  Schema Layer  (<span className="text-blue-400">src/schemas/</span>)          │</div>
              <div className="text-slate-500">│  Zod: review · financial · memo · revision│</div>
              <div className="text-slate-500">│  TableProfile · SpreadsheetAnalysis (v4)  │</div>
              <div className="text-slate-500">│  DataRoomSummary · CrossDocumentFinding (v4)│</div>
              <div className="text-slate-500">│  Issue · EvidenceItem · IssueLog · CompareReport (v5)│</div>
              <div className="text-slate-500">├─────────────────────────────────────────┤</div>
              <div className="text-slate-500">│  UI Layer  (<span className="text-blue-400">src/app/</span>)                 │</div>
              <div className="text-slate-500">│  / · /demo · /artifacts · /dashboard      │</div>
              <div className="text-slate-500">│  /case-study                              │</div>
              <div className="text-slate-500">└─────────────────────────────────────────┘</div>
              <div className="mt-3 text-slate-500">          ↓ outputs to</div>
              <div className="text-slate-500">  reports/ (json · md · html · pdf · evals)</div>
              <div className="text-slate-500">  reports/issues/ · reports/evidence/ (v5)</div>
              <div className="text-slate-500">  reports/exports/ · reports/compare/ (v5)</div>
              <div className="text-slate-500">  public/demo-artifacts/ (static for /artifacts)</div>
              <div className="text-slate-500">  src/data/demo/ (fixtures for /demo)</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { layer: 'CLI Layer', desc: 'tsx scripts, one per command. Each is atomic and composable. npm run packet chains the contract pipeline. v5 adds triage → export → compare for the analyst loop.' },
                { layer: 'Library Layer', desc: 'AI provider abstraction, document loading (.txt/.md/.pdf/.docx/.csv/.xlsx), risk scoring, HTML/PDF rendering. v5 adds issue-engine, export-engine, compare-engine.' },
                { layer: 'Schema Layer', desc: 'Zod schemas validate every AI output. If validation fails, the system logs the error and falls back to mock. v5 adds Issue, EvidenceItem, IssueLog, CompareReport.' },
                { layer: 'UI Layer', desc: 'Next.js App Router. Dashboard reads from /reports/ at request time. /demo uses committed fixture data. v5 adds Issue Log, Evidence Ledger, Export Center, Compare panels.' },
              ].map(({ layer, desc }) => (
                <div key={layer} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-white font-medium text-sm mb-1">{layer}</div>
                  <div className="text-slate-400 text-xs">{desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* What Changed v1 to v5 */}
          <Section title="What Changed from v1 to v5">
            <div className="space-y-3">
              {[
                {
                  version: 'v1',
                  label: 'Foundation',
                  items: [
                    'Basic CLI pipeline (analyze → memo → revise → pdf)',
                    '.txt ingestion only',
                    'Mock provider for zero-API operation',
                    'Local dashboard (Next.js)',
                    'HTML + PDF reports',
                  ],
                },
                {
                  version: 'v2',
                  label: 'Document-Aware',
                  items: [
                    'Added .pdf and .docx ingestion',
                    'Document-aware mock mode (extracts real quotes)',
                    'Full packet PDF (review + financial + memo + revision combined)',
                    'npm run demo on 3 sample contracts',
                    'Agent docs (CLAUDE.md, CODEX.md)',
                  ],
                },
                {
                  version: 'v3',
                  label: 'Recruiter-Ready',
                  items: [
                    '/demo route — works without local reports or API keys',
                    '/artifacts gallery — downloadable sample outputs',
                    'npm run seed-demo — refreshes demo data from pipeline',
                    'npm run eval — deterministic correctness checks',
                    'AI reliability: safe JSON parsing, error saving, graceful fallback',
                    'Source metadata on all outputs (filename, extension, chars, provider mode)',
                    'Dashboard v3: recruiter card, metadata display, fallback badges',
                  ],
                },
                {
                  version: 'v4',
                  label: 'Data Room Review',
                  items: [
                    'CSV + XLSX ingestion with table profiling (headers, types, amounts, dates, entities)',
                    'New schemas: TableProfile, SpreadsheetAnalysis, DataRoomSummary, CrossDocumentFinding, PaymentScheduleFinding, CapTableFinding',
                    'npm run ingest — parse all file types in inbox',
                    'npm run spreadsheet — analyze CSV/XLSX → reports/tables/ (JSON + MD + HTML)',
                    'npm run dataroom — full mixed-packet analysis → reports/dataroom/ (JSON + MD + HTML + PDF)',
                    'Cross-document checks: payment terms vs. schedules, cap table vs. term sheet, duplicate vendors',
                    'Document-aware mock mode for spreadsheets (uses real headers, amounts, entities)',
                    'AI overlay for spreadsheets + dataroom: mock base + AI narrative enrichment + Zod validation',
                    'Dashboard v4: spreadsheet profiles, data room overview, payment schedule, cap table findings',
                  ],
                },
                {
                  version: 'v5',
                  label: 'Diligence Workflow',
                  items: [
                    'Issue log system: convert all report findings into structured Issues with severity, category, status, and evidence links',
                    'New schemas: Issue, EvidenceItem, IssueLog, CompareReport',
                    'Evidence ledger: every issue backed by at least one evidence item (document quote, spreadsheet row, or verificationNote)',
                    'npm run triage — reports → reports/issues/ + reports/evidence/ (JSON + MD + HTML)',
                    'npm run export — issues.csv, evidence.csv, payments.csv, cap-table.csv, dataroom-summary.xlsx',
                    'npm run compare — diff two data room runs → reports/compare/ (added/removed/changed issues, payment changes, cap table changes)',
                    'Dashboard v5: Unified Issue Log panel, Evidence Ledger, Export Center, Compare Runs, severity filters',
                    '/demo shows v5 Issue Log and Evidence Ledger sections',
                    'Eval v5: 98 checks (added issue schema, evidence links, export files, compare engine)',
                  ],
                },
              ].map(({ version, label, items }) => (
                <div key={version} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded">{version}</span>
                    <span className="text-white text-sm font-medium">{label}</span>
                  </div>
                  <ul className="space-y-1 list-none p-0">
                    {items.map((item) => (
                      <li key={item} className="text-slate-400 text-xs flex items-start gap-2">
                        <span className="text-slate-600 mt-0.5">›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* Workflow */}
          <Section title="How the Workflow Works">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-1 mb-4">
              <div className="text-slate-500"># 1. Drop documents into inbox</div>
              <div>cp my-contract.pdf documents/inbox/</div>
              <div>cp cap-table.csv documents/inbox/</div>
              <div className="mt-2 text-slate-500"># 2a. Contract review pipeline</div>
              <div>npm run packet</div>
              <div className="pl-4 text-blue-400">→ Detect document type (.txt/.md/.pdf/.docx)</div>
              <div className="pl-4 text-blue-400">→ Run contract review + financial + memo + revision</div>
              <div className="pl-4 text-blue-400">→ Render HTML → PDF via Playwright</div>
              <div className="mt-2 text-slate-500"># 2b. v4: Spreadsheet + data room analysis</div>
              <div>npm run spreadsheet  <span className="text-slate-500"># CSV/XLSX → reports/tables/</span></div>
              <div>npm run dataroom     <span className="text-slate-500"># cross-doc → reports/dataroom/</span></div>
              <div className="mt-2 text-slate-500"># 2c. v5: Analyst workflow loop</div>
              <div>npm run triage       <span className="text-slate-500"># reports → issue log + evidence ledger</span></div>
              <div className="pl-4 text-blue-400">→ Convert all findings to structured Issues</div>
              <div className="pl-4 text-blue-400">→ Link every issue to at least one EvidenceItem</div>
              <div className="pl-4 text-blue-400">→ Save JSON + MD + HTML → reports/issues/ + reports/evidence/</div>
              <div className="mt-1">npm run export       <span className="text-slate-500"># issues + data → CSV/XLSX</span></div>
              <div className="pl-4 text-blue-400">→ issues.csv, evidence.csv, payments.csv</div>
              <div className="pl-4 text-blue-400">→ cap-table.csv, dataroom-summary.xlsx (5-sheet workbook)</div>
              <div className="mt-1">npm run compare      <span className="text-slate-500"># diff two runs</span></div>
              <div className="pl-4 text-blue-400">→ Added / removed / changed issues</div>
              <div className="pl-4 text-blue-400">→ Payment and cap table deltas</div>
              <div className="pl-4 text-blue-400">→ Save JSON + MD + HTML → reports/compare/</div>
              <div className="mt-2 text-slate-500"># 3. Open dashboard</div>
              <div>npm run dashboard</div>
            </div>
            <p>
              Each artifact (JSON, Markdown, HTML, PDF, CSV, XLSX) is derived from the same structured data. The JSON output
              is the ground truth — all other formats are rendered from it, ensuring consistency. The v5 triage loop reads
              v4 report outputs as inputs, so no data is duplicated between the layers.
            </p>
          </Section>

          {/* AI Safety */}
          <Section title="Safety and Limitations">
            <p>
              Legal and financial documents carry high stakes. Synth is built with explicit safety constraints — and explicit
              acknowledgment of what it cannot do.
            </p>
            <div className="space-y-3">
              {[
                { title: 'Disclaimer everywhere', desc: 'The "not legal advice" disclaimer appears on every page, every PDF, every CLI output, and every report artifact — including the issue log and export files. It cannot be turned off.' },
                { title: 'Required document quotes', desc: 'Every risk finding must include a direct quote from the document. The eval harness checks that mock mode does not use generic "See document" placeholders when a real quote exists.' },
                { title: '"Not found in the document."', desc: 'When a field cannot be extracted, the system outputs this exact sentinel — not an empty string, not a hallucinated value. The eval harness checks this contract.' },
                { title: 'No issue without evidence', desc: 'Every issue in the v5 issue log is linked to at least one EvidenceItem. If direct evidence is unavailable (e.g., in mock mode), a verificationNote explains why. The eval harness enforces this invariant.' },
                { title: 'Revision language framing', desc: 'Suggested edits are always labeled as "suggested replacement language for review by a qualified professional" — never as valid legal text.' },
                { title: 'Zod validation + fallback', desc: 'All AI outputs are validated against strict Zod schemas. If validation fails, the raw error is saved to /reports/errors/ and the system falls back to mock mode — never crashes silently.' },
                { title: 'What Synth cannot do', desc: 'Synth is not a substitute for legal counsel. It does not detect all legal risks. It does not understand context that isn\'t in the document. It is a document review aid, not a legal advisor.' },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-white text-sm font-medium mb-1">{title}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
            <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg p-4 mt-2">
              <p className="text-yellow-200/80 text-xs leading-relaxed">
                ⚠️ Additional limitations: Mock mode produces illustrative output, not document-specific AI analysis. Real AI
                analysis requires an OpenAI-compatible API key. PDF generation requires Playwright and a Chromium installation.
                XLSX support covers standard table sheets — complex pivot tables or merged cells may not parse correctly.
                Synth is not audited for legal or compliance workflows and is not a production system.
              </p>
            </div>
          </Section>

          {/* Resume Bullets */}
          <Section title="Resume Bullets">
            <p className="text-slate-500 text-xs mb-3">
              What this project demonstrates for engineering roles:
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <ul className="space-y-2 list-none p-0">
                {[
                  'Built a local-first AI diligence cockpit end-to-end in TypeScript: CLI pipeline, schema validation (Zod), HTML/PDF rendering (Playwright), and Next.js dashboard',
                  'Designed AI output validation layer with safe JSON parsing, Zod schema enforcement, error logging, and graceful mock fallback — preventing silent failures in structured AI outputs',
                  'Implemented multi-format document ingestion (.txt, .md, .pdf, .docx, .csv, .xlsx) with an abstracted AI provider layer supporting both live (OpenAI-compatible) and mock modes',
                  'Built spreadsheet analysis engine for CSV/XLSX: column profiling, currency/date/entity extraction, payment schedule and cap table detection, repeated vendor detection',
                  'Designed cross-document data room analysis — reconciling contract terms against payment schedules, cap tables, and vendor invoices for mismatches and data quality issues',
                  'Built v5 issue log system: converts all report findings (contract risks, cross-document mismatches, overdue payments, data quality warnings) into structured Issues with severity, category, status, and evidence links',
                  'Implemented evidence ledger enforcing that every issue is backed by at least one document quote, spreadsheet row, or verificationNote — verified by eval harness at 98 checks',
                  'Built export engine writing 5-file outputs (issues.csv, evidence.csv, payments.csv, cap-table.csv, dataroom-summary.xlsx) and compare engine diffing two data room runs by issue title, payment vendor, and cap table investor',
                  'Built eval harness with 98 deterministic correctness checks: document type detection, spreadsheet parsing, amount extraction, cross-document mismatch detection, issue schema validation, evidence linkage, export file presence',
                  'Created agent-native documentation (CLAUDE.md, CODEX.md) enabling AI agents to operate, understand, and extend the system without human instruction',
                  'Shipped static demo layer with committed fixture data so the deployed site demonstrates full v5 functionality — issue log, evidence ledger, data room — without local setup or API keys',
                ].map((bullet) => (
                  <li key={bullet} className="text-slate-300 text-xs flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5 min-w-[8px]">›</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Closing */}
          <div className="border-t border-slate-800 pt-8 mt-8">
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Synth v5 is a solo-built prototype demonstrating what a serious, repo-first AI document operations system looks like —
              one that handles contracts, spreadsheets, cap tables, cross-document analysis, issue tracking, evidence ledgers,
              CSV/XLSX exports, and run comparison. It can be cloned, run locally, operated by another AI agent, and extended
              without touching a UI. It is not production legal software.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo" className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded transition-colors">
                Interactive Demo
              </Link>
              <Link href="/artifacts" className="border border-slate-700 hover:border-slate-500 text-slate-300 text-xs px-4 py-2 rounded transition-colors">
                Download Artifacts
              </Link>
              <a href="https://github.com/dylancablayan/synth" className="border border-slate-700 hover:border-slate-500 text-slate-300 text-xs px-4 py-2 rounded transition-colors">
                GitHub
              </a>
            </div>
            <p className="text-slate-700 text-xs mt-6">
              ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">{title}</h2>
      <div className="space-y-4 text-slate-300 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:space-y-2 [&_li]:text-slate-300 [&_p]:text-slate-300 [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
