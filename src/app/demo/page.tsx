import Link from 'next/link';
import demoReview from '@/data/demo/demo-review.json';
import demoFinancial from '@/data/demo/demo-financial.json';
import demoMemo from '@/data/demo/demo-memo.json';
import demoRevision from '@/data/demo/demo-revision.json';
import type { Review } from '@/schemas/review.schema';
import type { Financial } from '@/schemas/financial.schema';
import type { Memo } from '@/schemas/memo.schema';
import type { Revision } from '@/schemas/revision.schema';

const review = demoReview as Review;
const financial = demoFinancial as Financial;
const memo = demoMemo as Memo;
const revision = demoRevision as Revision;

function getRiskColor(level: string) {
  switch (level) {
    case 'Critical': return 'text-red-400 bg-red-950 border-red-800';
    case 'High':     return 'text-orange-400 bg-orange-950 border-orange-800';
    case 'Medium':   return 'text-yellow-400 bg-yellow-950 border-yellow-800';
    case 'Low':      return 'text-green-400 bg-green-950 border-green-800';
    default:         return 'text-slate-400 bg-slate-800 border-slate-700';
  }
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-slate-950/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-400 font-mono font-bold text-lg">&#9123; Synth</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm">Demo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Dashboard</Link>
            <Link href="/artifacts" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Artifacts</Link>
            <Link href="/case-study" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Case Study</Link>
            <a href="https://github.com/dylancablayan/synth" className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      {/* Disclaimer */}
      <div className="bg-yellow-950/40 border-b border-yellow-800/30 px-6 py-2">
        <div className="max-w-7xl mx-auto text-yellow-200/70 text-xs text-center">
          &#9888; Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.
        </div>
      </div>

      {/* Demo banner */}
      <div className="bg-blue-950/40 border-b border-blue-800/30 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-sm font-medium">Demo Mode</span>
            <span className="text-slate-500 text-xs">Static fixture data — no API key or local reports needed</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/artifacts" className="text-blue-400 hover:text-blue-300 text-xs border border-blue-800 px-3 py-1 rounded transition-colors">
              Download Artifacts
            </Link>
            <Link href="/case-study" className="text-slate-400 hover:text-slate-100 text-xs border border-slate-700 px-3 py-1 rounded transition-colors">
              Read Case Study
            </Link>
            <a href="https://github.com/dylancablayan/synth" className="text-slate-400 hover:text-slate-100 text-xs border border-slate-700 px-3 py-1 rounded transition-colors">
              View Local Workflow
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Risk Score', value: `${review.riskScore}/100` },
            { label: 'Risks Identified', value: review.topRisks.length },
            { label: 'Clause Revisions', value: revision.clauseRevisions.length },
            { label: 'Action Items', value: review.actionItems.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Source metadata */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Source</span>
            <code className="text-blue-300 text-xs bg-slate-800 px-2 py-0.5 rounded">{review.sourceFilename}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Type</span>
            <span className="text-slate-300 text-xs">{review.documentType}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Characters parsed</span>
            <span className="text-slate-300 text-xs">{(review.parsedCharacterCount ?? 0).toLocaleString()}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded border text-yellow-400 bg-yellow-950 border-yellow-800">mock mode</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: summary sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Document card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-1">{review.documentTitle}</h3>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskColor(review.riskLevel)}`}>
                  {review.riskLevel} Risk — {review.riskScore}/100
                </span>
              </div>
              <div className="text-xs text-slate-500">{review.parties.join(' · ')}</div>
            </div>

            {/* Key dates */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Dates</h3>
              <div className="space-y-2">
                {review.keyDates.map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-400">{d.label}</span>
                    <span className="text-xs text-white font-mono">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing clauses */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Missing Clauses</h3>
              <ul className="space-y-1.5">
                {review.missingClauses.map((c, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">&#10005;</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action items */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Action Items</h3>
              <ol className="space-y-2">
                {review.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-blue-500 font-mono min-w-[16px]">{i + 1}.</span>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Executive Summary</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{review.executiveSummary}</p>
            </div>

            {/* Risk Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Risk Matrix</h2>
              <div className="space-y-4">
                {review.topRisks.map((risk, i) => (
                  <div key={i} className="border border-slate-800 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-medium text-white">{risk.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${getRiskColor(risk.severity)}`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-2 leading-relaxed">{risk.explanation}</p>
                    {risk.supportingQuote && (
                      <blockquote className="border-l-2 border-blue-700 pl-3 text-blue-300 text-xs italic mb-2">
                        &ldquo;{risk.supportingQuote}&rdquo;
                      </blockquote>
                    )}
                    <p className="text-slate-500 text-xs">
                      <span className="text-slate-600">Next:</span> {risk.suggestedNextStep}
                    </p>
                    {risk.location && (
                      <p className="text-slate-600 text-xs mt-1">{risk.location}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Terms */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Financial Terms</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Total Value', financial.totalContractValue],
                      ['Recurring Fees', financial.recurringFees],
                      ['Payment Schedule', financial.paymentSchedule],
                      ['Late Fees', financial.lateFees],
                      ['Refund Terms', financial.refundTerms],
                      ['Renewal Cost Changes', financial.renewalCostChanges],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-slate-800 last:border-0">
                        <td className="py-2 pr-4 text-slate-500 whitespace-nowrap text-xs w-36">{label}</td>
                        <td className="py-2 text-slate-300 text-xs">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {financial.financialRedFlags.length > 0 && (
                <>
                  <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Financial Red Flags</h3>
                  <div className="space-y-3">
                    {financial.financialRedFlags.map((flag, i) => (
                      <div key={i} className="border border-red-900/40 bg-red-950/20 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-medium text-red-300">{flag.issue}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${getRiskColor(flag.severity)}`}>{flag.severity}</span>
                        </div>
                        <p className="text-xs text-slate-400">{flag.explanation}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Key Contract Terms */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Contract Terms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Payment Terms', review.paymentTerms],
                  ['Renewal', review.renewalTerms],
                  ['Termination', review.terminationTerms],
                  ['Governing Law', review.governingLaw],
                  ['Liability', review.liabilityIssues],
                  ['Confidentiality', review.confidentialityTerms],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="text-xs text-slate-300 leading-relaxed">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Citations */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Document Citations</h2>
              <div className="space-y-3">
                {review.citations.filter((c) => c.section !== 'Mock Mode Notice').map((citation, i) => (
                  <div key={i} className="border border-slate-800 rounded-lg p-3">
                    <div className="text-xs font-medium text-slate-300 mb-1">{citation.section}</div>
                    <blockquote className="border-l-2 border-slate-700 pl-3 text-slate-400 text-xs italic mb-1">
                      &ldquo;{citation.quote}&rdquo;
                    </blockquote>
                    <p className="text-xs text-slate-500">{citation.relevance}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Memo */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Executive Memo</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{memo.executiveSummary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-2 font-semibold">Biggest Risks</div>
                  <div className="space-y-2">
                    {memo.biggestRisks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded border whitespace-nowrap mt-0.5 ${getRiskColor(r.severity)}`}>{r.severity}</span>
                        <span className="text-xs text-slate-300">{r.risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-2 font-semibold">Questions for Lawyer</div>
                  <ul className="space-y-1">
                    {memo.questionsForLawyer.slice(0, 4).map((q, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-slate-600 mt-0.5">›</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Revision Packet Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Revision Packet</h2>
                <span className="text-xs text-slate-600">{revision.clauseRevisions.length} clause(s)</span>
              </div>
              <p className="text-xs text-yellow-400/70 mb-4 bg-yellow-950/30 border border-yellow-800/30 rounded p-2">
                &#9888; {revision.revisionDisclaimer}
              </p>
              <div className="space-y-3">
                {revision.clauseRevisions.map((c, i) => (
                  <div key={i} className="border border-slate-800 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-white">{c.section}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getRiskColor(c.severity)}`}>{c.severity}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{c.issue}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-red-950/20 border border-red-900/30 rounded p-2">
                        <div className="text-red-400 text-xs mb-1">Original</div>
                        <p className="text-slate-400 italic">&ldquo;{c.originalLanguage.slice(0, 120)}{c.originalLanguage.length > 120 ? '…' : ''}&rdquo;</p>
                      </div>
                      <div className="bg-green-950/20 border border-green-900/30 rounded p-2">
                        <div className="text-green-400 text-xs mb-1">Suggested (for review)</div>
                        <p className="text-slate-400">{c.suggestedReplacementLanguage.slice(0, 120)}{c.suggestedReplacementLanguage.length > 120 ? '…' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA row */}
            <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-blue-400 mb-3">See the full local workflow</h2>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                This demo uses static fixture data. Clone the repo to run the pipeline on real documents:
                review, financial analysis, memos, revision packets, and polished PDFs — all from the CLI.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/artifacts" className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded transition-colors">
                  Download Sample Artifacts
                </Link>
                <Link href="/case-study" className="border border-slate-700 hover:border-slate-500 text-slate-300 text-xs px-4 py-2 rounded transition-colors">
                  Read Case Study
                </Link>
                <a href="https://github.com/dylancablayan/synth" className="border border-slate-700 hover:border-slate-500 text-slate-300 text-xs px-4 py-2 rounded transition-colors">
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
