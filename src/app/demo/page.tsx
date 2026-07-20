import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import SiteFooter from '@/app/components/SiteFooter';
import demoReview from '@/data/demo/demo-review.json';
import demoDataRoom from '@/data/demo/demo-dataroom.json';
import demoIssueLog from '@/data/demo/demo-issue-log.json';
import type { Review } from '@/schemas/review.schema';
import type { DataRoomSummary } from '@/schemas/spreadsheet.schema';
import type { IssueLog } from '@/schemas/issue.schema';

const review = demoReview as Review;
const dataRoom = demoDataRoom as DataRoomSummary;
const issueLog = demoIssueLog as IssueLog;

const artifactLinks = [
  ['Full packet', '/demo-artifacts/demo-full-packet.html', 'HTML'],
  ['PDF review', '/demo-artifacts/demo-review.pdf', 'PDF'],
  ['Issue log', '/demo-artifacts/demo-issue-log.json', 'JSON'],
  ['Evidence ledger', '/demo-artifacts/demo-evidence.json', 'JSON'],
  ['Issues export', '/demo-artifacts/issues.csv', 'CSV'],
  ['Evidence export', '/demo-artifacts/evidence.csv', 'CSV'],
  ['Data room workbook', '/demo-artifacts/dataroom-summary.xlsx', 'XLSX'],
  ['Compare report', '/demo-artifacts/demo-compare.json', 'JSON'],
];

function badgeClass(level: string): string {
  switch (level) {
    case 'Critical':
      return 'border-red-200 bg-red-50 text-red-300';
    case 'High':
      return 'border-orange-200 bg-orange-50 text-orange-300';
    case 'Medium':
      return 'border-amber-200 bg-amber-50 text-yellow-300';
    case 'Low':
      return 'border-green-200 bg-green-50 text-green-700';
    default:
      return 'border-gray-300 bg-gray-100 text-gray-700';
  }
}

export default function DemoPage() {
  const verifiedEvidence = issueLog.evidence.filter((item) => item.isVerified);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteNav current="Demo" />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700">
            Static mock fixture · no API key required
          </div>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-gray-900 sm:text-5xl">
            Evidence-backed diligence for a mixed legal and financial packet.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">
            This demo shows the portfolio path: a SaaS agreement, payment schedule, vendor invoices, and cap table become
            a structured data room summary, issue log, evidence ledger, CSV/XLSX exports, and comparison report.
          </p>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Files in packet', dataRoom.fileCount],
            ['Issues logged', issueLog.totalIssues],
            ['Evidence items', issueLog.evidence.length],
            ['Risk score', `${review.riskScore}/100`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="mt-1 text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">Input Packet</h2>
              <div className="space-y-3">
                {dataRoom.documents.map((document) => (
                  <div key={document.filename} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="font-mono text-xs text-gray-700">{document.filename}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {document.category} ·{' '}
                      {document.characterCount !== undefined
                        ? `${document.characterCount.toLocaleString()} chars`
                        : document.rowCount !== undefined
                          ? `${document.rowCount.toLocaleString()} rows`
                          : 'n/a'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">Data Room Findings</h2>
              <div className="space-y-3 text-xs text-gray-600">
                {dataRoom.crossDocumentFindings.map((finding) => (
                  <div key={finding.title} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <span className="font-medium text-gray-900">{finding.title}</span>
                      <span className={`rounded border px-2 py-0.5 ${badgeClass(finding.severity)}`}>{finding.severity}</span>
                    </div>
                    <p>{finding.description}</p>
                    <p className="mt-2 text-gray-500">
                      {finding.sourceA} + {finding.sourceB}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">Exports</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {artifactLinks.map(([label, href, format]) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs transition-colors hover:border-gray-400"
                  >
                    <span className="text-gray-700">{label}</span>
                    <span className="font-mono text-gray-800">{format}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-lg border border-gray-300 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Issue Log</h2>
                <div className="flex gap-2 text-xs">
                  <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-red-300">
                    {issueLog.criticalCount} critical
                  </span>
                  <span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-orange-300">
                    {issueLog.highCount} high
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {issueLog.issues.slice(0, 6).map((issue) => (
                  <div key={issue.id} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{issue.title}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {issue.category} · {issue.sourceFiles.join(', ')}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded border px-2 py-0.5 text-xs ${badgeClass(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    {issue.evidenceQuotes[0] && (
                      <blockquote className="border-l-2 border-gray-300 pl-3 text-xs italic leading-5 text-gray-600">
                        {issue.evidenceQuotes[0]}
                      </blockquote>
                    )}
                    <p className="mt-2 text-xs leading-5 text-gray-600">{issue.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">Evidence Ledger</h2>
              <div className="space-y-3">
                {verifiedEvidence.slice(0, 5).map((evidence) => (
                  <div key={evidence.evidenceId} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{evidence.evidenceId}</code>
                      <span className="text-xs text-green-700">verified</span>
                      <span className="text-xs text-gray-500">{evidence.sourceFilename}</span>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">
                      {evidence.documentQuote ?? evidence.spreadsheetRow ?? evidence.verificationNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Limitations Visible in the Demo</h2>
              <ul className="space-y-2 text-xs leading-5 text-gray-600">
                <li>Mock mode is illustrative and uses fixture data; live AI mode requires an OpenAI-compatible API key.</li>
                <li>Findings are review aids, not legal or financial conclusions.</li>
                <li>PDF generation depends on Playwright Chromium being installed locally.</li>
                <li>Spreadsheet parsing targets standard CSV/XLSX tables, not complex workbook layouts.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
