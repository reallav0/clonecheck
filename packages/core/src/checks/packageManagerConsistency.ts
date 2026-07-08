import type { ClonecheckCheck } from "../types.js";
import { detectPackageManager } from "../detectors/packageManager.js";
import { extractReadmeCommands } from "../detectors/readme.js";
import { createIssue, createResult, asPackageJson } from "./helpers.js";

export const packageManagerConsistencyCheck: ClonecheckCheck = {
  id: "package-manager-consistency",
  title: "Package manager consistency",
  description: "Checks whether README package-manager commands match the detected lockfile.",
  async run(context) {
    const detection = detectPackageManager(context.files, asPackageJson(context.packageJson));
    const issues = [];

    if (!detection.manager) {
      return createResult({
        id: this.id,
        title: this.title,
        status: "skip"
      });
    }

    if (detection.managers.length > 1) {
      issues.push(
        createIssue({
          id: "package-manager-consistency.multiple-lockfiles",
          title: "Multiple package managers detected",
          message: `Multiple package-manager lockfiles were found: ${detection.lockfiles.join(", ")}.`,
          severity: "warning",
          suggestion: "Keep only the lockfile for the package manager contributors should use."
        })
      );
    }

    const commands = context.readmeText ? extractReadmeCommands(context.readmeText) : [];
    const mismatches = commands.filter(
      (command) => command.packageManager && command.packageManager !== detection.manager
    );

    const seen = new Set<string>();
    for (const mismatch of mismatches) {
      if (!mismatch.packageManager || seen.has(mismatch.packageManager)) {
        continue;
      }
      seen.add(mismatch.packageManager);
      issues.push(
        createIssue({
          id: `package-manager-consistency.${mismatch.packageManager}`,
          title: "README uses a different package manager",
          message: `README uses ${mismatch.packageManager} commands, but the repository appears to use ${detection.manager}.`,
          severity: "warning",
          suggestion: `Replace ${mismatch.packageManager} commands in README with ${detection.manager} equivalents.`
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
