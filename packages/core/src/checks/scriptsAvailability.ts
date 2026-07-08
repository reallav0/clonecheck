import type { ClonecheckCheck } from "../types.js";
import { asPackageJson, createIssue, createResult } from "./helpers.js";

export const scriptsAvailabilityCheck: ClonecheckCheck = {
  id: "scripts-availability",
  title: "Scripts availability",
  description: "Checks whether Node projects expose obvious scripts for running, testing, and building.",
  async run(context) {
    if (!context.detectedProjectTypes.includes("node")) {
      return createResult({
        id: this.id,
        title: this.title,
        status: "skip"
      });
    }

    const packageJson = asPackageJson(context.packageJson);
    const scripts = packageJson?.scripts ?? {};
    const hasDev = Boolean(scripts.dev);
    const hasStart = Boolean(scripts.start);
    const hasTest = Boolean(scripts.test);
    const hasBuild = Boolean(scripts.build);
    const hasAnyRunScript = hasDev || hasStart || hasTest || hasBuild;
    const issues = [];

    if (!hasAnyRunScript) {
      issues.push(
        createIssue({
          id: "scripts-availability.no-run-scripts",
          title: "No runnable package scripts",
          message: "package.json does not define dev, start, test, or build scripts.",
          severity: "error",
          file: "package.json",
          suggestion: "Add at least one obvious script such as dev, start, test, or build."
        })
      );
    } else if (!hasDev && !hasStart && !hasBuild) {
      issues.push(
        createIssue({
          id: "scripts-availability.no-app-run-script",
          title: "No app run script",
          message: "package.json has scripts, but no dev, start, or build script tells contributors how to run the app.",
          severity: "warning",
          file: "package.json",
          suggestion: "Add a dev or start script for the main local workflow."
        })
      );
    }

    if (!hasTest) {
      issues.push(
        createIssue({
          id: "scripts-availability.no-test-script",
          title: "No test script",
          message: "package.json does not define a test script.",
          severity: "warning",
          file: "package.json",
          suggestion: "Add a test script, even if it only runs a small smoke test at first."
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
