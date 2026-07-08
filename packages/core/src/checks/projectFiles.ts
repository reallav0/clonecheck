import type { ClonecheckCheck } from "../types.js";
import { findReadmeFile } from "../detectors/readme.js";
import { findAnyCaseInsensitive } from "../utils/files.js";
import { createIssue, createResult } from "./helpers.js";

export const projectFilesCheck: ClonecheckCheck = {
  id: "project-files",
  title: "Project files",
  description: "Checks for README, contributing, license, and gitignore files.",
  async run(context) {
    const issues = [];

    if (!findReadmeFile(context.files)) {
      issues.push(
        createIssue({
          id: "project-files.readme",
          title: "README is missing",
          message: "Repository does not include a README.md file.",
          severity: "error",
          suggestion: "Add a README with setup, run, and contribution instructions."
        })
      );
    }

    if (!context.files.includes(".gitignore")) {
      issues.push(
        createIssue({
          id: "project-files.gitignore",
          title: ".gitignore is missing",
          message: "Repository does not include a .gitignore file.",
          severity: "warning",
          suggestion: "Add a .gitignore for generated files and local secrets."
        })
      );
    }

    if (context.config.checks.contributing !== false) {
      const contributing = findAnyCaseInsensitive(context.files, [
        "CONTRIBUTING.md",
        ".github/CONTRIBUTING.md",
        "docs/CONTRIBUTING.md"
      ]);
      if (!contributing) {
        issues.push(
          createIssue({
            id: "project-files.contributing",
            title: "Contributing guide is missing",
            message: "Repository does not include a CONTRIBUTING.md file.",
            severity: "info",
            suggestion: "Add CONTRIBUTING.md with local setup and pull request guidance."
          })
        );
      }
    }

    if (context.config.checks.license !== false) {
      const license = findAnyCaseInsensitive(context.files, ["LICENSE", "LICENSE.md", "COPYING"]);
      if (!license) {
        issues.push(
          createIssue({
            id: "project-files.license",
            title: "License is missing",
            message: "Repository does not include a license file.",
            severity: "info",
            suggestion: "Add a LICENSE file so contributors know how the project can be used."
          })
        );
      }
    }

    return createResult({
      id: this.id,
      title: this.title,
      issues
    });
  }
};
