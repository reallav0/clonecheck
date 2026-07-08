import type { ClonecheckIssue, ClonecheckReport } from "../types.js";
import { checkStatusLabel, reportStatusLabel, statusSymbol } from "./labels.js";

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function formatIssue(issue: ClonecheckIssue): string {
  const location = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ""})` : "";
  return `- **${issue.title}**${location}: ${issue.message}`;
}

export function formatMarkdownReport(report: ClonecheckReport): string {
  const lines: string[] = [
    "# Clonecheck Report",
    "",
    `Score: ${report.score}/100  `,
    `Status: ${reportStatusLabel(report.status)}`,
    "",
    "## Summary",
    "",
    "| Check | Status | Issues |",
    "|---|---:|---:|"
  ];

  for (const check of report.checks) {
    lines.push(
      `| ${escapeTableCell(check.id)} | ${statusSymbol(check.status)} ${checkStatusLabel(check.status)} | ${check.issues.length} |`
    );
  }

  const checksWithIssues = report.checks.filter((check) => check.issues.length > 0);
  if (checksWithIssues.length > 0) {
    lines.push("", "## Issues", "");
    for (const check of checksWithIssues) {
      lines.push(`### ${check.id}`, "");
      for (const issue of check.issues) {
        lines.push(formatIssue(issue));
      }
      lines.push("");
    }
  }

  if (report.suggestions.length > 0) {
    lines.push("## Suggestions", "");
    report.suggestions.forEach((suggestion, index) => {
      lines.push(`${index + 1}. ${suggestion}`);
    });
    lines.push("");
  }

  lines.push(
    "## Metadata",
    "",
    `- Repository: \`${report.projectName}\``,
    `- Path: \`${report.repoPath}\``,
    `- Project types: ${report.metadata.detectedProjectTypes.join(", ") || "unknown"}`,
    `- Package manager: ${report.metadata.detectedPackageManager ?? "unknown"}`,
    `- Generated at: ${report.metadata.generatedAt}`
  );

  return `${lines.join("\n").trimEnd()}\n`;
}
