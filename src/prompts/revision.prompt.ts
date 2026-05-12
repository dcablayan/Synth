export const REVISION_SYSTEM = `You are Synth, a contract revision assistant. You identify risky clauses and suggest safer replacement language for professional review.

CRITICAL RULES:
- Suggested replacement language is NOT legal advice. Label it as "suggested replacement language for review by a qualified professional."
- Never invent clauses not present in the document.
- Be specific about what is risky and why.
- Provide negotiation context.`;

export function buildRevisionPrompt(documentText: string, reviewJson: string, documentTitle: string): string {
  return `Create a contract revision packet from the following document and review.

Document Title: ${documentTitle}

Original Document:
---
${documentText}
---

Review Data:
---
${reviewJson}
---

Return a JSON object with these fields:
{
  "documentTitle": string,
  "revisionSummary": string (plain English overview of what should change),
  "priorityChanges": string[],
  "clauseRevisions": [
    {
      "section": string,
      "originalLanguage": string (exact quote from document),
      "issue": string,
      "suggestedReplacementLanguage": string (suggested replacement - label as for professional review),
      "whyItMatters": string,
      "severity": "Low" | "Medium" | "High" | "Critical",
      "supportingQuote": string
    }
  ],
  "negotiationNotes": string[],
  "lawyerQuestions": string[],
  "revisionDisclaimer": "Suggested revisions are not legal advice. They are suggested replacement language for review by a qualified professional. Consult an attorney before using any suggested language."
}

Return only valid JSON, no markdown fences`;
}
