import Link from 'next/link';

// The one place the disclaimer lives on every page (SAFETY.md: exactly one
// clear instance per rendered output).
export const DISCLAIMER =
  'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 px-6 py-10 mt-16">
      <div className="max-w-6xl mx-auto text-center">
        <div className="text-gray-900 font-serif font-bold text-xl tracking-wide mb-1"><span aria-hidden>§</span> Synth</div>
        <p className="text-gray-500 text-sm mb-5">Evidence-backed AI diligence for mixed legal and financial document packets.</p>
        <div className="flex items-center justify-center gap-x-6 gap-y-2 flex-wrap mb-5 text-sm text-gray-500">
          <Link href="/demo" className="hover:text-gray-700 transition-colors">Demo</Link>
          <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
          <Link href="/artifacts" className="hover:text-gray-700 transition-colors">Artifacts</Link>
          <Link href="/case-study" className="hover:text-gray-700 transition-colors">Case Study</Link>
          <a href="https://github.com/dylancablayan/synth" className="hover:text-gray-700 transition-colors">GitHub</a>
        </div>
        <p className="text-gray-500 text-xs max-w-lg mx-auto mb-3">
          A solo-built portfolio prototype demonstrating a repo-first, CLI-driven approach to AI document operations —
          not a production legal system.
        </p>
        <p className="text-gray-500 text-xs max-w-xl mx-auto">⚠️ {DISCLAIMER}</p>
      </div>
    </footer>
  );
}
