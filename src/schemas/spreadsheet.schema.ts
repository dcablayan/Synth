import { z } from 'zod';

export const ColumnProfileSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'date', 'currency', 'email', 'boolean', 'unknown']),
  sampleValues: z.array(z.string()).max(5),
  uniqueCount: z.number(),
  blankCount: z.number(),
  isCurrencyLike: z.boolean().optional(),
  isDateLike: z.boolean().optional(),
});

export const TableProfileSchema = z.object({
  sheetName: z.string(),
  rowCount: z.number(),
  columnCount: z.number(),
  columns: z.array(ColumnProfileSchema),
  detectedEntities: z.array(z.string()),
  detectedAmounts: z.array(z.string()),
  detectedDates: z.array(z.string()),
  detectedEmails: z.array(z.string()),
  repeatedVendors: z.array(z.string()),
  totalAmounts: z.array(z.object({ label: z.string(), amount: z.string() })),
  isPaymentSchedule: z.boolean(),
  isCapTable: z.boolean(),
  isInvoice: z.boolean(),
  isVendorList: z.boolean(),
  warnings: z.array(z.string()),
});

export const SpreadsheetAnalysisSchema = z.object({
  documentTitle: z.string(),
  sourceFilename: z.string(),
  sourceExtension: z.string(),
  sheetCount: z.number(),
  totalRows: z.number(),
  tables: z.array(TableProfileSchema),
  summary: z.string(),
  keyFindings: z.array(z.string()),
  warnings: z.array(z.string()),
  providerMode: z.enum(['mock', 'ai']).optional(),
  fallbackUsed: z.boolean().optional(),
  generatedAt: z.string(),
  disclaimer: z.string(),
});

export const CrossDocumentFindingSchema = z.object({
  findingType: z.enum([
    'payment-mismatch',
    'party-mismatch',
    'date-mismatch',
    'amount-mismatch',
    'missing-party',
    'duplicate-vendor',
    'renewal-mismatch',
    'cap-table-conflict',
    'unverifiable',
  ]),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  title: z.string(),
  description: z.string(),
  sourceA: z.string(),
  sourceB: z.string(),
  valueA: z.string(),
  valueB: z.string(),
  recommendation: z.string(),
});

export const PaymentScheduleFindingSchema = z.object({
  vendor: z.string(),
  amount: z.string(),
  dueDate: z.string(),
  status: z.string(),
  sourceFile: z.string(),
  contractMatch: z.string().optional(),
  mismatch: z.string().optional(),
});

export const CapTableFindingSchema = z.object({
  investor: z.string(),
  shareClass: z.string(),
  shares: z.string(),
  ownershipPct: z.string(),
  sourceFile: z.string(),
  termSheetMatch: z.string().optional(),
  discrepancy: z.string().optional(),
});

export const DataRoomSummarySchema = z.object({
  title: z.string(),
  generatedAt: z.string(),
  fileCount: z.number(),
  fileTypes: z.array(z.object({ ext: z.string(), count: z.number() })),
  documents: z.array(z.object({
    filename: z.string(),
    type: z.string(),
    category: z.enum(['contract', 'spreadsheet', 'other']),
    rowCount: z.number().optional(),
    characterCount: z.number().optional(),
  })),
  crossDocumentFindings: z.array(CrossDocumentFindingSchema),
  paymentScheduleFindings: z.array(PaymentScheduleFindingSchema),
  capTableFindings: z.array(CapTableFindingSchema),
  dataQualityWarnings: z.array(z.string()),
  executiveSummary: z.string(),
  providerMode: z.enum(['mock', 'ai']).optional(),
  fallbackUsed: z.boolean().optional(),
  disclaimer: z.string(),
});

export type ColumnProfile = z.infer<typeof ColumnProfileSchema>;
export type TableProfile = z.infer<typeof TableProfileSchema>;
export type SpreadsheetAnalysis = z.infer<typeof SpreadsheetAnalysisSchema>;
export type CrossDocumentFinding = z.infer<typeof CrossDocumentFindingSchema>;
export type PaymentScheduleFinding = z.infer<typeof PaymentScheduleFindingSchema>;
export type CapTableFinding = z.infer<typeof CapTableFindingSchema>;
export type DataRoomSummary = z.infer<typeof DataRoomSummarySchema>;
