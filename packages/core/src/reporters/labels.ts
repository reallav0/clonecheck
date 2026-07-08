import type { CheckStatus, ClonecheckReport } from "../types.js";

export function statusSymbol(status: CheckStatus): string {
  switch (status) {
    case "pass":
      return "✅";
    case "warning":
      return "⚠️";
    case "fail":
      return "❌";
    case "skip":
      return "⏭️";
  }
}

export function checkStatusLabel(status: CheckStatus): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "warning":
      return "Warning";
    case "fail":
      return "Fail";
    case "skip":
      return "Skip";
  }
}

export function reportStatusLabel(status: ClonecheckReport["status"]): string {
  switch (status) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "needs-work":
      return "Needs work";
    case "poor":
      return "Poor";
  }
}
