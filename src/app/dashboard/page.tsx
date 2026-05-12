import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { Review } from '@/schemas/review.schema';
import type { Financial } from '@/schemas/financial.schema';
import type { Memo } from '@/schemas/memo.schema';
import type { Revision } from '@/schemas/revision.schema';

function getRiskColor(level: string): string {
  switch (level) {
    case 'Critical': return 'text-red-400 bg-red-950 border-red-800';
    case 'High': return 'text-orange-400 bg-orange-950 border-orange-800';
    case 'Medium': return 'text-yellow-400 bg-yellow-950 border-yellow-800';
    case 'Low': return 'text-green-400 bg-green-950 border-green-800';
    default: return 'text-slate-400 bg-slate-800 border-slate-700';
  }
}

function loadReports<T>(dir: string, suffix: string): T[] {
  const fullDir = path.join(process.cwd(), 'reports', dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir)
    .filter((f) => f.endsWith(suffix))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(fullDir, f), 'utf-8')) as T;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as T[];
}

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const reviews = loadReports<Review>('reviews', '-review.json');
  const financials = loadReports<Financial>('financials', '-financial.json');
  const memos = loadReports<Memo>('memos', '-memo.json');
  const revisions = loadReports<Revision>('revisions', '-revision.json');

  const latestReview = reviews.sort((a, b) =>
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )[0];
  const latestMemo = memos[0];
  const latestRevision = revisions[0];
  const latestFinancial = financials[0];

  const pdfDir = path.join(process.cwd(), 'reports', 'pdfs');
  const pdfs = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf')) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-slate-950/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-400 font-mono font-bold text-lg">⬡ Synth</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/case-study" className="text-slate-400 hover:text-slate-100 text-sm">Case Study</Link>
            <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </nav>

      {/* Disclaimer */}
      <div className="bg-yellow-950/40 border-b border-yellow-800/30 px-6 py-2">
        <div className="max-w-7xl mx-auto text-yellow-200/70 text-xs text-center">
          ⚠️ Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {reviews.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Header stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Documents Reviewed', value: reviews.length },
                { label: 'Memos Generated', value: memos.length },
                { label: 'Revision Packets', value: revisions.length },
                { label: 'PDFs Generated', value: pdfs.length },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Document list */}
              <div className="lg:col-span-1">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Documents</h2>
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-medium text-white leading-tight">{r.documentTitle}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${getRiskColor(r.riskLevel)}`}>
                          {r.riskLevel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{r.documentType}</div>
                      <div className="text-xs text-slate-400">
                        Risk: <span className="font-medium text-white">{r.riskScore}/100</span>
                        <span className="mx-2 text-slate-700">·</span>
                        {r.topRisks.length} risk{r.topRisks.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Latest review detail */}
              <div className="lg:col-span-2 space-y-6">
                {latestReview && (
                  <>
                    {/* Executive Summary */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Executive Summary</h2>
                      <h3 className="text-lg font-bold text-white mb-2">{latestReview.documentTitle}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getRiskColor(latestReview.riskLevel)}`}>
                          {latestReview.riskLevel} Risk — {latestReview.riskScore}/100
                        </span>
                        <span className="text-xs text-slate-500">{latestReview.documentType}</span>
                        <span className="text-xs text-slate-600">
                          {latestReview.parties.join(' · ')}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{latestReview.executiveSummary}</p>
                    </div>

                    {/* Risk Matrix */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Risk Matrix</h2>
                      <div className="space-y-4">
                        {latestReview.topRisks.map((risk, i) => (
                          <div key={i} className="border border-slate-800 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="text-sm font-medium text-white">{risk.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${getRiskColor(risk.severity)}`}>
                                {risk.severity}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs mb-2 leading-relaxed">{risk.explanation}</p>
                            {risk.supportingQuote && (
                              <blockquote className="border-l-2 border-blue-700 pl-3 text-blue-300 text-xs italic">
                                "{risk.supportingQuote}"
                              </blockquote>
                            )}
                            <p className="text-slate-500 text-xs mt-2">
                              Next: {risk.suggestedNextStep}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Terms */}
                    {latestFinancial && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Financial Terms</h2>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <tbody>
                              {[
                                ['Total Value', latestFinancial.totalContractValue],
                                ['Recurring Fees', latestFinancial.recurringFees],
                                ['One-Time Fees', latestFinancial.oneTimeFees],
                                ['Payment Schedule', latestFinancial.paymentSchedule],
                                ['Late Fees', latestFinancial.lateFees],
                                ['Renewal Changes', latestFinancial.renewalCostChanges],
                                ['Refund Terms', latestFinancial.refundTerms],
                              ].map(([label, value]) => (
                                <tr key={label} className="border-b border-slate-800 last:border-0">
                                  <td className="py-2 pr-4 text-slate-500 whitespace-nowrap text-xs">{label}</td>
                                  <td className="py-2 text-slate-300 text-xs">{value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Key Terms */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Terms</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          ['Payment Terms', latestReview.paymentTerms],
                          ['Renewal', latestReview.renewalTerms],
                          ['Termination', latestReview.terminationTerms],
                          ['Governing Law', latestReview.governingLaw],
                          ['Liability', latestReview.liabilityIssues],
                          ['Confidentiality', latestReview.confidentialityTerms],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                            <div className="text-xs text-slate-500 mb-1">{label}</div>
                            <div className="text-xs text-slate-300 leading-relaxed">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Action Items</h2>
                      <ol className="space-y-2">
                        {latestReview.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="text-blue-500 font-mono text-xs mt-0.5 min-w-[20px]">{i + 1}.</span>
                            <span className="text-slate-300">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </>
                )}

                {/* Memo Preview */}
                {latestMemo && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Executive Memo</h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">{latestMemo.executiveSummary}</p>
                    <div>
                      <div className="text-xs text-slate-500 mb-2">Questions for Lawyer</div>
                      <ul className="space-y-1">
                        {latestMemo.questionsForLawyer.slice(0, 4).map((q, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-slate-600 mt-0.5">›</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Revision Preview */}
                {latestRevision && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Revision Packet</h2>
                      <span className="text-xs text-slate-600">{latestRevision.clauseRevisions.length} clause(s)</span>
                    </div>
                    <p className="text-xs text-yellow-400/70 mb-4 bg-yellow-950/30 border border-yellow-800/30 rounded p-2">
                      ⚠️ {latestRevision.revisionDisclaimer}
                    </p>
                    <div className="space-y-3">
                      {latestRevision.clauseRevisions.slice(0, 2).map((c, i) => (
                        <div key={i} className="border border-slate-800 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-medium text-white">{c.section}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${getRiskColor(c.severity)}`}>{c.severity}</span>
                          </div>
                          <p className="text-xs text-slate-400">{c.issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF exports */}
                {pdfs.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">PDF Reports</h2>
                    <div className="space-y-2">
                      {pdfs.map((pdf) => (
                        <div key={pdf} className="flex items-center gap-3 text-sm">
                          <span className="text-slate-600">📄</span>
                          <span className="text-slate-400 font-mono text-xs">{pdf}</span>
                          <span className="text-slate-600 text-xs">reports/pdfs/{pdf}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-600 text-xs mt-4">
                      Open these files from your filesystem. Run{' '}
                      <code className="bg-slate-800 text-blue-400 px-1 rounded">npm run pdf</code> to regenerate.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-6">📂</div>
      <h2 className="text-xl font-bold text-white mb-3">No reports found</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
        Drop documents into <code className="bg-slate-800 text-blue-400 px-1 rounded">/documents/inbox</code> and run
        the analyzer to see results here.
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md mx-auto text-left">
        <div className="text-sm font-mono space-y-2 text-slate-300">
          <div><span className="text-slate-600">$ </span>npm run demo</div>
          <div><span className="text-slate-600">$ </span>npm run analyze</div>
          <div><span className="text-slate-600">$ </span>npm run packet</div>
        </div>
      </div>
    </div>
  );
}
