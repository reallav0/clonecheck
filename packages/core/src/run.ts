import { stat } from "node:fs/promises";
import path from "node:path";
import { getChecks } from "./checks/index.js";
import { createResult } from "./checks/helpers.js";
import { loadConfig } from "./config.js";
import { loadEnvExampleFiles } from "./detectors/env.js";
import { detectPackageManager } from "./detectors/packageManager.js";
import { detectProjectTypes, parsePackageJson } from "./detectors/project.js";
import { findReadmeFile } from "./detectors/readme.js";
import { collectSuggestions, scoreChecks, statusFromScore } from "./scoring.js";
import {
  CLONECHECK_VERSION,
  type ClonecheckContext,
  type ClonecheckReport,
  type RunClonecheckOptions
} from "./types.js";
import { discoverFiles, readTextFile } from "./utils/files.js";

async function assertDirectory(repoPath: string): Promise<void> {
  try {
    const info = await stat(repoPath);
    if (!info.isDirectory()) {
      throw new Error(`${repoPath} is not a directory.`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.endsWith("is not a directory.")) {
      throw error;
    }
    throw new Error(`Repository path does not exist or cannot be read: ${repoPath}`);
  }
}

function projectNameFromPackageJson(packageJson: unknown): string | undefined {
  if (!packageJson || typeof packageJson !== "object") {
    return undefined;
  }

  const name = (packageJson as { name?: unknown }).name;
  return typeof name === "string" && name.length > 0 ? name : undefined;
}

export async function createClonecheckContext(options: RunClonecheckOptions): Promise<{
  context: ClonecheckContext;
  projectName: string;
}> {
  const repoPath = path.resolve(options.repoPath);
  await assertDirectory(repoPath);

  const { config } = await loadConfig(repoPath, options.configPath);
  const files = await discoverFiles(repoPath, config.ignore);
  const packageJson = parsePackageJson(await readTextFile(repoPath, "package.json"));
  const readmeFile = findReadmeFile(files);
  const readmeText = readmeFile ? await readTextFile(repoPath, readmeFile) : undefined;
  const envExamples = await loadEnvExampleFiles(repoPath, files);
  const detectedProjectTypes = detectProjectTypes(files);
  const packageManager = detectPackageManager(files, packageJson);

  return {
    projectName: projectNameFromPackageJson(packageJson) ?? path.basename(repoPath),
    context: {
      repoPath,
      files,
      config,
      packageJson,
      readmeText,
      envExampleText: envExamples.text,
      envExampleVars: envExamples.vars,
      detectedProjectTypes,
      detectedPackageManager: packageManager.manager,
      strict: Boolean(options.strict)
    }
  };
}

export async function runClonecheck(options: RunClonecheckOptions): Promise<ClonecheckReport> {
  const { context, projectName } = await createClonecheckContext(options);
  const rawResults = [];

  for (const check of getChecks()) {
    if (context.config.checks[check.id] === false) {
      rawResults.push(
        createResult({
          id: check.id,
          title: check.title,
          status: "skip"
        })
      );
      continue;
    }

    rawResults.push(await check.run(context));
  }

  const scored = scoreChecks(rawResults, context.strict);
  const suggestions = collectSuggestions(scored.checks);

  return {
    repoPath: context.repoPath,
    projectName,
    score: scored.score,
    status: statusFromScore(scored.score),
    checks: scored.checks,
    suggestions,
    metadata: {
      detectedProjectTypes: context.detectedProjectTypes,
      detectedPackageManager: context.detectedPackageManager,
      generatedAt: new Date().toISOString(),
      clonecheckVersion: CLONECHECK_VERSION
    }
  };
}
