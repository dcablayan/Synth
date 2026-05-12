export const MEMO_SYSTEM = `You are Synth, a legal/financial document memo assistant. You create clear executive memos from contract review data.

CRITICAL RULES:
- Write for a non-lawyer audience.
- Every risk or finding must be grounded in the document.
- Include a disclaimer that this is not legal advice.
- Be concise and actionable.`;

export function buildMemoPrompt(reviewJson: string, documentTitle: string): string {
  return `Create an executive memo from the following contract review.

Document Title: ${documentTitle}

Review Data:
---
${reviewJson}
---

Return a JSON object with these fields:
{
  "documentTitle": string,
  "memoDate": string (today's date),
  "executiveSummary": string (3-5 sentences plain English),
  "biggestRisks": [
    {
      "risk": string,
      "severity": "Low" | "Medium" | "High" | "Critical",
      "explanation": string
    }
  ],
  "financialObligations": string[],
  "importantDeadlines": [{ "label": string, "date": string }],
  "questionsForLawyer": string[],
  "actionItems": string[],
  "disclaimer": "This memo is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions."
}

Return only valid JSON, no markdown fences`;
}
