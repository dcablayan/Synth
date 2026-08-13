import Link from 'next/link';

const LINKS = [
  { href: '/demo', label: 'Demo' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/artifacts', label: 'Artifacts' },
  { href: '/case-study', label: 'Case Study' },
] as const;

// One nav for every page: wordmark, current-page crumb, section links, GitHub.
// Wraps cleanly on small screens instead of cramming into one row.
export default function SiteNav({ current, children }: { current?: string; children?: React.ReactNode }) {
  return (
    <nav className="border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 bg-white/95 backdrop-blur z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-gray-900 font-serif font-bold text-xl tracking-wide whitespace-nowrap">
            <span aria-hidden>§</span> Synth
          </Link>
          {current ? (
            <>
              <span className="text-gray-500" aria-hidden>/</span>
              <span className="text-gray-700 text-sm truncate">{current}</span>
            </>
          ) : (
            <span className="text-gray-500 text-sm hidden md:block">Evidence-backed diligence</span>
          )}
        </div>
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap justify-end">
          {LINKS.filter((l) => l.label !== current).map((l) => (
            <Link key={l.href} href={l.href} className="text-gray-600 hover:text-gray-900 text-sm transition-colors whitespace-nowrap">
              {l.label}
            </Link>
          ))}
          <a
            href="https://github.com/dcablayan/Synth"
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors whitespace-nowrap"
          >
            GitHub
          </a>
          {children}
        </div>
      </div>
    </nav>
  );
}
