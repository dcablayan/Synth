import { z } from 'zod';

export const RiskSchema = z.object({
  title: z.string(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  explanation: z.string(),
  whyItMatters: z.string(),
  suggestedNextStep: z.string(),
  supportingQuote: z.string(),
  location: z.string().optional(),
});

export const CitationSchema = z.object({
  section: z.string(),
  quote: z.string(),
  relevance: z.string(),
});

export const ReviewSchema = z.object({
  documentTitle: z.string(),
  documentType: z.enum([
    'SaaS Agreement',
    'Term Sheet',
    'Contractor Agreement',
    'Employment Agreement',
    'NDA',
    'Partnership Agreement',
    'Other',
  ]),
  parties: z.array(z.string()),
  executiveSummary: z.string(),
  keyDates: z.array(z.object({ label: z.string(), date: z.string() })),
  paymentTerms: z.string(),
  renewalTerms: z.string(),
  terminationTerms: z.string(),
  liabilityIssues: z.string(),
  indemnificationIssues: z.string(),
  confidentialityTerms: z.string(),
  governingLaw: z.string(),
  missingClauses: z.array(z.string()),
  unusualClauses: z.array(z.string()),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
  topRisks: z.array(RiskSchema),
  actionItems: z.array(z.string()),
  citations: z.array(CitationSchema),
  generatedAt: z.string(),
  disclaimer: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Citation = z.infer<typeof CitationSchema>;
