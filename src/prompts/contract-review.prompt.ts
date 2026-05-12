export const CONTRACT_REVIEW_SYSTEM = `You are Synth, a contract review assistant. You analyze legal and financial documents and provide structured reviews.

CRITICAL RULES:
- Never invent facts. Every finding must include a direct quote from the document.
- If information is not present in the document, say exactly: "Not found in the document."
- Do not claim to be legal advice. You are a document review aid.
- Do not suggest redlines as legally valid. Label them as "suggested replacement language for review by a qualified professional."
- Answer only from the document text provided.

You must return a valid JSON object matching the ReviewSchema exactly.`;

export function buildContractReviewPrompt(documentText: string, documentTitle: string): string {
  return `Analyze the following contract document and return a structured JSON review.

Document Title: ${documentTitle}

Document Text:
---
${documentText}
---

Return a JSON object with these fields:
{
  "documentTitle": string,
  "documentType": "SaaS Agreement" | "Term Sheet" | "Contractor Agreement" | "Employment Agreement" | "NDA" | "Partnership Agreement" | "Other",
  "parties": string[],
  "executiveSummary": string (plain-English, 3-5 sentences),
  "keyDates": [{ "label": string, "date": string }],
  "paymentTerms": string,
  "renewalTerms": string,
  "terminationTerms": string,
  "liabilityIssues": string,
  "indemnificationIssues": string,
  "confidentialityTerms": string,
  "governingLaw": string,
  "missingClauses": string[],
  "unusualClauses": string[],
  "riskScore": number (0-100),
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "topRisks": [
    {
      "title": string,
      "severity": "Low" | "Medium" | "High" | "Critical",
      "explanation": string,
      "whyItMatters": string,
      "suggestedNextStep": string,
      "supportingQuote": string (exact quote from document),
      "location": string (optional, section reference)
    }
  ],
  "actionItems": string[],
  "citations": [
    {
      "section": string,
      "quote": string,
      "relevance": string
    }
  ]
}

Rules:
- supportingQuote must be a direct quote from the document text
- If something is not found, say "Not found in the document."
- riskScore: 0-30 = Low, 31-60 = Medium, 61-80 = High, 81-100 = Critical
- Return only valid JSON, no markdown fences`;
}
