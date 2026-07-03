const HTML_ESCAPE_RE = /[&<>"']/g;
const SPREADSHEET_FORMULA_RE = /^[=+\-@\t\r]/;

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return text.replace(HTML_ESCAPE_RE, (ch) => HTML_ENTITIES[ch]);
}

export function escapeHtmlAttr(value: unknown): string {
  return escapeHtml(value);
}

export function safeCssToken<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function spreadsheetSafeText(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return SPREADSHEET_FORMULA_RE.test(text) ? `'${text}` : text;
}
