import type {
  CheckStatus,
  ClonecheckCheckResult,
  ClonecheckIssue,
  PackageJson,
  Severity
} from "../types.js";

export function statusFromIssues(issues: ClonecheckIssue[]): CheckStatus {
  if (issues.some((issue) => issue.severity === "error")) {
    return "fail";
  }
  if (issues.some((issue) => issue.severity === "warning")) {
    return "warning";
  }

  return "pass";
}

export function createIssue(input: {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  file?: string;
  line?: number;
  suggestion?: string;
}): ClonecheckIssue {
  return input;
}

export function createResult(input: {
  id: string;
  title: string;
  issues?: ClonecheckIssue[];
  status?: CheckStatus;
}): ClonecheckCheckResult {
  const issues = input.issues ?? [];
  return {
    id: input.id,
    title: input.title,
    status: input.status ?? statusFromIssues(issues),
    issues,
    scoreImpact: 0
  };
}

export function asPackageJson(value: unknown): PackageJson | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return value as PackageJson;
}
