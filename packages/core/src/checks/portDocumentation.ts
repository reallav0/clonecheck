import type { ClonecheckCheck, ClonecheckIssue } from "../types.js";
import { detectRepoPorts } from "../detectors/ports.js";
import { createIssue, createResult } from "./helpers.js";

export const portDocumentationCheck: ClonecheckCheck = {
  id: "port-documentation",
  title: "Port documentation",
  description: "Checks whether README localhost ports match likely ports used by the app.",
  async run(context) {
    if (!context.readmeText) {
      return createResult({
        id: this.id,
        title: this.title,
        status: "skip"
      });
    }

    const { codePorts, readmePorts } = await detectRepoPorts(context.repoPath, context.files, context.readmeText);
    const uniqueCodePorts = Array.from(new Set(codePorts.map((entry) => entry.port))).sort((a, b) => a - b);
    const issues: ClonecheckIssue[] = [];

    if (uniqueCodePorts.length === 0) {
      return createResult({
        id: this.id,
        title: this.title,
        issues
      });
    }

    if (readmePorts.length === 0) {
      const first = codePorts[0];
      issues.push(
        createIssue({
          id: "port-documentation.missing-readme-port",
          title: "README does not mention the app port",
          message: `The app appears to use port ${uniqueCodePorts.join(", ")}, but README does not mention a localhost port.`,
          severity: "warning",
          file: first?.file,
          suggestion: `Mention http://localhost:${uniqueCodePorts[0]} in the README quickstart.`
        })
      );
    } else if (!uniqueCodePorts.some((port) => readmePorts.includes(port))) {
      const first = codePorts[0];
      issues.push(
        createIssue({
          id: "port-documentation.mismatch",
          title: "README mentions a different port",
          message: `The app appears to use port ${uniqueCodePorts.join(", ")}, but README mentions ${readmePorts.join(", ")}.`,
          severity: "warning",
          file: first?.file,
          suggestion: `Update README quickstart port from ${readmePorts[0]} to ${uniqueCodePorts[0]}.`
        })
      );
    }

    return createResult({
      id: this.id,
      title: this.title,
      issues
    });
  }
};
