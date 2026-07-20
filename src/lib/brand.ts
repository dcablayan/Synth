import { escapeHtml } from './output-safety';

// ---------------------------------------------------------------------------
// Synth brand tokens — the single source of truth for identity, color, and the
// shared chrome of every rendered output.
//
// Design language: professional counsel. White paper, near-black ink, serif
// display type, hairline rules, squared stamps. Color is reserved for meaning
// (severity, verification) and always muted; there is no decorative accent.
// All text/surface pairs pass WCAG AA on white (computed 2026-07-19).
// ---------------------------------------------------------------------------

export const BRAND = {
  name: 'Synth',
  // The section sign — the typographic mark of legal citation.
  mark: '§',
  wordmark: '§ Synth',
  tagline: 'Evidence-backed diligence',
} as const;

// The canonical disclaimer. SAFETY.md: this sentence appears verbatim, exactly
// once, on every rendered output (printable documents also carry it in the
// footer fine print). Do not fork this string.
export const DISCLAIMER =
  'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

export const REVISION_DISCLAIMER =
  'Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language.';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

// Status palette on white paper — the -700 range, used as colored text and
// hairline borders (never loud fills). Badges always carry their text label.
export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: '#b91c1c',
  High: '#c2410c',
  Medium: '#b45309',
  Low: '#15803d',
};

export const COLORS = {
  paper: '#ffffff',
  paperTint: '#f9fafb',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  ink: '#111827',
  inkSoft: '#374151',
  muted: '#4b5563',
  faint: '#6b7280',
} as const;

const FONT_STACK = "'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif";
// Documents render offline in Playwright (external fonts are blocked), so the
// serif stack leads with system faces that are always present.
const SERIF_STACK = "Georgia, 'Source Serif 4', 'Times New Roman', serif";
const MONO_STACK = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const SEVERITIES: readonly Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export function safeSeverity(value: unknown): Severity {
  return SEVERITIES.includes(value as Severity) ? (value as Severity) : 'Low';
}

export function severityColor(value: unknown): string {
  return SEVERITY_COLORS[safeSeverity(value)];
}

// Severity stamp: outlined, uppercase, colored text — never a loud fill.
function severityStamp(severity: unknown): string {
  const sev = safeSeverity(severity);
  const color = SEVERITY_COLORS[sev];
  return `<span class="badge" style="color:${color};border-color:${color}">${escapeHtml(sev)}</span>`;
}

// --- Document (print) theme -------------------------------------------------

export function documentCss(): string {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: ${SERIF_STACK}; color: ${COLORS.ink}; background: ${COLORS.paper}; font-size: 14px; line-height: 1.7; }
      .page { max-width: 800px; margin: 0 auto; padding: 40px; }
      h1 { font-family: ${SERIF_STACK}; font-size: 27px; color: ${COLORS.ink}; letter-spacing: 0.01em; margin-bottom: 8px; }
      h2 { font-family: ${FONT_STACK}; font-size: 12px; color: ${COLORS.ink}; text-transform: uppercase; letter-spacing: 0.14em; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 6px; margin: 34px 0 14px; }
      h3 { font-family: ${FONT_STACK}; font-size: 12.5px; color: ${COLORS.inkSoft}; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; }
      p { margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; margin: 14px 0; font-family: ${FONT_STACK}; }
      th { background: ${COLORS.paperTint}; color: ${COLORS.muted}; padding: 8px 12px; text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid ${COLORS.ink}; }
      td { padding: 8px 12px; border-bottom: 1px solid ${COLORS.border}; font-size: 13px; vertical-align: top; }
      blockquote { border-left: 2px solid ${COLORS.borderStrong}; padding: 8px 16px; margin: 12px 0; background: ${COLORS.paperTint}; color: ${COLORS.inkSoft}; font-style: italic; }
      ul, ol { padding-left: 20px; }
      li { margin-bottom: 6px; }
      .badge { display: inline-block; padding: 2px 9px; border: 1px solid; border-radius: 2px; background: transparent; font-family: ${FONT_STACK}; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
      .eyebrow { font-family: ${FONT_STACK}; color: ${COLORS.faint}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.28em; margin-bottom: 16px; }
      .cover { text-align: center; padding: 52px 40px 30px; border-bottom: 4px double ${COLORS.ink}; margin-bottom: 32px; }
      .cover .meta { font-family: ${FONT_STACK}; color: ${COLORS.faint}; font-size: 12.5px; margin-top: 8px; }
      .cover .risk-score { font-size: 48px; font-weight: 700; color: ${COLORS.ink}; margin: 16px 0 4px; }
      .fine-print { font-family: ${FONT_STACK}; color: ${COLORS.faint}; font-size: 10.5px; margin-top: 18px; }
      .notice { font-family: ${FONT_STACK}; background: ${COLORS.paperTint}; border: 1px solid ${COLORS.border}; border-left: 3px solid ${COLORS.ink}; color: ${COLORS.inkSoft}; padding: 12px 16px; border-radius: 2px; font-size: 12px; margin: 20px 0; }
      .footer { font-family: ${FONT_STACK}; margin-top: 44px; padding-top: 14px; border-top: 1px solid ${COLORS.border}; font-size: 10.5px; color: ${COLORS.faint}; text-align: center; }
      .risk-card { border: 1px solid ${COLORS.border}; border-radius: 2px; padding: 16px; margin: 12px 0; }
      .risk-card.Critical { border-left: 3px solid ${SEVERITY_COLORS.Critical}; }
      .risk-card.High { border-left: 3px solid ${SEVERITY_COLORS.High}; }
      .risk-card.Medium { border-left: 3px solid ${SEVERITY_COLORS.Medium}; }
      .risk-card.Low { border-left: 3px solid ${SEVERITY_COLORS.Low}; }
      .section-break { page-break-before: always; padding-top: 28px; }
      .section-header { font-family: ${FONT_STACK}; background: ${COLORS.ink}; color: #fff; padding: 9px 16px; border-radius: 2px; margin: 24px 0 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; }
    </style>
  `;
}

export function documentBadge(severity: unknown): string {
  return severityStamp(severity);
}

// Cover eyebrow: "§ SYNTH · CONTRACT REVIEW"
export function documentEyebrow(kind: string): string {
  return `<div class="eyebrow">${escapeHtml(BRAND.mark)} ${escapeHtml(BRAND.name)} · ${escapeHtml(kind)}</div>`;
}

// The single cover fine-print disclaimer line (printable documents carry the
// disclaimer on the cover and in the footer — nowhere else).
export function documentCoverFinePrint(): string {
  return `<div class="fine-print">${escapeHtml(DISCLAIMER)}</div>`;
}

export function documentFooter(generatedAtText: string): string {
  return `<div class="footer">
  <p>${escapeHtml(DISCLAIMER)}</p>
  <p>Generated by ${escapeHtml(BRAND.name)} · ${escapeHtml(generatedAtText)}</p>
</div>`;
}

// --- Screen theme for CLI-rendered reports (same paper language) ------------

export function screenCss(): string {
  return `
    <style>
      * { box-sizing: border-box; }
      body { font-family: ${FONT_STACK}; background: ${COLORS.paper}; color: ${COLORS.ink}; margin: 0; padding: 24px; line-height: 1.6; }
      .container { max-width: 960px; margin: 0 auto; }
      .brand-bar { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
      .brand-mark { color: ${COLORS.ink}; font-family: ${SERIF_STACK}; font-weight: 700; font-size: 1.15rem; letter-spacing: 0.02em; }
      .report-kind { color: ${COLORS.faint}; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.16em; }
      h1 { font-family: ${SERIF_STACK}; color: ${COLORS.ink}; font-size: 1.55rem; margin: 4px 0 6px; letter-spacing: 0.01em; }
      h2 { color: ${COLORS.muted}; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.14em; margin: 28px 0 12px; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 6px; }
      h4 { color: ${COLORS.ink}; font-size: 0.9rem; margin: 6px 0; }
      .meta { color: ${COLORS.faint}; font-size: 0.78rem; }
      .section { background: ${COLORS.paper}; border: 1px solid ${COLORS.border}; border-radius: 2px; padding: 16px; margin-bottom: 16px; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 20px 0; }
      .stat { background: ${COLORS.paper}; border: 1px solid ${COLORS.border}; border-radius: 2px; padding: 14px; text-align: center; }
      .stat-val { font-family: ${SERIF_STACK}; font-size: 1.6rem; font-weight: 700; color: ${COLORS.ink}; }
      .stat-lbl { font-size: 0.72rem; color: ${COLORS.faint}; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
      table.main { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
      table.main th { background: ${COLORS.paperTint}; color: ${COLORS.muted}; padding: 6px 10px; text-align: left; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid ${COLORS.ink}; }
      table.main td { padding: 6px 10px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.inkSoft}; vertical-align: top; }
      code { background: ${COLORS.paperTint}; border: 1px solid ${COLORS.border}; color: ${COLORS.ink}; padding: 1px 5px; border-radius: 2px; font-size: 0.76rem; font-family: ${MONO_STACK}; }
      blockquote { border-left: 2px solid ${COLORS.borderStrong}; padding: 4px 12px; font-family: ${SERIF_STACK}; color: ${COLORS.inkSoft}; font-style: italic; font-size: 0.84rem; margin: 8px 0; }
      .chip { display: inline-block; border: 1px solid; font-size: 0.68rem; padding: 2px 9px; border-radius: 2px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; background: transparent; }
      .warning-list { background: ${COLORS.paperTint}; border: 1px solid ${COLORS.border}; border-left: 3px solid ${SEVERITY_COLORS.Medium}; border-radius: 2px; padding: 12px 16px; }
      .warning-list li { color: ${SEVERITY_COLORS.Medium}; font-size: 0.82rem; margin: 4px 0; }
      .recommendation { color: ${COLORS.ink}; font-size: 0.82rem; font-weight: 500; }
      .finding-card { background: ${COLORS.paper}; border: 1px solid ${COLORS.border}; border-radius: 2px; padding: 14px; margin-bottom: 12px; }
      .site-footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid ${COLORS.border}; color: ${COLORS.faint}; font-size: 0.72rem; text-align: center; line-height: 1.7; }
    </style>
  `;
}

export function screenChip(severity: unknown): string {
  const sev = safeSeverity(severity);
  const color = SEVERITY_COLORS[sev];
  return `<span class="chip" style="color:${color};border-color:${color}">${escapeHtml(sev)}</span>`;
}

// Header band for screen reports: wordmark · report kind, then the title.
export function screenHeader(kind: string, title: string, metaHtml: string): string {
  return `<div class="brand-bar"><span class="brand-mark">${escapeHtml(BRAND.wordmark)}</span><span class="report-kind">${escapeHtml(kind)}</span></div>
<h1>${escapeHtml(title)}</h1>
<p class="meta">${metaHtml}</p>`;
}

// The single disclaimer instance for screen reports lives here.
export function screenFooter(generatedAtText: string): string {
  return `<div class="site-footer">
  <p>${escapeHtml(DISCLAIMER)}</p>
  <p>Generated by ${escapeHtml(BRAND.name)} · ${escapeHtml(generatedAtText)}</p>
</div>`;
}
