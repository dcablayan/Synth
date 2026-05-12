import Link from 'next/link';

export default function CaseStudyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-blue-400 font-mono font-bold text-lg">⬡ Synth</Link>
          <div className="flex items-center gap-4">
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
            and why the repo-first design matters.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
            <span>Solo build · 2024</span>
            <span>·</span>
            <span>TypeScript · Next.js · Playwright</span>
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
              <li>No clear audit trail of what was analyzed and when</li>
              <li>Can't be operated by another AI agent or automated pipeline</li>
            </ul>
            <p>
              Founders, analysts, and early-career professionals often need to review contracts quickly —
              SaaS agreements, term sheets, contractor agreements — without always having immediate access to legal counsel.
              They need structured analysis, not chat.
            </p>
          </Section>

          {/* My Role */}
          <Section title="My Role">
            <p>
              I designed and built Synth end-to-end as a solo portfolio project. The goal was to demonstrate:
            </p>
            <ul>
              <li>Full-stack TypeScript architecture (Next.js + Node CLI)</li>
              <li>AI system design with mock mode, schema validation, and safety constraints</li>
              <li>Document processing pipelines with structured outputs</li>
              <li>PDF generation from HTML templates via Playwright</li>
              <li>Agent-native documentation design (CLAUDE.md, CODEX.md)</li>
              <li>Local-first, cloneable repo structure — not just a deployed app</li>
            </ul>
          </Section>

          {/* Why Repo-First */}
          <Section title="Why Repo-First / Agent-Native Design">
            <p>
              Inspired by repos like{' '}
              <a href="https://github.com/santifer/career-ops" className="text-blue-400 hover:text-blue-300">career-ops</a>,
              I wanted Synth to feel like an AI operations center — something you clone, configure, and run —
              rather than a SaaS product you sign up for.
            </p>
            <p>
              Repo-first design offers several advantages for a document review system:
            </p>
            <ul>
              <li>
                <strong className="text-white">Local-first privacy:</strong> Documents never leave your machine
                unless you explicitly configure an API provider.
              </li>
              <li>
                <strong className="text-white">Reproducibility:</strong> The same CLI commands always produce
                the same artifacts in the same folders.
              </li>
              <li>
                <strong className="text-white">Agent extensibility:</strong> Another AI agent (Claude Code,
                Codex) can read CLAUDE.md, understand the system, and improve it without human instruction.
              </li>
              <li>
                <strong className="text-white">Portfolio clarity:</strong> A cloneable repo demonstrates
                architecture decisions more clearly than a deployed UI.
              </li>
            </ul>
          </Section>

          {/* How the Workflow Works */}
          <Section title="How the Workflow Works">
            <p>The core workflow is a document processing pipeline:</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-slate-500">1. Drop document → /documents/inbox</div>
              <div className="text-slate-500">2. npm run analyze</div>
              <div className="pl-4 text-blue-400">→ Detect document type</div>
              <div className="pl-4 text-blue-400">→ Run contract review (mock or real AI)</div>
              <div className="pl-4 text-blue-400">→ Run financial extraction</div>
              <div className="pl-4 text-blue-400">→ Save JSON, Markdown, HTML</div>
              <div className="text-slate-500">3. npm run memo → Executive memo</div>
              <div className="text-slate-500">4. npm run revise → Revision packet</div>
              <div className="text-slate-500">5. npm run pdf → Playwright PDFs</div>
              <div className="text-slate-500">6. npm run dashboard → View all outputs</div>
            </div>
            <p>
              Every command is atomic and composable. <code className="bg-slate-800 text-blue-400 px-1 rounded">npm run packet</code> runs
              the full pipeline in sequence. Each artifact is saved in a predictable folder structure.
            </p>
          </Section>

          {/* Technical Architecture */}
          <Section title="Technical Architecture">
            <p>Synth is organized into four layers:</p>
            <div className="space-y-3">
              {[
                ['CLI Layer', '/src/cli/ — tsx scripts for each command. No framework, just Node.'],
                ['Library Layer', '/src/lib/ — document loading, parsing, AI provider, risk scoring, HTML/PDF rendering.'],
                ['Schema Layer', '/src/schemas/ — Zod schemas validate all AI output. If validation fails, the system falls back gracefully.'],
                ['UI Layer', '/src/app/ — Next.js App Router dashboard reading from /reports/ at request time.'],
              ].map(([layer, desc]) => (
                <div key={layer} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-white font-medium text-sm mb-1">{layer}</div>
                  <div className="text-slate-400 text-xs">{desc}</div>
                </div>
              ))}
            </div>
            <p>
              The AI provider is abstracted: <code className="bg-slate-800 text-blue-400 px-1 rounded">runContractReview()</code> calls either
              the mock provider or an OpenAI-compatible API, depending on whether an API key is present.
              Prompts live in <code className="bg-slate-800 text-blue-400 px-1 rounded">/src/prompts/</code> as separate modules,
              making them easy to iterate on without touching business logic.
            </p>
          </Section>

          {/* AI Safety Choices */}
          <Section title="AI Safety Choices">
            <p>
              Legal and financial documents carry high stakes. Synth's AI layer is designed with explicit guardrails:
            </p>
            <ul>
              <li>
                <strong className="text-white">No hallucination policy:</strong> Every risk finding must include a direct
                quote from the document. If something isn't in the document, the system outputs "Not found in the document."
              </li>
              <li>
                <strong className="text-white">Disclaimer everywhere:</strong> The disclaimer appears on every page,
                every PDF, every CLI output, and every report artifact.
              </li>
              <li>
                <strong className="text-white">Revision language framing:</strong> Suggested edits are always labeled as
                "suggested replacement language for review by a qualified professional" — never as valid legal text.
              </li>
              <li>
                <strong className="text-white">Zod validation:</strong> All AI output is validated against strict schemas.
                Invalid output triggers a fallback, not a silent failure.
              </li>
              <li>
                <strong className="text-white">Mock mode default:</strong> Without an API key, the system runs in mock
                mode — demonstrating the full workflow without any AI calls.
              </li>
            </ul>
          </Section>

          {/* PDF Artifact Pipeline */}
          <Section title="PDF Artifact Pipeline">
            <p>
              Professional PDFs are a core deliverable. The pipeline:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300 text-sm">
              <li>Structured data (JSON) is rendered into HTML via template functions in <code className="bg-slate-800 text-blue-400 px-1 rounded">html-renderer.ts</code></li>
              <li>HTML is saved to <code className="bg-slate-800 text-blue-400 px-1 rounded">/reports/html/</code></li>
              <li>Playwright launches a headless Chromium browser, loads the HTML, and prints to PDF</li>
              <li>PDFs are saved to <code className="bg-slate-800 text-blue-400 px-1 rounded">/reports/pdfs/</code></li>
              <li>If Playwright is not installed, HTML artifacts are preserved and the error is surfaced cleanly</li>
            </ol>
            <p>
              PDF design follows a professional legal-tech aesthetic: clean typography, risk badges, tables for
              financial terms, clause citations, page numbers, and a disclaimer footer on every page.
            </p>
          </Section>

          {/* Limitations */}
          <Section title="Limitations">
            <ul>
              <li>Mock mode produces illustrative output only — not document-specific analysis.</li>
              <li>Real AI analysis requires an OpenAI-compatible API key.</li>
              <li>PDF generation requires Playwright and a Chromium installation.</li>
              <li>No OCR — only supports plain text (.txt) documents. PDF parsing is not included in this prototype.</li>
              <li>Not a production system. Not audited for legal or compliance workflows.</li>
              <li>No authentication, multi-user support, or cloud storage in the CLI workflow.</li>
            </ul>
          </Section>

          {/* Future Improvements */}
          <Section title="Future Improvements">
            <ul>
              <li>PDF and DOCX ingestion with OCR via Tesseract or a document parsing API</li>
              <li>Anthropic Claude API integration as a second provider option</li>
              <li>Comparison mode: diff two versions of a contract</li>
              <li>Negotiation history tracking</li>
              <li>Export to Google Docs or Notion</li>
              <li>Multi-document packet analysis</li>
              <li>Fine-tuned prompts for specific document types (SAFE notes, employment offers, MSAs)</li>
            </ul>
          </Section>

          {/* Closing */}
          <div className="border-t border-slate-800 pt-8 mt-8">
            <p className="text-slate-400 text-sm leading-relaxed">
              Synth is a solo-built prototype built to demonstrate what a serious, repo-first AI document operations
              system looks like — one that can be cloned, run locally, operated by another AI agent, and extended
              without touching a UI. It is not production legal software.
            </p>
            <p className="text-slate-600 text-xs mt-4">
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
