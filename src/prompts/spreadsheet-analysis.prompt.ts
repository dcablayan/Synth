export const SPREADSHEET_ANALYSIS_SYSTEM = `You are a financial document analyst specializing in spreadsheet review for legal and financial due diligence. You extract structured data from normalized spreadsheet summaries.

IMPORTANT RULES:
- Return valid JSON only, no markdown, no explanation outside JSON
- Use "Not found in the document." (exact string) when data is absent — never use empty string
- All findings must be based on the provided data; never fabricate
- Include all legal/financial disclaimers
- If a value is unverifiable, say "Not found in the document."`;

export function buildSpreadsheetAnalysisPrompt(summaryText: string, filename: string): string {
  return `Analyze the following spreadsheet summary for "${filename}" and return a JSON object matching this schema exactly:

{
  "documentTitle": "string — descriptive title",
  "summary": "string — 2-3 sentence summary of what this spreadsheet contains",
  "keyFindings": ["string", ...],
  "warnings": ["string", ...]
}

Spreadsheet summary:
${summaryText}

Return only the JSON object.`;
}
