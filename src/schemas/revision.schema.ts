import { z } from 'zod';

export const ClauseRevisionSchema = z.object({
  section: z.string(),
  originalLanguage: z.string(),
  issue: z.string(),
  suggestedReplacementLanguage: z.string(),
  whyItMatters: z.string(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  supportingQuote: z.string(),
});

export const RevisionSchema = z.object({
  documentTitle: z.string(),
  revisionSummary: z.string(),
  priorityChanges: z.array(z.string()),
  clauseRevisions: z.array(ClauseRevisionSchema),
  negotiationNotes: z.array(z.string()),
  lawyerQuestions: z.array(z.string()),
  revisionDisclaimer: z.string(),
  generatedAt: z.string(),
});

export type Revision = z.infer<typeof RevisionSchema>;
export type ClauseRevision = z.infer<typeof ClauseRevisionSchema>;
