import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import SiteFooter from '@/app/components/SiteFooter';

const artifacts = [
  {
    title: 'Full Review Packet',
    description:
      'Complete HTML packet combining contract review, financial extraction, executive memo, and suggested revision language for the sample SaaS agreement.',
    format: 'HTML',
    size: 'Multi-section',
    href: '/demo-artifacts/demo-full-packet.html',
    icon: 'PKT',
    mono: true,
    highlight: true,
    badge: 'Full Packet',
  },
  {
    title: 'PDF Review Report',
    description:
      'Sample rendered PDF report from the contract review pipeline. Local PDF generation requires Playwright Chromium.',
    format: 'PDF',
    size: 'Review report',
    href: '/demo-artifacts/demo-review.pdf',
    icon: 'PDF',
    mono: true,
    badge: 'PDF',
  },
  {
    title: 'Contract Review',
    description:
      'Risk matrix, executive summary, key terms, citations, and action items with direct evidence quotes.',
    format: 'HTML',
    size: '5 risks identified',
    href: '/demo-artifacts/demo-review.html',
    icon: 'REV',
    mono: true,
  },
  {
    title: 'Revision Packet',
    description:
      'Clause-by-clause suggested edits with original vs. suggested language side-by-side, negotiation notes, and lawyer questions.',
    format: 'HTML',
    size: '5 clause revisions',
    href: '/demo-artifacts/demo-revision.html',
    icon: 'RED',
    mono: true,
  },
  {
    title: 'Executive Memo',
    description:
      'Plain-language memo for non-legal stakeholders: biggest risks, financial obligations, key deadlines, questions for lawyer, and action items.',
    format: 'HTML',
    size: 'Single-page memo',
    href: '/demo-artifacts/demo-memo.html',
    icon: 'MEMO',
    mono: true,
  },
  {
    title: 'Issue Log',
    description:
      'Unified diligence issue log generated from review, spreadsheet, and data room findings. Each issue links to evidence IDs.',
    format: 'JSON',
    size: 'v5 · Issues',
    href: '/demo-artifacts/demo-issue-log.json',
    icon: 'ISS',
    mono: true,
    badge: 'v5',
  },
  {
    title: 'Evidence Ledger',
    description:
      'Machine-readable ledger of document quotes, spreadsheet rows, and verification notes backing the issue log.',
    format: 'JSON',
    size: 'v5 · Evidence',
    href: '/demo-artifacts/demo-evidence.json',
    icon: 'EV',
    mono: true,
    badge: 'v5',
  },
  {
    title: 'Issues CSV Export',
    description:
      'Flat CSV export of the issue log for spreadsheet review, filtering, or handoff to a diligence tracker.',
    format: 'CSV',
    size: 'v5 · Export',
    href: '/demo-artifacts/issues.csv',
    icon: 'CSV',
    mono: true,
    badge: 'v5',
  },
  {
    title: 'Evidence CSV Export',
    description:
      'Flat CSV export of the evidence ledger, including source filename, quote, row metadata, and verification status.',
    format: 'CSV',
    size: 'v5 · Export',
    href: '/demo-artifacts/evidence.csv',
    icon: 'CSV',
    mono: true,
    badge: 'v5',
  },
  {
    title: 'Data Room Workbook',
    description:
      'Multi-sheet XLSX export with Issues, Evidence, Payments, Cap Table, and Summary tabs.',
    format: 'XLSX',
    size: '5 sheets',
    href: '/demo-artifacts/dataroom-summary.xlsx',
    icon: 'XLS',
    mono: true,
    badge: 'v5',
  },
  {
    title: 'Run Compare Report',
    description:
      'Structured comparison report showing added, removed, and changed issues plus payment and cap table deltas.',
    format: 'JSON',
    size: 'v5 · Compare',
    href: '/demo-artifacts/demo-compare.json',
    icon: 'DIFF',
    mono: true,
    badge: 'v5',
  },
  {
    title: 'Data Room Summary',
    description:
      'Cross-document analysis combining contracts and spreadsheets — payment schedule, cap table rows, party mismatches, and data quality warnings.',
    format: 'JSON',
    size: 'v4 · Data Room',
    href: '/demo-artifacts/demo-dataroom.json',
    icon: 'ROOM',
    mono: true,
    badge: 'v4',
  },
  {
    title: 'Payment Schedule Analysis',
    description:
      'Spreadsheet profile for sample-payment-schedule.csv — extracted vendors, amounts, due dates, overdue rows, repeated vendor detection.',
    format: 'JSON',
    size: 'v4 · Spreadsheet',
    href: '/demo-artifacts/demo-sample-payment-schedule-spreadsheet.json',
    icon: 'PAY',
    mono: true,
    badge: 'v4',
  },
  {
    title: 'Cap Table Analysis',
    description:
      'Spreadsheet profile for sample-cap-table.csv — investor rows, share classes, ownership percentages, totals, equity structure.',
    format: 'JSON',
    size: 'v4 · Cap Table',
    href: '/demo-artifacts/demo-sample-cap-table-spreadsheet.json',
    icon: 'CAP',
    mono: true,
    badge: 'v4',
  },
  {
    title: 'Sample Review (Markdown)',
    description:
      'Markdown version of the contract review — demonstrates the raw structured output that drives downstream reports and dashboards.',
    format: 'Markdown',
    size: 'Raw output',
    href: '/demo-artifacts/demo-review.md',
    icon: 'MD',
    mono: true,
  },
  {
    title: 'Sample Review (JSON)',
    description:
      'Full structured JSON output from the review pipeline — schema-validated with Zod, includes all risk fields, citations, metadata.',
    format: 'JSON',
    size: 'Schema-validated',
    href: '/demo-artifacts/demo-review.json',
    icon: '{ }',
    mono: true,
  },
];

export default function ArtifactsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteNav current="Artifacts" />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
            v5 · Evidence-backed diligence artifacts
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Artifact Gallery</h1>
          <p className="text-gray-600 text-sm max-w-2xl leading-relaxed">
            Stable sample outputs from running Synth in mock mode: contract review, data room analysis, issue log,
            evidence ledger, CSV/XLSX exports, PDF report, and run comparison. Clone the repo to generate outputs from
            your own documents.
          </p>
        </div>

        {/* What is this section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">What these artifacts demonstrate</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
            <div>
              <div className="text-gray-700 font-medium mb-1">Structured outputs</div>
              Every report is schema-validated with Zod — not freeform text. The JSON output is the ground truth; HTML and PDF are rendered from it.
            </div>
            <div>
              <div className="text-gray-700 font-medium mb-1">Mixed-document data room (v4)</div>
              Synth analyzes contracts and spreadsheets together — extracting cap table rows, payment schedules, vendor invoices, and cross-document mismatches.
            </div>
            <div>
              <div className="text-gray-700 font-medium mb-1">Evidence-backed handoff</div>
              The issue log, evidence ledger, CSV exports, XLSX workbook, and compare report are generated from the same structured data.
            </div>
          </div>
        </div>

        {/* Artifact grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {artifacts.map((artifact) => (
            <a
              key={artifact.title}
              href={artifact.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block bg-white border rounded-xl p-5 hover:border-gray-400 transition-colors ${
                artifact.highlight ? 'border-gray-300 hover:border-gray-400' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`text-2xl ${artifact.mono ? 'font-mono text-gray-800 text-lg' : ''}`}>
                  {artifact.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                    {artifact.format}
                  </span>
                  {artifact.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded border ${artifact.badge === 'v4' ? 'text-gray-700 bg-gray-100 border-gray-300' : 'text-gray-800 bg-white border-gray-300'}`}>
                      {artifact.badge}
                    </span>
                  )}
                </div>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2 text-sm group-hover:text-gray-700 transition-colors">
                {artifact.title}
              </h3>
              <p className="text-gray-600 text-xs leading-relaxed mb-3">{artifact.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{artifact.size}</span>
                <span className="text-gray-500 text-xs group-hover:text-gray-800 transition-colors">Open →</span>
              </div>
            </a>
          ))}
        </div>

        {/* Local workflow CTA */}
        <div className="mt-10 bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Run the pipeline locally</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            These are static demo artifacts. To generate local outputs from your own contracts and spreadsheets,
            clone the repo and run the CLI pipeline in mock mode or with an OpenAI-compatible provider.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm text-gray-700 mb-6 overflow-x-auto whitespace-nowrap">
            <div className="text-gray-500 mb-2">$ # Clone and set up</div>
            <div>git clone https://github.com/dylancablayan/synth</div>
            <div>cd synth &amp;&amp; npm install</div>
            <div>npx playwright install chromium</div>
            <div className="mt-2 text-gray-500"># Contract review pipeline</div>
            <div>npm run demo</div>
            <div className="mt-2 text-gray-500"># v4: ingest all file types</div>
            <div>npm run ingest</div>
            <div className="mt-2 text-gray-500"># v4: analyze CSV/XLSX spreadsheets</div>
            <div>npm run spreadsheet</div>
            <div className="mt-2 text-gray-500"># v4: full data room analysis</div>
            <div>npm run dataroom</div>
            <div className="mt-2 text-gray-500"># v5: issue log, evidence, exports, and compare</div>
            <div>npm run triage &amp;&amp; npm run export &amp;&amp; npm run compare</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/demo" className="bg-gray-900 hover:bg-gray-700 text-white font-semibold text-xs px-4 py-2 rounded transition-colors">
              Interactive Demo
            </Link>
            <Link href="/case-study" className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs px-4 py-2 rounded transition-colors">
              Read Case Study
            </Link>
            <a href="https://github.com/dylancablayan/synth" className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs px-4 py-2 rounded transition-colors">
              GitHub
            </a>
          </div>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
