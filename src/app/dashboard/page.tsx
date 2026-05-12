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
    case 'High':     return 'text-orange-400 bg-orange-950 border-orange-800';
    case 'Medium':   return 'text-yellow-400 bg-yellow-950 border-yellow-800';
    case 'Low':      return 'text-green-400 bg-green-950 border-green-800';
    default:         return 'text-slate-400 bg-slate-800 border-slate-700';
  }
}

function isMockModeData(review: Review): boolean {
  return review.providerMode === 'mock' ||
    review.citations.some((c) => c.section === 'Mock Mode Notice');
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
  const fullPacketPDFs = pdfs.filter((f) => f.includes('-full-packet'));
  const otherPDFs = pdfs.filter((f) => !f.includes('-full-packet'));

  const mockMode = latestReview ? isMockModeData(latestReview) : null;
  const hasReports = reviews.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 sticky top-0 bg-slate-950/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-400 font-mono font-bold text-lg">&#9123; Synth</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Demo</Link>
            <Link href="/artifacts" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Artifacts</Link>
            <Link href="/case-study" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">Case Study</Link>
            {mockMode !== null && (
              <span className={`text-xs px-2 py-1 rounded border font-mono ${mockMode ? 'text-yellow-400 bg-yellow-950 border-yellow-800' : 'text-green-400 bg-green-950 border-green-800'}`}>
                {mockMode ? 'mock mode' : 'ai mode'}
              </span>
            )}
            <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </nav>

      {/* Disclaimer */}
      <div className="bg-yellow-950/40 border-b border-yellow-800/30 px-6 py-2">
        <div className="max-w-7xl mx-auto text-yellow-200/70 text-xs text-center">
          &#9888; Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!hasReports ? (
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

            {/* Mock mode notice */}
            {mockMode && (
              <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-xl p-4 mb-6 flex items-start gap-3">
                <span className="text-yellow-400 text-sm mt-0.5">&#9888;</span>
                <div>
                  <div className="text-yellow-300 text-sm font-medium mb-1">Mock Mode Active</div>
                  <p className="text-yellow-200/60 text-xs leading-relaxed">
                    These results were generated without an AI provider. Key terms are extracted directly from the document text where possible.
                    Set <code className="bg-slate-800 text-blue-400 px-1 rounded">OPENAI_API_KEY</code> in <code className="bg-slate-800 text-blue-400 px-1 rounded">.env.local</code> for full AI analysis.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Document list */}
              <div className="lg:col-span-1 space-y-4">
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
                      <div className="text-xs text-slate-500 mb-2 flex items-center gap-2 flex-wrap">
                        <span>{r.documentType}</span>
                        {r.sourceExtension && (
                          <code className="text-blue-500 font-mono bg-slate-800 px-1 rounded">{r.sourceExtension}</code>
                        )}
                        {isMockModeData(r) ? (
                          <span className="text-yellow-600 font-mono">mock</span>
                        ) : (
                          <span className="text-green-600 font-mono">ai</span>
                        )}
                        {r.fallbackUsed && (
                          <span className="text-orange-500 text-xs">↩ fallback</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Risk: <span className="font-medium text-white">{r.riskScore}/100</span>
                        <span className="mx-2 text-slate-700">·</span>
                        {r.topRisks.length} risk{r.topRisks.length !== 1 ? 's' : ''}
                        {r.parsedCharacterCount && (
                          <>
                            <span className="mx-2 text-slate-700">·</span>
                            {(r.parsedCharacterCount / 1000).toFixed(1)}k chars
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* What recruiters should notice card */}
                <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-4 mt-4">
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">What recruiters should notice</div>
                  <ul className="space-y-2">
                    {[
                      { icon: '⌨️', text: 'CLI-driven, local-first workflow' },
                      { icon: '✅', text: 'Zod schema validation on every output' },
                      { icon: '📄', text: 'PDF pipeline via Playwright' },
                      { icon: '🔒', text: 'No data leaves your machine by default' },
                      { icon: '🔁', text: 'AI fallback to mock if parsing fails' },
                      { icon: '🤖', text: 'Agent-native: full CLAUDE.md docs included' },
                    ].map(({ icon, text }) => (
                      <li key={text} className="flex items-start gap-2 text-xs text-slate-400">
                        <span>{icon}</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <Link href="/case-study" className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                      Full case study →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: Latest review detail */}
              <div className="lg:col-span-2 space-y-6">
                {latestReview && (
                  <>
                    {/* Source metadata */}
                    {(latestReview.sourceFilename || latestReview.parsedCharacterCount) && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4">
                        {latestReview.sourceFilename && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">Source</span>
                            <code className="text-blue-300 text-xs bg-slate-800 px-2 py-0.5 rounded">{latestReview.sourceFilename}</code>
                          </div>
                        )}
                        {latestReview.parsedCharacterCount && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">Parsed</span>
                            <span className="text-slate-300 text-xs">{latestReview.parsedCharacterCount.toLocaleString()} chars</span>
                          </div>
                        )}
                        {latestReview.fallbackUsed && (
                          <span className="text-orange-400 text-xs bg-orange-950 border border-orange-800 px-2 py-0.5 rounded">
                            ↩ fallback used
                          </span>
                        )}
                      </div>
                    )}

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
                                &ldquo;{risk.supportingQuote}&rdquo;
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
                      &#9888; {latestRevision.revisionDisclaimer}
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

                {/* Full Packet PDFs */}
                {fullPacketPDFs.length > 0 && (
                  <div className="bg-slate-900 border border-blue-900/50 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Full Review Packet</h2>
                    <div className="space-y-2">
                      {fullPacketPDFs.map((pdf) => (
                        <div key={pdf} className="flex items-center gap-3">
                          <span className="text-blue-500 text-base">&#128196;</span>
                          <div>
                            <div className="text-slate-200 font-mono text-xs">{pdf}</div>
                            <div className="text-slate-600 text-xs">reports/pdfs/{pdf}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-600 text-xs mt-4">
                      Combined review + financial + memo + revision in a single PDF.
                    </p>
                  </div>
                )}

                {/* Individual PDF exports */}
                {otherPDFs.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Individual PDFs</h2>
                    <div className="space-y-2">
                      {otherPDFs.map((pdf) => (
                        <div key={pdf} className="flex items-center gap-3 text-sm">
                          <span className="text-slate-600">&#128196;</span>
                          <span className="text-slate-400 font-mono text-xs">{pdf}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-600 text-xs mt-4">
                      Open from <code className="bg-slate-800 text-blue-400 px-1 rounded">reports/pdfs/</code>. Run{' '}
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
    <div className="py-12 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-6">&#128193;</div>
        <h2 className="text-xl font-bold text-white mb-3">No local reports yet</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
          Drop a contract into <code className="bg-slate-800 text-blue-400 px-1 rounded">documents/inbox/</code> and run the pipeline to see results here.
        </p>
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          See the interactive demo →
        </Link>
      </div>

      {/* What recruiters should notice — even in empty state */}
      <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-6 mb-6">
        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">What recruiters should notice</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '⌨️', title: 'CLI-driven pipeline', desc: 'Every output is produced by composable CLI commands, not a GUI. The pipeline is scriptable and automatable.' },
            { icon: '✅', title: 'Schema validation', desc: 'All AI outputs are validated with Zod schemas. Bad output fails loudly — not silently corrupting downstream reports.' },
            { icon: '📄', title: 'PDF pipeline', desc: 'Reports are rendered to HTML first, then to PDF via Playwright — not a simple text dump. Consistent layout guaranteed.' },
            { icon: '🔒', title: 'Local-first by default', desc: 'No data leaves your machine unless you explicitly set OPENAI_API_KEY. Mock mode works out of the box.' },
            { icon: '🔁', title: 'Graceful AI fallback', desc: 'If the AI provider fails or returns unparseable output, Synth saves the raw error and falls back to mock mode automatically.' },
            { icon: '🤖', title: 'Agent-native design', desc: 'Full CLAUDE.md and CODEX.md agent docs are included so AI agents can operate, extend, and improve the system.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <div className="text-white text-sm font-medium mb-1">{title}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick start</div>
          <div className="space-y-3">
            {[
              { cmd: 'npm run demo', desc: 'Run full pipeline on the 3 included sample contracts' },
              { cmd: 'npm run packet', desc: 'Run pipeline on your own contracts in documents/inbox/' },
              { cmd: 'npm run analyze', desc: 'Analyze only (no memo/revision/PDF)' },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-start gap-4">
                <code className="bg-slate-800 border border-slate-700 text-blue-400 px-2 py-1 rounded text-xs font-mono whitespace-nowrap">{cmd}</code>
                <span className="text-slate-400 text-xs pt-1">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Supported input formats</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { ext: '.txt', desc: 'Plain text' },
              { ext: '.md', desc: 'Markdown' },
              { ext: '.pdf', desc: 'PDF (text-based)' },
              { ext: '.docx', desc: 'Word document' },
            ].map(({ ext, desc }) => (
              <div key={ext} className="flex items-center gap-2">
                <code className="text-blue-400 font-mono text-xs">{ext}</code>
                <span className="text-slate-500 text-xs">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs">Drop files into <code className="bg-slate-800 text-blue-400 px-1 rounded">documents/inbox/</code></p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">No API key required</div>
        <p className="text-slate-400 text-xs leading-relaxed mb-2">
          Synth runs in mock mode by default — no API key needed. Mock mode extracts real text snippets from your document for key terms.
        </p>
        <p className="text-slate-600 text-xs">
          For full AI analysis, add <code className="bg-slate-800 text-blue-400 px-1 rounded">OPENAI_API_KEY</code> to <code className="bg-slate-800 text-blue-400 px-1 rounded">.env.local</code>
        </p>
      </div>
    </div>
  );
}
