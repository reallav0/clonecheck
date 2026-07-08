import yaml from "js-yaml";
import { readTextFile } from "../utils/files.js";

export const COMPOSE_FILES = [
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
  "compose.yaml"
];

export interface DockerComposeEnvReference {
  name: string;
  file: string;
}

export interface DockerComposeScanResult {
  refs: DockerComposeEnvReference[];
  parseErrors: Array<{ file: string; message: string }>;
}

export function extractDockerComposeEnvVars(text: string, file: string): DockerComposeEnvReference[] {
  const refs: DockerComposeEnvReference[] = [];
  const regex = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-[^}]*)?\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    if (name) {
      refs.push({ name, file });
    }
  }

  return refs;
}

export async function detectDockerComposeEnvVars(
  repoPath: string,
  files: string[]
): Promise<DockerComposeScanResult> {
  const refs: DockerComposeEnvReference[] = [];
  const parseErrors: Array<{ file: string; message: string }> = [];

  for (const file of files.filter((candidate) => COMPOSE_FILES.includes(candidate))) {
    const text = await readTextFile(repoPath, file);
    if (!text) {
      continue;
    }

    try {
      yaml.load(text);
    } catch (error) {
      parseErrors.push({
        file,
        message: error instanceof Error ? error.message : String(error)
      });
    }

    refs.push(...extractDockerComposeEnvVars(text, file));
  }

  return { refs, parseErrors };
}
