import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { DEFAULT_CONFIG, type ClonecheckConfig } from "./types.js";

export const CONFIG_FILENAMES = [
  "clonecheck.config.json",
  ".clonecheckrc",
  ".clonecheckrc.json"
] as const;

const configSchema = z
  .object({
    ignore: z.array(z.string()).default([]),
    ignoreEnvVars: z.array(z.string()).default([]),
    checks: z.record(z.boolean()).default({})
  })
  .strict();

export class ClonecheckConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClonecheckConfigError";
  }
}

export interface LoadedConfig {
  config: ClonecheckConfig;
  configPath?: string;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function findConfigPath(repoPath: string, configPath?: string): Promise<string | undefined> {
  if (configPath) {
    const resolved = path.isAbsolute(configPath) ? configPath : path.join(repoPath, configPath);
    if (!(await fileExists(resolved))) {
      throw new ClonecheckConfigError(`Config file was not found: ${resolved}`);
    }
    return resolved;
  }

  for (const filename of CONFIG_FILENAMES) {
    const candidate = path.join(repoPath, filename);
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export async function loadConfig(repoPath: string, configPath?: string): Promise<LoadedConfig> {
  const foundPath = await findConfigPath(repoPath, configPath);
  if (!foundPath) {
    return { config: { ...DEFAULT_CONFIG } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(foundPath, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ClonecheckConfigError(`Could not parse clonecheck config at ${foundPath}: ${detail}`);
  }

  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const key = issue.path.length > 0 ? issue.path.join(".") : "config";
      return `${key}: ${issue.message}`;
    });
    throw new ClonecheckConfigError(
      `Invalid clonecheck config at ${foundPath}:\n${issues.map((issue) => `- ${issue}`).join("\n")}`
    );
  }

  return { config: result.data, configPath: foundPath };
}

export async function initConfig(repoPath: string, force = false): Promise<{ path: string; created: boolean }> {
  const target = path.join(repoPath, "clonecheck.config.json");
  if (!force && (await fileExists(target))) {
    return { path: target, created: false };
  }

  await writeFile(`${target}`, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, "utf8");
  return { path: target, created: true };
}
