import type { Risk } from '../schemas/review.schema';

const SEVERITY_WEIGHTS = {
  Critical: 25,
  High: 15,
  Medium: 8,
  Low: 3,
} as const;

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

const LEVEL_ORDER: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical'];

// Score bands must stay in sync with the guidance in contract-review.prompt.ts:
// 0-30 Low, 31-60 Medium, 61-80 High, 81-100 Critical.
const BAND_FLOOR: Record<RiskLevel, number> = { Low: 0, Medium: 31, High: 61, Critical: 81 };

export function calculateRiskScore(risks: Risk[]): number {
  if (risks.length === 0) return 0;
  const rawScore = risks.reduce((sum, r) => sum + (SEVERITY_WEIGHTS[r.severity] ?? 0), 0);
  return Math.min(100, rawScore);
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 81) return 'Critical';
  if (score >= 61) return 'High';
  if (score >= 31) return 'Medium';
  return 'Low';
}

function maxLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return LEVEL_ORDER[Math.max(LEVEL_ORDER.indexOf(a), LEVEL_ORDER.indexOf(b))];
}

function maxSeverity(risks: Risk[]): RiskLevel {
  return risks.reduce<RiskLevel>((acc, r) => maxLevel(acc, r.severity), 'Low');
}

// The overall level can never sit below the worst individual risk: a document
// with one Critical finding is not "Low risk" no matter what the sum says.
export function deriveRiskLevel(risks: Risk[], score: number): RiskLevel {
  return maxLevel(scoreToLevel(score), maxSeverity(risks));
}

export interface ReconciledRisk {
  riskScore: number;
  riskLevel: RiskLevel;
  adjustments: string[];
}

// Reconcile a claimed score/level pair (from an AI response) with the risks it
// reports. Levels only move up, never down, and the score is lifted to the
// floor of the final level's band so the pair stays self-consistent.
export function reconcileRisk(claimedScore: number, claimedLevel: RiskLevel, risks: Risk[]): ReconciledRisk {
  const adjustments: string[] = [];
  const level = maxLevel(claimedLevel, deriveRiskLevel(risks, claimedScore));
  if (level !== claimedLevel) {
    adjustments.push(
      `riskLevel adjusted from "${claimedLevel}" to "${level}" to stay consistent with the reported risk severities.`
    );
  }
  const score = Math.max(claimedScore, BAND_FLOOR[level]);
  if (score !== claimedScore) {
    adjustments.push(`riskScore adjusted from ${claimedScore} to ${score} to match the "${level}" band.`);
  }
  return { riskScore: score, riskLevel: level, adjustments };
}

