import type { ClonecheckCheckResult, ClonecheckIssue, ClonecheckReport, Severity } from "./types.js";

const DEFAULT_PENALTIES: Record<Severity, number> = {
  error: 15,
  warning: 7,
  info: 2
};

const STRICT_PENALTIES: Record<Severity, number> = {
  error: 15,
  warning: 10,
  info: 3
};

export function scoreImpactForIssues(issues: ClonecheckIssue[], strict = false): number {
  const penalties = strict ? STRICT_PENALTIES : DEFAULT_PENALTIES;
  return issues.reduce((total, issue) => total + penalties[issue.severity], 0);
}

export function scoreChecks(
  checks: ClonecheckCheckResult[],
  strict = false
): { score: number; checks: ClonecheckCheckResult[] } {
  const scoredChecks = checks.map((check) => ({
    ...check,
    scoreImpact: check.status === "skip" ? 0 : scoreImpactForIssues(check.issues, strict)
  }));
  const totalImpact = scoredChecks.reduce((total, check) => total + check.scoreImpact, 0);
  return {
    score: Math.max(0, 100 - totalImpact),
    checks: scoredChecks
  };
}

export function statusFromScore(score: number): ClonecheckReport["status"] {
  if (score >= 90) {
    return "excellent";
  }
  if (score >= 75) {
    return "good";
  }
  if (score >= 50) {
    return "needs-work";
  }

  return "poor";
}

export function collectSuggestions(checks: ClonecheckCheckResult[]): string[] {
  const suggestions = new Set<string>();
  for (const check of checks) {
    for (const issue of check.issues) {
      if (issue.suggestion) {
        suggestions.add(issue.suggestion);
      }
    }
  }

  return Array.from(suggestions);
}
