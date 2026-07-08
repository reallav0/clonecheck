import type { ClonecheckCheck } from "../types.js";
import { DEFAULT_IGNORE_ENV_VARS } from "../detectors/env.js";
import { COMPOSE_FILES, detectDockerComposeEnvVars } from "../detectors/dockerCompose.js";
import { createIssue, createResult } from "./helpers.js";

export const dockerComposeEnvCheck: ClonecheckCheck = {
  id: "docker-compose-env",
  title: "Docker Compose environment",
  description: "Checks whether Docker Compose variable references are documented in env examples.",
  async run(context) {
    const hasCompose = context.files.some((file) => COMPOSE_FILES.includes(file));
    if (!hasCompose) {
      return createResult({
        id: this.id,
        title: this.title,
        status: "skip"
      });
    }

    const ignored = new Set([...DEFAULT_IGNORE_ENV_VARS, ...context.config.ignoreEnvVars]);
    const scan = await detectDockerComposeEnvVars(context.repoPath, context.files);
    const issues = scan.parseErrors.map((error) =>
      createIssue({
        id: `docker-compose-env.parse.${error.file}`,
        title: "Docker Compose file could not be parsed",
        message: `${error.file} could not be parsed as YAML: ${error.message}`,
        severity: "warning",
        file: error.file,
        suggestion: "Fix the Docker Compose YAML syntax."
      })
    );

    const uniqueMissing = Array.from(
      new Set(
        scan.refs
          .map((ref) => ref.name)
          .filter((name) => !ignored.has(name) && !context.envExampleVars.has(name))
      )
    ).sort((a, b) => a.localeCompare(b));

    for (const name of uniqueMissing) {
      const ref = scan.refs.find((entry) => entry.name === name);
      issues.push(
        createIssue({
          id: `docker-compose-env.${name}`,
          title: "Docker Compose variable is undocumented",
          message: `Docker Compose references ${name}, but it is not documented in an env example file.`,
          severity: "warning",
          file: ref?.file,
          suggestion: `Add ${name}= to .env.example.`
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
