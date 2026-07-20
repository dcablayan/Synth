import type { IssueLog, Issue, IssueChange, PaymentChange, CapTableChange, CompareReport } from '../schemas/issue.schema';
import type { DataRoomSummary } from '../schemas/spreadsheet.schema';
import { CompareReportSchema } from '../schemas/issue.schema';
import { DISCLAIMER } from './brand';


const SEV_ORDER: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

// Group-by that keeps EVERY item — a plain Map keyed by title/vendor silently
// collapses duplicates (multiple invoices for one vendor, same-titled issues
// across documents) and then reports changes that never happened.
function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = groups.get(k);
    if (list) list.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

function unionKeys<T>(a: Map<string, T>, b: Map<string, T>): Set<string> {
  return new Set([...a.keys(), ...b.keys()]);
}

// Two-pass matching within a group: items identical on the compared fields pair
// off first (no change), then the leftovers pair by rank and report field diffs,
// and any surplus is added/removed. Pairing greedily by sort order alone would
// report a change like "Critical → High" even when an exact High↔High match
// existed in the same group.
function matchGroup<T>(
  listA: T[],
  listB: T[],
  signature: (item: T) => string,
  rank: (item: T) => number,
): { pairs: Array<[T, T]>; extraA: T[]; extraB: T[] } {
  const bBySig = new Map<string, T[]>();
  for (const b of listB) {
    const sig = signature(b);
    const bucket = bBySig.get(sig);
    if (bucket) bucket.push(b);
    else bBySig.set(sig, [b]);
  }

  const unmatchedA: T[] = [];
  const pairs: Array<[T, T]> = [];
  for (const a of listA) {
    const bucket = bBySig.get(signature(a));
    if (bucket && bucket.length > 0) {
      pairs.push([a, bucket.shift()!]);
    } else {
      unmatchedA.push(a);
    }
  }
  const unmatchedB = [...bBySig.values()].flat();

  unmatchedA.sort((x, y) => rank(y) - rank(x));
  unmatchedB.sort((x, y) => rank(y) - rank(x));
  const paired = Math.min(unmatchedA.length, unmatchedB.length);
  for (let i = 0; i < paired; i++) pairs.push([unmatchedA[i], unmatchedB[i]]);

  return { pairs, extraA: unmatchedA.slice(paired), extraB: unmatchedB.slice(paired) };
}

export function compareIssueLogs(
  logA: IssueLog,
  logB: IssueLog,
): Pick<CompareReport, 'addedIssues' | 'removedIssues' | 'changedIssues'> {
  const groupsA = groupBy(logA.issues, (i) => norm(i.title));
  const groupsB = groupBy(logB.issues, (i) => norm(i.title));

  const addedIssues: Issue[] = [];
  const removedIssues: Issue[] = [];
  const changedIssues: IssueChange[] = [];

  for (const key of unionKeys(groupsA, groupsB)) {
    const { pairs, extraA, extraB } = matchGroup(
      groupsA.get(key) ?? [],
      groupsB.get(key) ?? [],
      (i) => `${i.severity}|${i.status}|${i.category}`,
      (i) => SEV_ORDER[i.severity] ?? 0,
    );

    for (const [iA, iB] of pairs) {
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
    addedIssues.push(...extraB);
    removedIssues.push(...extraA);
  }

  return { addedIssues, removedIssues, changedIssues };
}

export function compareDataRooms(
  roomA: DataRoomSummary,
  roomB: DataRoomSummary,
): Omit<CompareReport, 'reportId' | 'generatedAt' | 'sourceA' | 'sourceB' | 'addedIssues' | 'removedIssues' | 'changedIssues' | 'disclaimer'> {
  const paymentChanges: PaymentChange[] = [];
  const capTableChanges: CapTableChange[] = [];

  // Key payments by vendor + due date so multi-invoice vendors keep one entry
  // per invoice instead of collapsing to whichever row parsed last.
  const payKey = (p: DataRoomSummary['paymentScheduleFindings'][0]) =>
    `${p.vendor.toLowerCase()}|${p.dueDate.toLowerCase()}`;
  const payGroupsA = groupBy(roomA.paymentScheduleFindings, payKey);
  const payGroupsB = groupBy(roomB.paymentScheduleFindings, payKey);

  for (const key of unionKeys(payGroupsA, payGroupsB)) {
    const { pairs, extraA, extraB } = matchGroup(
      payGroupsA.get(key) ?? [],
      payGroupsB.get(key) ?? [],
      (p) => `${p.amount}|${p.status}`,
      () => 0,
    );

    for (const [pA, pB] of pairs) {
      if (pA.amount !== pB.amount || pA.status !== pB.status) {
        paymentChanges.push({ vendor: pB.vendor, amountA: pA.amount, amountB: pB.amount, statusA: pA.status, statusB: pB.status, change: 'changed' });
      }
    }
    for (const pB of extraB) {
      paymentChanges.push({ vendor: pB.vendor, amountA: '—', amountB: pB.amount, statusA: '—', statusB: pB.status, change: 'added' });
    }
    for (const pA of extraA) {
      paymentChanges.push({ vendor: pA.vendor, amountA: pA.amount, amountB: '—', statusA: pA.status, statusB: '—', change: 'removed' });
    }
  }

  // Key cap table rows by investor + share class: one investor can legitimately
  // hold multiple classes (Common + Preferred).
  const capKey = (c: DataRoomSummary['capTableFindings'][0]) =>
    `${c.investor.toLowerCase()}|${c.shareClass.toLowerCase()}`;
  const capGroupsA = groupBy(roomA.capTableFindings, capKey);
  const capGroupsB = groupBy(roomB.capTableFindings, capKey);

  for (const key of unionKeys(capGroupsA, capGroupsB)) {
    const { pairs, extraA, extraB } = matchGroup(
      capGroupsA.get(key) ?? [],
      capGroupsB.get(key) ?? [],
      (c) => `${c.shares}|${c.ownershipPct}`,
      () => 0,
    );

    for (const [cA, cB] of pairs) {
      if (cA.ownershipPct !== cB.ownershipPct || cA.shares !== cB.shares) {
        capTableChanges.push({
          investor: cB.investor,
          changeType: 'changed',
          detail: `Shares: ${cA.shares} → ${cB.shares}, Ownership: ${cA.ownershipPct} → ${cB.ownershipPct}`,
        });
      }
    }
    for (const cB of extraB) {
      capTableChanges.push({ investor: cB.investor, changeType: 'added', detail: `Added: ${cB.shares} shares (${cB.ownershipPct})` });
    }
    for (const cA of extraA) {
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
