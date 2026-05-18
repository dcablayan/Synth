import Link from 'next/link';

const features = [
  {
    icon: '⚖️',
    title: 'Evidence-Backed Issues',
    description: 'Converts risks and data room findings into structured issues linked to document quotes, rows, or verification notes.',
  },
  {
    icon: '🗂️',
    title: 'Mixed-Packet Review',
    description: 'Reviews contracts alongside cap tables, payment schedules, and vendor invoices in one local workflow.',
  },
  {
    icon: '📊',
    title: 'CSV/XLSX Handoff',
    description: 'Exports issues, evidence, payments, cap table rows, and a multi-sheet data room workbook.',
  },
  {
    icon: '🔁',
    title: 'Run Comparison',
    description: 'Diffs data room runs to show added, removed, and changed issues plus payment and cap table deltas.',
  },
  {
    icon: '📄',
    title: 'Reports and PDFs',
    description: 'Writes JSON, Markdown, HTML, and PDF reports when Playwright Chromium is installed.',
  },
  {
    icon: '🤖',
    title: 'Mock by Default',
    description: 'Runs without an API key for demos and evals, with live AI mode available through an OpenAI-compatible provider.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-mono text-lg font-bold">&#9123; Synth</span>
            <span className="text-slate-500 text-sm hidden sm:block">Evidence-backed diligence</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
              Demo
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
              Dashboard
            </Link>
            <Link href="/artifacts" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
              Artifacts
            </Link>
            <Link href="/case-study" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
              Case Study
            </Link>
            <a
              href="https://github.com/dylancablayan/synth"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-md transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 text-blue-300 text-xs px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          Local-first · CLI-driven · Mock mode by default
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
          Evidence-backed AI diligence for<br />
          <span className="text-blue-400">mixed document packets.</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Synth is a local-first portfolio repo. Drop contracts, cap tables, payment schedules, or invoices into{' '}
          <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-sm">/documents/inbox</code>,
          run CLI commands, and receive structured reports, an issue log, an evidence ledger, exports, and compare reports.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <Link
            href="/demo"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-7 py-3 rounded-lg transition-colors text-sm"
          >
            View Demo →
          </Link>
          <Link
            href="/dashboard"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-7 py-3 rounded-lg transition-colors text-sm"
          >
            Open Dashboard
          </Link>
          <Link
            href="/artifacts"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-7 py-3 rounded-lg transition-colors text-sm"
          >
            Download Artifacts
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <Link href="/case-study" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Case Study
          </Link>
          <span className="text-slate-700">·</span>
          <a href="https://github.com/dylancablayan/synth" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            GitHub
          </a>
        </div>

        <p className="text-xs text-slate-600 max-w-xl mx-auto">
          ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified
          professional before making decisions.
        </p>
      </section>

      {/* Terminal preview */}
      <section className="max-w-3xl mx-auto px-6 mb-20">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-500 text-xs ml-2 font-mono">terminal</span>
          </div>
          <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto leading-7">
{`$ git clone https://github.com/dylancablayan/synth
$ npm install && npx playwright install chromium
$ npm run doctor

  ✅ Node.js version ≥ 18
  ✅ All directories present
  ✅ Sample documents found
  ✅ Mock mode available

$ npm run demo

  📄 sample-saas-agreement.txt
     → Review...    ✅ Risk: High (65)
     → Financial... ✅
     → Memo...      ✅
     → Revision...  ✅
     → PDFs...      ⚠️ install Playwright Chromium

$ npm run dataroom && npm run triage && npm run export

  ✅ Data room report
  ✅ Issue log + evidence ledger
  ✅ issues.csv, evidence.csv, dataroom-summary.xlsx

$ npm run eval

  ✅ File parses
  ✅ Document type detected: SaaS Agreement
  ✅ Risk quotes are specific
  ✅ NOT_FOUND sentinels are honest
  12/12 checks passed

$ npm run dashboard`}</pre>
        </div>
      </section>

      {/* Demo banner */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-blue-400 font-medium mb-1">No setup required</div>
            <p className="text-slate-400 text-sm">
              The demo runs without local reports or an API key. Uses static fixture data so you can see the full output immediately.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/demo" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2 rounded-lg transition-colors">
              Open Demo →
            </Link>
            <Link href="/artifacts" className="border border-blue-800 hover:border-blue-600 text-blue-300 text-sm px-5 py-2 rounded-lg transition-colors">
              Artifacts
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-3">Built for traceable document work.</h2>
        <p className="text-slate-400 text-center mb-12 text-sm">
          Not a chat-only demo. A repo-based workflow for traceable diligence outputs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quickstart */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Quickstart</h2>
          <div className="space-y-3">
            {[
              ['Clone & install', 'git clone https://github.com/dylancablayan/synth && npm install'],
              ['Install PDF engine', 'npx playwright install chromium'],
              ['Check setup', 'npm run doctor'],
              ['Run demo', 'npm run demo'],
              ['Analyze data room', 'npm run dataroom'],
              ['Build issue log', 'npm run triage'],
              ['Export handoff', 'npm run export'],
              ['Compare runs', 'npm run compare'],
              ['Run eval', 'npm run eval'],
              ['Open dashboard', 'npm run dashboard'],
            ].map(([label, cmd]) => (
              <div key={label} className="flex items-start gap-4">
                <span className="text-slate-500 text-sm min-w-[140px] pt-0.5">{label}</span>
                <code className="bg-slate-800 text-blue-300 px-3 py-1 rounded text-sm font-mono flex-1 break-all">
                  {cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-blue-400 font-mono font-bold text-lg mb-2">&#9123; Synth</div>
          <p className="text-slate-500 text-sm mb-4">
            Evidence-backed AI diligence for mixed legal and financial document packets.
          </p>
          <div className="flex items-center justify-center gap-6 mb-4 text-sm text-slate-500">
            <Link href="/demo" className="hover:text-slate-300 transition-colors">Demo</Link>
            <Link href="/artifacts" className="hover:text-slate-300 transition-colors">Artifacts</Link>
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
            <Link href="/case-study" className="hover:text-slate-300 transition-colors">Case Study</Link>
            <a href="https://github.com/dylancablayan/synth" className="hover:text-slate-300 transition-colors">GitHub</a>
          </div>
          <p className="text-slate-600 text-xs max-w-lg mx-auto mb-4">
            Synth is a solo-built portfolio prototype demonstrating a repo-first, CLI-driven, agent-native approach to
            AI document operations. It is not a production legal system.
          </p>
          <p className="text-slate-700 text-xs">
            ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified
            professional before making decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
