import Link from 'next/link';

const features = [
  {
    icon: '⚖️',
    title: 'Contract Risk Review',
    description: 'Full clause-by-clause risk analysis with severity scoring, explanations, and direct document quotes.',
  },
  {
    icon: '🔍',
    title: 'Clause Extraction',
    description: 'Extracts payment, renewal, termination, liability, confidentiality, and governing law provisions.',
  },
  {
    icon: '📊',
    title: 'Financial Term Analysis',
    description: 'Surfaces fees, penalties, equity terms, revenue share, refund conditions, and renewal cost changes.',
  },
  {
    icon: '✏️',
    title: 'Revision Packets',
    description: 'Clause-by-clause suggested edits with original language, issue, and safer replacement language.',
  },
  {
    icon: '📄',
    title: 'PDF Reports',
    description: 'Professional PDFs for review, financial analysis, memos, and full revision packets via Playwright.',
  },
  {
    icon: '🤖',
    title: 'Agent-Native Workflow',
    description: 'Full CLAUDE.md and CODEX.md docs so AI agents can operate, improve, and extend the system.',
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
            <span className="text-slate-500 text-sm hidden sm:block">AI Contract Review</span>
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
          Local-first · CLI-driven · Agent-native · v3
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
          AI contract review for<br />
          <span className="text-blue-400">legal and financial documents.</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Synth is a local-first AI operations repo. Drop contracts into{' '}
          <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-sm">/documents/inbox</code>,
          run CLI commands, and receive structured reviews, financial analysis, revision packets, and polished PDFs.
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
     → Review...    ✅ Risk: High (72)
     → Financial... ✅
     → Memo...      ✅
     → Revision...  ✅
     → PDFs...      ✅

$ npm run eval

  ✅ File parses (8,742 chars)
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
        <h2 className="text-2xl font-bold text-white text-center mb-3">Built for serious document work.</h2>
        <p className="text-slate-400 text-center mb-12 text-sm">
          Not a chat interface. A repo-based AI operations system for contract review.
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
              ['Seed demo data', 'npm run seed-demo'],
              ['Run eval', 'npm run eval'],
              ['Full packet', 'npm run packet'],
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
            AI contract review for legal and financial documents.
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
