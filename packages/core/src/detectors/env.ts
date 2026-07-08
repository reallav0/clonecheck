import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ClonecheckConfig } from "../types.js";
import { absolutePath, isLikelyTextFile, lineNumberFromIndex, readTextFile } from "../utils/files.js";

export const ENV_EXAMPLE_FILES = [".env.example", ".env.sample", ".env.template", "example.env"];

export const DEFAULT_IGNORE_ENV_VARS = new Set(["NODE_ENV", "PATH", "HOME", "PWD", "CI", "PORT"]);

const ENV_SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".go",
  ".js",
  ".jsx",
  ".mjs",
  ".py",
  ".rs",
  ".ts",
  ".tsx"
]);

export interface EnvVarUsage {
  name: string;
  file: string;
  line: number;
}

const ENV_PATTERNS = [
  /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
  /process\.env\[['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\]/g,
  /import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
  /os\.environ\[['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\]/g,
  /os\.getenv\(['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\)/g,
  /os\.Getenv\(['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\)/g,
  /std::env::var\(['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\)/g
];

function isEnvSourceFile(file: string): boolean {
  if (!isLikelyTextFile(file)) {
    return false;
  }

  return ENV_SOURCE_EXTENSIONS.has(path.extname(file));
}

export function parseEnvExampleVars(text: string | undefined): Set<string> {
  const vars = new Set<string>();
  if (!text) {
    return vars;
  }

  const regex = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    if (name) {
      vars.add(name);
    }
  }

  return vars;
}

export function extractEnvVarUsages(text: string, file: string): EnvVarUsage[] {
  const usages: EnvVarUsage[] = [];

  for (const pattern of ENV_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (!name) {
        continue;
      }

      usages.push({
        name,
        file,
        line: lineNumberFromIndex(text, match.index)
      });
    }
  }

  return usages;
}

export async function detectEnvVarUsages(
  repoPath: string,
  files: string[],
  config: ClonecheckConfig
): Promise<EnvVarUsage[]> {
  const ignored = new Set([...DEFAULT_IGNORE_ENV_VARS, ...config.ignoreEnvVars]);
  const usages: EnvVarUsage[] = [];

  for (const file of files) {
    if (!isEnvSourceFile(file)) {
      continue;
    }

    const text = await readTextFile(repoPath, file);
    if (!text) {
      continue;
    }

    for (const usage of extractEnvVarUsages(text, file)) {
      if (!ignored.has(usage.name)) {
        usages.push(usage);
      }
    }
  }

  return usages;
}

export async function loadEnvExampleFiles(
  repoPath: string,
  files: string[]
): Promise<{ text?: string; vars: Set<string>; files: string[] }> {
  const foundFiles = ENV_EXAMPLE_FILES.filter((file) => files.includes(file));
  const vars = new Set<string>();
  let firstText: string | undefined;

  for (const file of foundFiles) {
    const text = await readTextFile(repoPath, file);
    if (text === undefined) {
      continue;
    }
    firstText ??= text;
    for (const name of parseEnvExampleVars(text)) {
      vars.add(name);
    }
  }

  return { text: firstText, vars, files: foundFiles };
}

export function findMissingEnvVars(usages: EnvVarUsage[], documentedVars: Set<string>): string[] {
  const used = new Set(usages.map((usage) => usage.name));
  return Array.from(used)
    .filter((name) => !documentedVars.has(name))
    .sort((a, b) => a.localeCompare(b));
}

export interface GenerateEnvExampleOptions {
  repoPath: string;
  files: string[];
  config: ClonecheckConfig;
  write?: boolean;
}

export interface GenerateEnvExampleResult {
  content: string;
  missingVars: string[];
  writtenPath?: string;
}

function appendEnvLines(existing: string, missingVars: string[]): string {
  const prefix = existing.length > 0 && !existing.endsWith("\n") ? `${existing}\n` : existing;
  const needsSpacer = prefix.trim().length > 0 && missingVars.length > 0 ? "\n" : "";
  return `${prefix}${needsSpacer}${missingVars.map((name) => `${name}=`).join("\n")}${missingVars.length > 0 ? "\n" : ""}`;
}

export async function generateEnvExample(
  options: GenerateEnvExampleOptions
): Promise<GenerateEnvExampleResult> {
  const envExamples = await loadEnvExampleFiles(options.repoPath, options.files);
  const usages = await detectEnvVarUsages(options.repoPath, options.files, options.config);
  const missingVars = findMissingEnvVars(usages, envExamples.vars);
  const target = absolutePath(options.repoPath, ".env.example");

  let existing = "";
  try {
    existing = await readFile(target, "utf8");
  } catch {
    existing = "";
  }

  const content = appendEnvLines(existing, missingVars);

  if (options.write) {
    await writeFile(target, content, "utf8");
  }

  return {
    content,
    missingVars,
    writtenPath: options.write ? target : undefined
  };
}
