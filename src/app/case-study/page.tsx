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
            Building Synth: A Repo-First AI Contract Review System
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            How I built a local-first, CLI-driven, agent-native document review system as a portfolio prototype —
            and why the design choices matter for production-grade AI tools.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>Solo build · 2026</span>
            <span>·</span>
            <span>TypeScript · Next.js · Playwright · Zod</span>
            <span>·</span>
            <span>v3</span>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">

          {/* Problem */}
          <Section title="The Problem">
            <p>
              Most "AI contract review" tools are chat interfaces. You paste in a contract, ask questions, and get
              free-form answers. This is useful for quick lookups but falls short for serious document work:
            </p>
            <ul>
              <li>Results aren't structured or repeatable</li>
              <li>No generated artifacts — no PDFs, no revision packets, no memos</li>
              <li>Hard to integrate into a professional workflow</li>
              <li>No audit trail of what was analyzed and when</li>
              <li>Can't be operated by another AI agent or automated pipeline</li>
            </ul>
            <p>
              Founders, analysts, and early-career professionals often need to review contracts quickly — SaaS agreements,
              term sheets, contractor agreements — without immediate access to legal counsel. They need structured analysis,
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
                { label: 'Chat with PDF', items: ['Freeform Q&A output', 'Nothing to audit', 'Re-run = different answer', 'No downstream format', 'No validation layer', 'No PDF, no memo, no revision packet'] },
                { label: 'Synth', items: ['Zod-validated JSON output', 'Reports are saved artifacts', 'Re-run = same schema, consistent structure', 'HTML → PDF → dashboard', 'Schema validation on every output', 'Full packet: review + memo + revisions'] },
              ].map(({ label, items }) => (
                <div key={label} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-white text-xs font-semibold mb-2">{label}</div>
                  <ul className="space-y-1 list-none p-0">
                    {items.map((item) => (
                      <li key={item} className="text-slate-400 text-xs flex items-start gap-2">
                        <span className="text-slate-600 mt-0.5">{label === 'Synth' ? '✓' : '✗'}</span>
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
              <li>Document processing pipelines (.txt, .md, .pdf, .docx) with structured outputs</li>
              <li>PDF generation from HTML templates via Playwright Chromium</li>
              <li>Agent-native documentation (CLAUDE.md, CODEX.md)</li>
              <li>Local-first, cloneable repo — not just a deployed UI</li>
              <li>Eval harness for deterministic correctness checks</li>
            </ul>
          </Section>

          {/* Architecture Diagram */}
          <Section title="Architecture">
            <p>Synth is organized into four layers:</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300 mb-4">
              <div className="text-slate-500 mb-2">┌─────────────────────────────────────────┐</div>
              <div className="text-slate-500">│  CLI Layer  (<span className="text-blue-400">src/cli/</span>)                   │</div>
              <div className="text-slate-500">│  analyze · demo · memo · revise · packet  │</div>
              <div className="text-slate-500">│  seed-demo · eval · pdf · doctor · verify │</div>
              <div className="text-slate-500">├─────────────────────────────────────────┤</div>
              <div className="text-slate-500">│  Library Layer  (<span className="text-blue-400">src/lib/</span>)              │</div>
              <div className="text-slate-500">│  ai-provider · mock-provider · parser     │</div>
              <div className="text-slate-500">│  html-renderer · pdf-writer · risk-scoring│</div>
              <div className="text-slate-500">├─────────────────────────────────────────┤</div>
              <div className="text-slate-500">│  Schema Layer  (<span className="text-blue-400">src/schemas/</span>)          │</div>
              <div className="text-slate-500">│  Zod: review · financial · memo · revision│</div>
              <div className="text-slate-500">├─────────────────────────────────────────┤</div>
              <div className="text-slate-500">│  UI Layer  (<span className="text-blue-400">src/app/</span>)                 │</div>
              <div className="text-slate-500">│  / · /demo · /artifacts · /dashboard      │</div>
              <div className="text-slate-500">│  /case-study                              │</div>
              <div className="text-slate-500">└─────────────────────────────────────────┘</div>
              <div className="mt-3 text-slate-500">          ↓ outputs to</div>
              <div className="text-slate-500">  reports/ (json · md · html · pdf · evals)</div>
              <div className="text-slate-500">  public/demo-artifacts/ (static for /artifacts)</div>
              <div className="text-slate-500">  src/data/demo/ (fixtures for /demo)</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { layer: 'CLI Layer', desc: 'tsx scripts, one per command. Each is atomic and composable. npm run packet chains them all.' },
                { layer: 'Library Layer', desc: 'AI provider abstraction, document loading (.txt/.md/.pdf/.docx), risk scoring, HTML/PDF rendering.' },
                { layer: 'Schema Layer', desc: 'Zod schemas validate every AI output. If validation fails, the system logs the error and falls back to mock.' },
                { layer: 'UI Layer', desc: 'Next.js App Router. Dashboard reads from /reports/ at request time. /demo uses committed fixture data.' },
              ].map(({ layer, desc }) => (
                <div key={layer} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-white font-medium text-sm mb-1">{layer}</div>
                  <div className="text-slate-400 text-xs">{desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* What Changed v1 to v3 */}
          <Section title="What Changed from v1 to v3">
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
                    'GitHub Actions CI: type-check + verify + build + eval',
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
              <div className="text-slate-500"># 1. Drop document into inbox</div>
              <div>cp my-contract.pdf documents/inbox/</div>
              <div className="mt-2 text-slate-500"># 2. Run full pipeline</div>
              <div>npm run packet</div>
              <div className="pl-4 text-blue-400">→ Detect document type (.txt/.md/.pdf/.docx)</div>
              <div className="pl-4 text-blue-400">→ Run contract review (mock or real AI)</div>
              <div className="pl-4 text-blue-400">→ Run financial analysis</div>
              <div className="pl-4 text-blue-400">→ Generate executive memo</div>
              <div className="pl-4 text-blue-400">→ Generate revision packet</div>
              <div className="pl-4 text-blue-400">→ Render HTML → generate PDFs via Playwright</div>
              <div className="pl-4 text-blue-400">→ Generate full-packet PDF</div>
              <div className="mt-2 text-slate-500"># 3. Open dashboard</div>
              <div>npm run dashboard</div>
            </div>
            <p>
              Each artifact (JSON, Markdown, HTML, PDF) is derived from the same structured data. The JSON output is the
              ground truth — HTML and PDF are rendered from it, ensuring consistency across formats.
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
                { title: 'Disclaimer everywhere', desc: 'The "not legal advice" disclaimer appears on every page, every PDF, every CLI output, and every report artifact. It cannot be turned off.' },
                { title: 'Required document quotes', desc: 'Every risk finding must include a direct quote from the document. The eval harness checks that mock mode does not use generic "See document" placeholders when a real quote exists.' },
                { title: '"Not found in the document."', desc: 'When a field cannot be extracted, the system outputs this exact sentinel — not an empty string, not a hallucinated value. The eval harness checks this contract.' },
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
                  'Built a local-first AI document review system end-to-end in TypeScript: CLI pipeline, schema validation (Zod), HTML/PDF rendering (Playwright), and Next.js dashboard',
                  'Designed AI output validation layer with safe JSON parsing, Zod schema enforcement, error logging, and graceful mock fallback — preventing silent failures in structured AI outputs',
                  'Implemented multi-format document ingestion (.txt, .md, .pdf, .docx) with an abstracted AI provider layer supporting both live (OpenAI-compatible) and mock modes',
                  'Built eval harness with deterministic correctness checks: document type detection, sentinel field validation, quote specificity, and full pipeline smoke testing',
                  'Created agent-native documentation (CLAUDE.md, CODEX.md) enabling AI agents to operate, understand, and extend the system without human instruction',
                  'Shipped static demo layer with committed fixture data so the deployed site demonstrates full functionality without local setup or API keys',
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
              Synth is a solo-built prototype demonstrating what a serious, repo-first AI document operations system looks like —
              one that can be cloned, run locally, operated by another AI agent, and extended without touching a UI.
              It is not production legal software.
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
