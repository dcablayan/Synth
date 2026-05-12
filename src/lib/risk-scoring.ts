import type { Risk } from '../schemas/review.schema';

const SEVERITY_WEIGHTS = {
  Critical: 25,
  High: 15,
  Medium: 8,
  Low: 3,
} as const;

export function calculateRiskScore(risks: Risk[]): number {
  if (risks.length === 0) return 0;
  const rawScore = risks.reduce((sum, r) => sum + (SEVERITY_WEIGHTS[r.severity] ?? 0), 0);
  return Math.min(100, rawScore);
}

export function scoreToLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 81) return 'Critical';
  if (score >= 61) return 'High';
  if (score >= 31) return 'Medium';
  return 'Low';
}

export function getRiskBadgeColor(level: string): string {
  switch (level) {
    case 'Critical':
      return '#dc2626';
    case 'High':
      return '#ea580c';
    case 'Medium':
      return '#d97706';
    case 'Low':
      return '#16a34a';
    default:
      return '#6b7280';
  }
}
