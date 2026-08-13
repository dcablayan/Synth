import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import SiteFooter from '@/app/components/SiteFooter';

const features = [
  {
    title: 'Evidence-Backed Issues',
    description: 'Converts risks and data room findings into structured issues linked to document quotes, rows, or verification notes.',
  },
  {
    title: 'Mixed-Packet Review',
    description: 'Reviews contracts alongside cap tables, payment schedules, and vendor invoices in one local workflow.',
  },
  {
    title: 'CSV/XLSX Handoff',
    description: 'Exports issues, evidence, payments, cap table rows, and a multi-sheet data room workbook.',
  },
  {
    title: 'Run Comparison',
    description: 'Diffs data room runs to show added, removed, and changed issues plus payment and cap table deltas.',
  },
  {
    title: 'Reports and PDFs',
    description: 'Writes JSON, Markdown, HTML, and PDF reports when Playwright Chromium is installed.',
  },
  {
    title: 'Mock by Default',
    description: 'Runs without an API key for demos and evals, with live AI mode available through an OpenAI-compatible provider.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" />
          Local-first · CLI-driven · Mock mode by default
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Evidence-backed AI diligence for<br />
          <span className="text-gray-800">mixed document packets.</span>
        </h1>

        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Synth is a local-first portfolio repo. Drop contracts, cap tables, payment schedules, or invoices into{' '}
          <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-sm">/documents/inbox</code>,
          run CLI commands, and receive structured reports, an issue log, an evidence ledger, exports, and compare reports.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <Link
            href="/demo"
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-7 py-3 rounded transition-colors text-sm"
          >
            View Demo →
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium px-7 py-3 rounded transition-colors text-sm"
          >
            Open Dashboard
          </Link>
          <Link
            href="/artifacts"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium px-7 py-3 rounded transition-colors text-sm"
          >
            Download Artifacts
          </Link>
        </div>

      </section>

      {/* Terminal preview */}
      <section className="max-w-3xl mx-auto px-6 mb-20">
        <div className="bg-gray-950 border border-gray-800 rounded overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-500 text-xs ml-2 font-mono">terminal</span>
          </div>
          <pre className="p-6 text-sm font-mono text-gray-200 overflow-x-auto leading-7">
{`$ git clone https://github.com/dcablayan/Synth
$ npm install && npx playwright install chromium
$ npm run doctor

  ✅ Node.js version ≥ 18
  ✅ All directories present
  ✅ Sample documents found
  ✅ Mock mode available

$ npm run demo

  📄 sample-saas-agreement.txt
     → Review...    ✅ Risk: High (61)
     → Financial... ✅
     → Memo...      ✅
     → Revision...  ✅
     → PDFs...      ⚠️ install Playwright Chromium

$ npm run dataroom && npm run triage && npm run export

  ✅ Data room report
  ✅ Issue log + evidence ledger
  ✅ issues.csv, evidence.csv, dataroom-summary.xlsx

$ npm run eval

  ✅ Document type detected: SaaS Agreement
  ✅ Risk quotes verified against source text
  ✅ Verified evidence appears in the document
  ✅ PDF text extraction works
  110/110 checks passed

$ npm run dashboard`}</pre>
        </div>
      </section>

      {/* Demo banner */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="bg-white/60 border border-gray-300 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-gray-800 font-medium mb-1">No setup required</div>
            <p className="text-gray-600 text-sm">
              The demo runs without local reports or an API key. Uses static fixture data so you can see the full output immediately.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/demo" className="bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm px-5 py-2 rounded transition-colors">
              Open Demo →
            </Link>
            <Link href="/artifacts" className="border border-gray-300 hover:border-gray-400 text-gray-700 text-sm px-5 py-2 rounded transition-colors">
              Artifacts
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Built for traceable document work.</h2>
        <p className="text-gray-600 text-center mb-12 text-sm">
          Not a chat-only demo. A repo-based workflow for traceable diligence outputs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-white border border-gray-200 rounded p-6 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-gray-500 font-serif text-sm tracking-[0.25em]">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 border-t border-gray-300" aria-hidden />
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quickstart */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quickstart</h2>
          <div className="space-y-3">
            {[
              ['Clone & install', 'git clone https://github.com/dcablayan/Synth && npm install'],
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
                <span className="text-gray-500 text-sm min-w-[140px] pt-0.5">{label}</span>
                <code className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-mono flex-1 break-all">
                  {cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
