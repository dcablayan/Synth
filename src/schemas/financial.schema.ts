import { z } from 'zod';

export const FinancialRedFlagSchema = z.object({
  issue: z.string(),
  explanation: z.string(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  supportingQuote: z.string(),
});

export const FinancialSchema = z.object({
  documentTitle: z.string(),
  totalContractValue: z.string(),
  recurringFees: z.string(),
  oneTimeFees: z.string(),
  paymentSchedule: z.string(),
  lateFees: z.string(),
  penalties: z.string(),
  discounts: z.string(),
  equityTerms: z.string(),
  revenueShare: z.string(),
  refundTerms: z.string(),
  renewalCostChanges: z.string(),
  financialRedFlags: z.array(FinancialRedFlagSchema),
  citations: z.array(
    z.object({
      section: z.string(),
      quote: z.string(),
      relevance: z.string(),
    })
  ),
  generatedAt: z.string(),
  disclaimer: z.string(),
});

export type Financial = z.infer<typeof FinancialSchema>;
export type FinancialRedFlag = z.infer<typeof FinancialRedFlagSchema>;
