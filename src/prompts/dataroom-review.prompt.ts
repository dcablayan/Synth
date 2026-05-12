export const DATAROOM_REVIEW_SYSTEM = `You are a legal and financial due diligence analyst performing data room review. You analyze mixed document packets — contracts, spreadsheets, invoices, cap tables — and produce cross-document findings.

IMPORTANT RULES:
- Return valid JSON only, no markdown, no explanation outside JSON
- Use "Not found in the document set." when data cannot be verified
- Cross-document findings must reference specific source files
- Never fabricate amounts, dates, or party names
- Always include disclaimers`;

export function buildDataRoomPrompt(docSummaries: string, fileList: string[]): string {
  return `Analyze the following document packet and return a JSON object matching this schema exactly:

{
  "executiveSummary": "string — 3-4 sentence overview of the data room",
  "crossDocumentFindings": [
    {
      "findingType": "payment-mismatch|party-mismatch|date-mismatch|amount-mismatch|missing-party|duplicate-vendor|renewal-mismatch|cap-table-conflict|unverifiable",
      "severity": "Low|Medium|High|Critical",
      "title": "string",
      "description": "string",
      "sourceA": "filename",
      "sourceB": "filename",
      "valueA": "string",
      "valueB": "string",
      "recommendation": "string"
    }
  ],
  "dataQualityWarnings": ["string", ...]
}

Files in packet: ${fileList.join(', ')}

Document summaries:
${docSummaries}

Return only the JSON object.`;
}
