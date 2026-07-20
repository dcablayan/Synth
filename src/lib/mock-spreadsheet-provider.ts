import type { ParsedSheet } from './spreadsheet-parser';
import type { TableProfile, SpreadsheetAnalysis, CrossDocumentFinding, DataRoomSummary, PaymentScheduleFinding, CapTableFinding } from '../schemas/spreadsheet.schema';
import { DISCLAIMER } from './brand';


// Hard ceilings so a pathological sheet cannot explode report size. When a cap
// is hit, the summary carries an explicit warning — never silent truncation.
const MAX_PAYMENT_FINDINGS = 500;
const MAX_CAP_TABLE_FINDINGS = 500;

function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot) : '';
}

export function generateMockSpreadsheetAnalysis(
  filename: string,
  sheets: ParsedSheet[],
  profiles: TableProfile[]
): SpreadsheetAnalysis {
  const now = new Date().toISOString();
  const totalRows = profiles.reduce((s, p) => s + p.rowCount, 0);

  const findings: string[] = [];
  for (const profile of profiles) {
    if (profile.isPaymentSchedule) {
      const overdue = profile.warnings.find((w) => w.includes('overdue'));
      if (overdue) findings.push(`Payment schedule has ${overdue.toLowerCase()}`);
      if (profile.totalAmounts.length > 0) {
        findings.push(`Payment totals detected: ${profile.totalAmounts.map((t) => `${t.label}: ${t.amount}`).join(', ')}`);
      }
      if (profile.repeatedVendors.length > 0) {
        findings.push(`Repeated vendors in payment schedule: ${profile.repeatedVendors.join(', ')}`);
      }
    }
    if (profile.isCapTable) {
      findings.push(`Cap table detected with ${profile.rowCount} investor rows`);
      if (profile.detectedEntities.length > 0) {
        findings.push(`Investors/parties: ${profile.detectedEntities.slice(0, 5).join(', ')}`);
      }
      const totalRow = profile.totalAmounts.find((t) => /total/i.test(t.label));
      if (totalRow) findings.push(`Cap table total: ${totalRow.amount}`);
    }
    if (profile.isInvoice || profile.isVendorList) {
      findings.push(`Invoice/vendor sheet: ${profile.rowCount} rows, ${profile.detectedEntities.length} entities`);
    }
  }

  const allWarnings = profiles.flatMap((p) => p.warnings);

  const firstProfile = profiles[0];
  const summary = firstProfile
    ? `This spreadsheet (${filename}) contains ${sheets.length} sheet(s) with ${totalRows} total data rows. ` +
      (firstProfile.isPaymentSchedule ? 'It appears to be a payment schedule tracking vendor invoices and due dates. ' : '') +
      (firstProfile.isCapTable ? 'It contains cap table / equity ownership data. ' : '') +
      (firstProfile.isVendorList || firstProfile.isInvoice ? 'It contains vendor invoice data. ' : '') +
      'All financial figures were extracted directly from the spreadsheet — no AI analysis was performed (mock mode).'
    : `Spreadsheet ${filename} parsed in mock mode. ${totalRows} rows across ${sheets.length} sheet(s).`;

  return {
    documentTitle: filename.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''),
    sourceFilename: filename,
    sourceExtension: fileExtension(filename),
    sheetCount: sheets.length,
    totalRows,
    tables: profiles,
    summary,
    keyFindings: findings.length > 0 ? findings : ['No structured findings — review manually'],
    warnings: allWarnings,
    providerMode: 'mock',
    fallbackUsed: false,
    generatedAt: now,
    disclaimer: DISCLAIMER,
  };
}

function findVendorColumn(headers: string[]): number {
  return headers.findIndex((h) => /vendor|supplier|company/i.test(h));
}

function buildPaymentFindings(
  csvDocs: Array<{ filename: string; sheets: ParsedSheet[]; profiles: TableProfile[] }>
): { findings: PaymentScheduleFinding[]; truncated: boolean } {
  const findings: PaymentScheduleFinding[] = [];
  let truncated = false;

  for (const doc of csvDocs) {
    for (let si = 0; si < doc.sheets.length; si++) {
      const profile = doc.profiles[si];
      const sheet = doc.sheets[si];
      if (!profile.isPaymentSchedule && !profile.isInvoice) continue;

      const vendorCol = findVendorColumn(sheet.headers);
      const amountCol = sheet.headers.findIndex((h) => /amount|total|fee/i.test(h));
      const dateCol = sheet.headers.findIndex((h) => /date|due/i.test(h));
      const statusCol = sheet.headers.findIndex((h) => /status/i.test(h));

      for (const row of sheet.rows) {
        const vendor = vendorCol >= 0 ? row[vendorCol]?.trim() : '';
        const amount = amountCol >= 0 ? row[amountCol]?.trim() : '';
        const dueDate = dateCol >= 0 ? row[dateCol]?.trim() : '';
        const status = statusCol >= 0 ? row[statusCol]?.trim() : '';
        if (!vendor || !amount || /^total/i.test(vendor)) continue;
        if (findings.length >= MAX_PAYMENT_FINDINGS) {
          truncated = true;
          break;
        }
        findings.push({
          vendor,
          amount,
          dueDate: dueDate || 'Not found in the document.',
          status: status || 'Not found in the document.',
          sourceFile: doc.filename,
        });
      }
    }
  }
  return { findings, truncated };
}

function buildCapTableFindings(
  csvDocs: Array<{ filename: string; sheets: ParsedSheet[]; profiles: TableProfile[] }>
): { findings: CapTableFinding[]; truncated: boolean } {
  const findings: CapTableFinding[] = [];
  let truncated = false;

  for (const doc of csvDocs) {
    for (let si = 0; si < doc.sheets.length; si++) {
      const profile = doc.profiles[si];
      const sheet = doc.sheets[si];
      if (!profile.isCapTable) continue;

      const investorCol = sheet.headers.findIndex((h) => /investor|founder|holder|name/i.test(h));
      const classCol = sheet.headers.findIndex((h) => /class|share.?class|series/i.test(h));
      const sharesCol = sheet.headers.findIndex((h) => /^shares$/i.test(h) || /number.of.shares/i.test(h));
      const pctCol = sheet.headers.findIndex((h) => /ownership|%|percent/i.test(h));

      for (const row of sheet.rows) {
        const investor = investorCol >= 0 ? row[investorCol]?.trim() : '';
        const shareClass = classCol >= 0 ? row[classCol]?.trim() : '';
        const shares = sharesCol >= 0 ? row[sharesCol]?.trim() : '';
        const ownershipPct = pctCol >= 0 ? row[pctCol]?.trim() : '';
        if (!investor || /^total/i.test(investor) || /^notes/i.test(investor)) continue;
        if (findings.length >= MAX_CAP_TABLE_FINDINGS) {
          truncated = true;
          break;
        }
        findings.push({
          investor,
          shareClass: shareClass || 'Not found in the document.',
          shares: shares || 'Not found in the document.',
          ownershipPct: ownershipPct || 'Not found in the document.',
          sourceFile: doc.filename,
        });
      }
    }
  }
  return { findings, truncated };
}

function buildCrossDocumentFindings(
  contractDocs: Array<{ filename: string; text: string }>,
  csvDocs: Array<{ filename: string; sheets: ParsedSheet[]; profiles: TableProfile[] }>
): CrossDocumentFinding[] {
  const findings: CrossDocumentFinding[] = [];
  if (contractDocs.length === 0 || csvDocs.length === 0) return findings;

  const contractDoc = contractDocs[0];
  for (const csv of csvDocs) {
    for (let si = 0; si < csv.profiles.length; si++) {
      const profile = csv.profiles[si];
      const sheet = csv.sheets[si];
      if (!sheet) continue;

      if (profile.isPaymentSchedule) {
        // Vendor names come from the header-detected vendor column, not column 0.
        const vendorCol = findVendorColumn(sheet.headers);
        const overdueVendors = sheet.rows
          .filter((r) => r.some((c) => /overdue/i.test(c)))
          .map((r) => (vendorCol >= 0 ? r[vendorCol] : r[0]) ?? '')
          .filter(Boolean);
        if (overdueVendors.length > 0) {
          findings.push({
            findingType: 'payment-mismatch',
            severity: 'High',
            title: `Overdue Payments Detected (${csv.filename})`,
            description: `${overdueVendors.length} overdue payment row(s) in ${csv.filename}. Contract payment terms may not be followed.`,
            sourceA: contractDoc.filename,
            sourceB: csv.filename,
            valueA: 'Contract payment terms (see contract)',
            valueB: `Overdue: ${[...new Set(overdueVendors)].slice(0, 5).join(', ')}`,
            recommendation: 'Review overdue invoices against contract payment terms and resolve outstanding amounts.',
          });
        }

        if (profile.repeatedVendors.length > 0) {
          findings.push({
            findingType: 'duplicate-vendor',
            severity: 'Medium',
            title: `Repeated Vendor Names in Payment Schedule (${csv.filename})`,
            description: `Vendors appear multiple times in ${csv.filename}: ${profile.repeatedVendors.join(', ')}`,
            sourceA: csv.filename,
            sourceB: csv.filename,
            valueA: profile.repeatedVendors.join(', '),
            valueB: 'Multiple rows',
            recommendation: 'Verify these are separate invoices and not duplicate billing entries.',
          });
        }
      }

      if (profile.isCapTable) {
        const termSheetContract = contractDocs.find((c) => /term.?sheet|series|financing/i.test(c.filename));
        if (termSheetContract) {
          const hasPreferredStock = /preferred stock|liquidation preference|anti.dilution/i.test(termSheetContract.text);
          const capTableHasPreferred = sheet.rows.some((r) => r.some((c) => /preferred/i.test(c)));
          if (hasPreferredStock && !capTableHasPreferred) {
            findings.push({
              findingType: 'cap-table-conflict',
              severity: 'High',
              title: `Preferred Stock in Term Sheet Not Reflected in Cap Table (${csv.filename})`,
              description: `Term sheet references preferred stock terms but cap table in ${csv.filename} may not fully reflect post-closing capitalization.`,
              sourceA: termSheetContract.filename,
              sourceB: csv.filename,
              valueA: 'Preferred stock / liquidation preference terms present',
              valueB: 'Cap table may not reflect post-closing terms',
              recommendation: 'Reconcile cap table with term sheet preferred stock terms after closing.',
            });
          }
        }
      }
    }
  }

  if (findings.length === 0 && csvDocs.length > 0 && contractDocs.length > 0) {
    findings.push({
      findingType: 'unverifiable',
      severity: 'Low',
      title: 'Cross-Document Verification Incomplete',
      description: 'Some cross-document checks could not be performed in mock mode due to limited data extraction.',
      sourceA: contractDocs[0].filename,
      sourceB: csvDocs[0].filename,
      valueA: 'Contract terms not fully parsed',
      valueB: 'Spreadsheet data parsed',
      recommendation: 'Run with AI mode for comprehensive cross-document analysis.',
    });
  }

  return findings;
}

export function generateMockDataRoomSummary(
  contractDocs: Array<{ filename: string; text: string }>,
  csvDocs: Array<{ filename: string; sheets: ParsedSheet[]; profiles: TableProfile[] }>,
  otherDocs: Array<{ filename: string; ext: string }>
): DataRoomSummary {
  const now = new Date().toISOString();
  const allFiles = [
    ...contractDocs.map((d) => ({ filename: d.filename, type: 'contract', category: 'contract' as const, characterCount: d.text.length })),
    ...csvDocs.map((d) => ({ filename: d.filename, type: 'spreadsheet', category: 'spreadsheet' as const, rowCount: d.profiles.reduce((s, p) => s + p.rowCount, 0) })),
    ...otherDocs.map((d) => ({ filename: d.filename, type: d.ext.replace('.', ''), category: 'other' as const })),
  ];

  const extCounts = new Map<string, number>();
  for (const f of allFiles) {
    const ext = fileExtension(f.filename) || '(none)';
    extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
  }

  const payments = buildPaymentFindings(csvDocs);
  const capTable = buildCapTableFindings(csvDocs);
  const crossFindings = buildCrossDocumentFindings(contractDocs, csvDocs);

  const dataQualityWarnings: string[] = [];
  for (const doc of csvDocs) {
    for (const profile of doc.profiles) {
      dataQualityWarnings.push(...profile.warnings);
    }
  }
  if (payments.truncated) {
    dataQualityWarnings.push(
      `Payment findings capped at ${MAX_PAYMENT_FINDINGS} rows — review the source spreadsheets directly for the remainder.`
    );
  }
  if (capTable.truncated) {
    dataQualityWarnings.push(
      `Cap table findings capped at ${MAX_CAP_TABLE_FINDINGS} rows — review the source spreadsheets directly for the remainder.`
    );
  }

  const hasOverdue = payments.findings.some((f) => /overdue/i.test(f.status));
  const contractCount = contractDocs.length;
  const csvCount = csvDocs.length;

  const executiveSummary =
    `This data room contains ${allFiles.length} document(s): ${contractCount} contract(s) and ${csvCount} spreadsheet(s). ` +
    (hasOverdue ? 'Overdue payments were detected in payment schedules — immediate attention recommended. ' : '') +
    (capTable.findings.length > 0 ? `Cap table data was extracted with ${capTable.findings.length} investor row(s). ` : '') +
    (crossFindings.length > 0 ? `${crossFindings.length} cross-document finding(s) require review. ` : '') +
    'This summary was generated in mock mode — set OPENAI_API_KEY for AI-powered analysis. This is not legal or financial advice.';

  return {
    title: 'Data Room Review Summary',
    generatedAt: now,
    fileCount: allFiles.length,
    fileTypes: [...extCounts.entries()].map(([ext, count]) => ({ ext, count })),
    documents: allFiles,
    crossDocumentFindings: crossFindings,
    paymentScheduleFindings: payments.findings,
    capTableFindings: capTable.findings,
    dataQualityWarnings: [...new Set(dataQualityWarnings)],
    executiveSummary,
    providerMode: 'mock',
    fallbackUsed: false,
    disclaimer: DISCLAIMER,
  };
}
