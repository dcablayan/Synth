import { z } from 'zod';

export const MemoSchema = z.object({
  documentTitle: z.string(),
  memoDate: z.string(),
  executiveSummary: z.string(),
  biggestRisks: z.array(
    z.object({
      risk: z.string(),
      severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
      explanation: z.string(),
    })
  ),
  financialObligations: z.array(z.string()),
  importantDeadlines: z.array(z.object({ label: z.string(), date: z.string() })),
  questionsForLawyer: z.array(z.string()),
  actionItems: z.array(z.string()),
  disclaimer: z.string(),
  generatedAt: z.string(),
});

export type Memo = z.infer<typeof MemoSchema>;
