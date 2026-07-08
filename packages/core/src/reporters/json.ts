import type { ClonecheckReport } from "../types.js";

export function formatJsonReport(report: ClonecheckReport): string {
  return JSON.stringify(report, null, 2);
}
