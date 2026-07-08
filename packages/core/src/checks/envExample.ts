import type { ClonecheckCheck } from "../types.js";
import { detectEnvVarUsages, findMissingEnvVars } from "../detectors/env.js";
import { createIssue, createResult } from "./helpers.js";

export const envExampleCheck: ClonecheckCheck = {
  id: "env-example",
  title: "Environment example",
  description: "Checks whether environment variables used in code are documented in an example env file.",
  async run(context) {
    const usages = await detectEnvVarUsages(context.repoPath, context.files, context.config);
    const missing = findMissingEnvVars(usages, context.envExampleVars);
    const issues = missing.map((name) => {
      const firstUsage = usages.find((usage) => usage.name === name);
      return createIssue({
        id: `env-example.${name}`,
        title: "Environment variable is undocumented",
        message: `Environment variable ${name} is used but missing from .env.example or another env template.`,
        severity: "warning",
        file: firstUsage?.file,
        line: firstUsage?.line,
        suggestion: `Add ${name}= to .env.example.`
      });
    });

    return createResult({
      id: this.id,
      title: this.title,
      issues
    });
  }
};
