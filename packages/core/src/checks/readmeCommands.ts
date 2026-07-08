import type { ClonecheckCheck } from "../types.js";
import {
  extractReadmeCommands,
  readmeMentionsRunCommand,
  readmeMentionsSetupCommand
} from "../detectors/readme.js";
import { asPackageJson, createIssue, createResult } from "./helpers.js";

export const readmeCommandsCheck: ClonecheckCheck = {
  id: "readme-commands",
  title: "README commands",
  description: "Checks whether README setup and run commands are present and aligned with the repo.",
  async run(context) {
    if (!context.readmeText) {
      return createResult({
        id: this.id,
        title: this.title,
        status: "skip"
      });
    }

    const commands = extractReadmeCommands(context.readmeText);
    const issues = [];

    if (!readmeMentionsSetupCommand(commands)) {
      issues.push(
        createIssue({
          id: "readme-commands.no-setup-command",
          title: "README has no setup command",
          message: "README does not include an obvious install or docker compose setup command.",
          severity: "warning",
          file: "README.md",
          suggestion: "Add a quickstart command such as pnpm install or docker compose up."
        })
      );
    }

    if (context.detectedPackageManager) {
      const mismatchedManagers = Array.from(
        new Set(
          commands
            .map((command) => command.packageManager)
            .filter((manager) => manager && manager !== context.detectedPackageManager)
        )
      );

      for (const manager of mismatchedManagers) {
        if (!manager) {
          continue;
        }
        issues.push(
          createIssue({
            id: `readme-commands.${manager}`,
            title: "README command conflicts with lockfile",
            message: `README uses ${manager} commands, but the detected package manager is ${context.detectedPackageManager}.`,
            severity: "warning",
            file: "README.md",
            suggestion: `Update README commands to use ${context.detectedPackageManager}.`
          })
        );
      }
    }

    const scripts = asPackageJson(context.packageJson)?.scripts ?? {};
    const hasRunScript = Boolean(scripts.dev || scripts.start);
    if (hasRunScript && !readmeMentionsRunCommand(commands)) {
      issues.push(
        createIssue({
          id: "readme-commands.no-run-command",
          title: "README does not show how to run the app",
          message: "package.json has a dev or start script, but README does not include a matching run command.",
          severity: "warning",
          file: "README.md",
          suggestion: "Add a README quickstart step for running the app locally."
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
