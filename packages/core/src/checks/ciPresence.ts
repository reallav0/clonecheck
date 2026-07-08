import type { ClonecheckCheck } from "../types.js";
import { createIssue, createResult } from "./helpers.js";

export const ciPresenceCheck: ClonecheckCheck = {
  id: "ci-presence",
  title: "CI presence",
  description: "Checks whether the repository has at least one GitHub Actions workflow.",
  async run(context) {
    const workflows = context.files.filter(
      (file) =>
        file.startsWith(".github/workflows/") && (file.endsWith(".yml") || file.endsWith(".yaml"))
    );

    if (workflows.length > 0) {
      return createResult({
        id: this.id,
        title: this.title
      });
    }

    return createResult({
      id: this.id,
      title: this.title,
      issues: [
        createIssue({
          id: "ci-presence.missing",
          title: "CI workflow is missing",
          message: "Repository does not include a GitHub Actions workflow in .github/workflows.",
          severity: "warning",
          suggestion: "Add a CI workflow that installs dependencies, runs tests, and builds the project."
        })
      ]
    });
  }
};
