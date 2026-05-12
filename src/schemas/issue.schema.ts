import { z } from 'zod';

export const IssueSeveritySchema = z.enum(['Low', 'Medium', 'High', 'Critical']);
export const IssueStatusSchema = z.enum(['open', 'investigating', 'resolved', 'waived']);
export const IssueCategorySchema = z.enum([
  'legal',
  'financial',
  'data-quality',
  'payment',
  'cap-table',
  'renewal',
  'party-mismatch',
  'other',
]);

export const EvidenceItemSchema = z.object({
  evidenceId: z.string(),
  issueId: z.string(),
  documentQuote: z.string(),
  spreadsheetRow: z.string().optional(),
  sourceFilename: z.string(),
  sheetName: z.string().optional(),
  rowNumber: z.number().optional(),
  fieldName: z.string().optional(),
  isVerified: z.boolean(),
  verificationNote: z.string().optional(),
});

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: IssueSeveritySchema,
  category: IssueCategorySchema,
  status: IssueStatusSchema,
  sourceFiles: z.array(z.string()),
  evidenceQuotes: z.array(z.string()),
  affectedRows: z.array(z.string()),
  recommendation: z.string(),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  evidenceIds: z.array(z.string()),
});

export const IssueLogSchema = z.object({
  logId: z.string(),
  title: z.string(),
  generatedAt: z.string(),
  sourceReports: z.array(z.string()),
  issues: z.array(IssueSchema),
  evidence: z.array(EvidenceItemSchema),
  totalIssues: z.number(),
  openCount: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
  disclaimer: z.string(),
});

export const IssueChangeSchema = z.object({
  issueId: z.string(),
  title: z.string(),
  field: z.string(),
  from: z.string(),
  to: z.string(),
});

export const PaymentChangeSchema = z.object({
  vendor: z.string(),
  amountA: z.string(),
  amountB: z.string(),
  statusA: z.string(),
  statusB: z.string(),
  change: z.string(),
});

export const CapTableChangeSchema = z.object({
  investor: z.string(),
  changeType: z.enum(['added', 'removed', 'changed']),
  detail: z.string(),
});

export const CompareReportSchema = z.object({
  reportId: z.string(),
  generatedAt: z.string(),
  sourceA: z.string(),
  sourceB: z.string(),
  addedIssues: z.array(IssueSchema),
  removedIssues: z.array(IssueSchema),
  changedIssues: z.array(IssueChangeSchema),
  paymentChanges: z.array(PaymentChangeSchema),
  capTableChanges: z.array(CapTableChangeSchema),
  riskScoreA: z.number().optional(),
  riskScoreB: z.number().optional(),
  riskScoreChange: z.string().optional(),
  newWarnings: z.array(z.string()),
  resolvedWarnings: z.array(z.string()),
  disclaimer: z.string(),
});

export type Issue = z.infer<typeof IssueSchema>;
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type IssueLog = z.infer<typeof IssueLogSchema>;
export type IssueChange = z.infer<typeof IssueChangeSchema>;
export type PaymentChange = z.infer<typeof PaymentChangeSchema>;
export type CapTableChange = z.infer<typeof CapTableChangeSchema>;
export type CompareReport = z.infer<typeof CompareReportSchema>;
export type IssueSeverity = z.infer<typeof IssueSeveritySchema>;
export type IssueStatus = z.infer<typeof IssueStatusSchema>;
export type IssueCategory = z.infer<typeof IssueCategorySchema>;
