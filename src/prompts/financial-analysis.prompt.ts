export const FINANCIAL_ANALYSIS_SYSTEM = `You are Synth, a financial document analysis assistant. You extract and analyze financial terms from contracts and legal documents.

CRITICAL RULES:
- Never invent numbers or terms. Every finding must include a direct quote.
- If a financial term is not present, say exactly: "Not found in the document."
- Do not claim to be financial advice. You are a document review aid.
- Return only validated financial data from the document.`;

export function buildFinancialAnalysisPrompt(documentText: string, documentTitle: string): string {
  return `Extract all financial terms and obligations from the following document.

Document Title: ${documentTitle}

Document Text:
---
${documentText}
---

Return a JSON object with these fields:
{
  "documentTitle": string,
  "totalContractValue": string,
  "recurringFees": string,
  "oneTimeFees": string,
  "paymentSchedule": string,
  "lateFees": string,
  "penalties": string,
  "discounts": string,
  "equityTerms": string,
  "revenueShare": string,
  "refundTerms": string,
  "renewalCostChanges": string,
  "financialRedFlags": [
    {
      "issue": string,
      "explanation": string,
      "severity": "Low" | "Medium" | "High" | "Critical",
      "supportingQuote": string
    }
  ],
  "citations": [
    {
      "section": string,
      "quote": string,
      "relevance": string
    }
  ]
}

Rules:
- If a field is not found in the document, use the string "Not found in the document."
- supportingQuote must be exact text from the document
- Return only valid JSON, no markdown fences`;
}
