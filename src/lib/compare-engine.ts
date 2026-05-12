import type { IssueLog, Issue, IssueChange, PaymentChange, CapTableChange, CompareReport } from '../schemas/issue.schema';
import type { DataRoomSummary } from '../schemas/spreadsheet.schema';
import { CompareReportSchema } from '../schemas/issue.schema';

const DISCLAIMER =
  'Synth is not legal advice or financial advice. It is a document review aid. Consult a qualified professional before making decisions.';

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

export function compareIssueLogs(
  logA: IssueLog,
  logB: IssueLog,
): Pick<CompareReport, 'addedIssues' | 'removedIssues' | 'changedIssues'> {
  const mapA = new Map<string, Issue>();
  const mapB = new Map<string, Issue>();
  for (const i of logA.issues) mapA.set(norm(i.title), i);
  for (const i of logB.issues) mapB.set(norm(i.title), i);

  const addedIssues: Issue[] = [];
  const removedIssues: Issue[] = [];
  const changedIssues: IssueChange[] = [];

  for (const [key, iB] of mapB) {
    if (!mapA.has(key)) {
      addedIssues.push(iB);
    } else {
      const iA = mapA.get(key)!;
      if (iA.severity !== iB.severity) {
        changedIssues.push({ issueId: iB.id, title: iB.title, field: 'severity', from: iA.severity, to: iB.severity });
      }
      if (iA.status !== iB.status) {
        changedIssues.push({ issueId: iB.id, title: iB.title, field: 'status', from: iA.status, to: iB.status });
      }
      if (iA.category !== iB.category) {
        changedIssues.push({ issueId: iB.id, title: iB.title, field: 'category', from: iA.category, to: iB.category });
      }
    }
  }

  for (const [key, iA] of mapA) {
    if (!mapB.has(key)) removedIssues.push(iA);
  }

  return { addedIssues, removedIssues, changedIssues };
}

export function compareDataRooms(
  roomA: DataRoomSummary,
  roomB: DataRoomSummary,
): Omit<CompareReport, 'reportId' | 'generatedAt' | 'sourceA' | 'sourceB' | 'addedIssues' | 'removedIssues' | 'changedIssues' | 'disclaimer'> {
  const paymentChanges: PaymentChange[] = [];
  const capTableChanges: CapTableChange[] = [];

  const payMapA = new Map(roomA.paymentScheduleFindings.map((p) => [p.vendor.toLowerCase(), p]));
  const payMapB = new Map(roomB.paymentScheduleFindings.map((p) => [p.vendor.toLowerCase(), p]));

  for (const [key, pB] of payMapB) {
    const pA = payMapA.get(key);
    if (!pA) {
      paymentChanges.push({ vendor: pB.vendor, amountA: '—', amountB: pB.amount, statusA: '—', statusB: pB.status, change: 'added' });
    } else if (pA.amount !== pB.amount || pA.status !== pB.status) {
      paymentChanges.push({ vendor: pB.vendor, amountA: pA.amount, amountB: pB.amount, statusA: pA.status, statusB: pB.status, change: 'changed' });
    }
  }
  for (const [key, pA] of payMapA) {
    if (!payMapB.has(key)) {
      paymentChanges.push({ vendor: pA.vendor, amountA: pA.amount, amountB: '—', statusA: pA.status, statusB: '—', change: 'removed' });
    }
  }

  const capMapA = new Map(roomA.capTableFindings.map((c) => [c.investor.toLowerCase(), c]));
  const capMapB = new Map(roomB.capTableFindings.map((c) => [c.investor.toLowerCase(), c]));

  for (const [key, cB] of capMapB) {
    if (!capMapA.has(key)) {
      capTableChanges.push({ investor: cB.investor, changeType: 'added', detail: `Added: ${cB.shares} shares (${cB.ownershipPct})` });
    } else {
      const cA = capMapA.get(key)!;
      if (cA.ownershipPct !== cB.ownershipPct || cA.shares !== cB.shares) {
        capTableChanges.push({
          investor: cB.investor,
          changeType: 'changed',
          detail: `Shares: ${cA.shares} → ${cB.shares}, Ownership: ${cA.ownershipPct} → ${cB.ownershipPct}`,
        });
      }
    }
  }
  for (const [key, cA] of capMapA) {
    if (!capMapB.has(key)) {
      capTableChanges.push({ investor: cA.investor, changeType: 'removed', detail: `Removed: was ${cA.shares} shares (${cA.ownershipPct})` });
    }
  }

  const warnSetA = new Set(roomA.dataQualityWarnings.map((w) => w.toLowerCase()));
  const warnSetB = new Set(roomB.dataQualityWarnings.map((w) => w.toLowerCase()));
  const newWarnings = roomB.dataQualityWarnings.filter((w) => !warnSetA.has(w.toLowerCase()));
  const resolvedWarnings = roomA.dataQualityWarnings.filter((w) => !warnSetB.has(w.toLowerCase()));

  return {
    paymentChanges,
    capTableChanges,
    newWarnings,
    resolvedWarnings,
    riskScoreA: undefined,
    riskScoreB: undefined,
    riskScoreChange: undefined,
  };
}

export function buildCompareReport(
  sourceA: string,
  sourceB: string,
  logA: IssueLog | null,
  logB: IssueLog | null,
  roomA: DataRoomSummary,
  roomB: DataRoomSummary,
): CompareReport {
  const now = new Date().toISOString();
  const ts = now.replace(/[:.]/g, '-').slice(0, 19);

  const issueChanges =
    logA && logB
      ? compareIssueLogs(logA, logB)
      : { addedIssues: [], removedIssues: [], changedIssues: [] };

  const roomChanges = compareDataRooms(roomA, roomB);

  return CompareReportSchema.parse({
    reportId: `compare-${ts}`,
    generatedAt: now,
    sourceA,
    sourceB,
    ...issueChanges,
    ...roomChanges,
    disclaimer: DISCLAIMER,
  });
}
