import pc from "picocolors";
import type { CheckStatus, ClonecheckCheckResult, ClonecheckReport } from "../types.js";
import { reportStatusLabel, statusSymbol } from "./labels.js";

export interface TextReporterOptions {
  color?: boolean;
}

function colorizeStatus(status: CheckStatus, text: string, useColor: boolean): string {
  if (!useColor) {
    return text;
  }

  switch (status) {
    case "pass":
      return pc.green(text);
    case "warning":
      return pc.yellow(text);
    case "fail":
      return pc.red(text);
    case "skip":
      return pc.dim(text);
  }
}

function defaultPassMessage(check: ClonecheckCheckResult, report: ClonecheckReport): string {
  if (check.status === "skip") {
    return "not applicable for this repository";
  }

  switch (check.id) {
    case "package-manager-consistency":
      return report.metadata.detectedPackageManager
        ? `package manager is consistent: ${report.metadata.detectedPackageManager}`
        : "no package manager mismatch found";
    case "scripts-availability":
      return "package scripts include an obvious local workflow";
    case "env-example":
      return "environment variables used in code are documented";
    case "readme-commands":
      return "README setup commands look consistent";
    case "port-documentation":
      return "README port documentation looks consistent";
    case "docker-compose-env":
      return "Docker Compose environment variables are documented";
    case "project-files":
      return "core project files are present";
    case "ci-presence":
      return "found at least one GitHub Actions workflow";
    default:
      return "no issues found";
  }
}

function formatIssueLocation(file?: string, line?: number): string {
  if (!file) {
    return "";
  }

  return line ? ` (${file}:${line})` : ` (${file})`;
}

function formatCheck(check: ClonecheckCheckResult, report: ClonecheckReport, useColor: boolean): string[] {
  const symbol = statusSymbol(check.status);
  const label = colorizeStatus(check.status, check.id, useColor);
  const lines = [`  ${symbol} ${label}`];

  if (check.issues.length === 0) {
    lines.push(`     ${defaultPassMessage(check, report)}`);
    return lines;
  }

  for (const issue of check.issues) {
    const location = formatIssueLocation(issue.file, issue.line);
    lines.push(`     ${issue.message}${location}`);
  }

  return lines;
}

export function formatTextReport(report: ClonecheckReport, options: TextReporterOptions = {}): string {
  const useColor = options.color ?? Boolean(process.stdout.isTTY && !process.env.NO_COLOR);
  const lines = [
    `clonecheck v${report.metadata.clonecheckVersion}`,
    "",
    `Repository: ${report.projectName}`,
    `Path: ${report.repoPath}`,
    "",
    `Score: ${report.score}/100`,
    `Status: ${reportStatusLabel(report.status)}`,
    "",
    "Checks:"
  ];

  for (const check of report.checks) {
    lines.push(...formatCheck(check, report, useColor), "");
  }

  if (report.suggestions.length > 0) {
    lines.push("Suggestions:");
    report.suggestions.forEach((suggestion, index) => {
      lines.push(`  ${index + 1}. ${suggestion}`);
    });
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
