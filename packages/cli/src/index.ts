#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import {
  CLONECHECK_VERSION,
  ClonecheckConfigError,
  createClonecheckContext,
  formatJsonReport,
  formatMarkdownReport,
  formatTextReport,
  generateEnvExample,
  initConfig,
  runClonecheck
} from "@clonecheck/core";

type OutputFormat = "text" | "json" | "markdown";

interface ScanOptions {
  format: OutputFormat;
  output?: string;
  strict?: boolean;
  config?: string;
  color?: boolean;
}

interface GenerateEnvOptions {
  write?: boolean;
  config?: string;
}

interface InitOptions {
  force?: boolean;
}

function shouldShowDebug(): boolean {
  const value = process.env.DEBUG;
  if (!value) {
    return false;
  }

  return value === "*" || value.split(",").map((entry) => entry.trim()).includes("clonecheck");
}

function handleError(error: unknown): void {
  if (shouldShowDebug()) {
    console.error(error);
    process.exitCode = 1;
    return;
  }

  if (error instanceof ClonecheckConfigError) {
    console.error(pc.red(error.message));
  } else if (error instanceof Error) {
    console.error(pc.red(error.message));
  } else {
    console.error(pc.red(String(error)));
  }

  process.exitCode = 1;
}

function normalizeFormat(format: string): OutputFormat {
  if (format === "text" || format === "json" || format === "markdown") {
    return format;
  }

  throw new Error(`Unsupported format "${format}". Use text, json, or markdown.`);
}

function resolveUserPath(inputPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  return path.resolve(process.env.INIT_CWD ?? process.cwd(), inputPath);
}

async function writeOutput(outputPath: string, content: string): Promise<void> {
  const resolved = resolveUserPath(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
}

async function runScan(repoPath: string, options: ScanOptions): Promise<void> {
  const format = normalizeFormat(options.format);
  const report = await runClonecheck({
    repoPath: resolveUserPath(repoPath),
    configPath: options.config,
    strict: Boolean(options.strict)
  });

  const output =
    format === "json"
      ? formatJsonReport(report)
      : format === "markdown"
        ? formatMarkdownReport(report)
        : formatTextReport(report, { color: options.color });

  if (options.output) {
    await writeOutput(options.output, output);
  } else {
    process.stdout.write(output);
  }

  if (options.strict && report.score < 75) {
    process.exitCode = 1;
  }
}

async function runGenerateEnvExample(repoPath: string, options: GenerateEnvOptions): Promise<void> {
  const { context } = await createClonecheckContext({
    repoPath: resolveUserPath(repoPath),
    configPath: options.config
  });
  const result = await generateEnvExample({
    repoPath: context.repoPath,
    files: context.files,
    config: context.config,
    write: Boolean(options.write)
  });

  if (options.write) {
    const writtenPath = result.writtenPath ?? path.join(context.repoPath, ".env.example");
    console.log(
      `Updated ${writtenPath} with ${result.missingVars.length} missing environment variable${result.missingVars.length === 1 ? "" : "s"}.`
    );
    return;
  }

  process.stdout.write(result.content);
}

async function runInit(repoPath: string, options: InitOptions): Promise<void> {
  const result = await initConfig(resolveUserPath(repoPath), Boolean(options.force));
  if (!result.created) {
    console.error(`Config already exists at ${result.path}. Use --force to overwrite it.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Created ${result.path}`);
}

const program = new Command();

program
  .name("clonecheck")
  .description("Know if your repo is actually cloneable.")
  .version(CLONECHECK_VERSION)
  .showHelpAfterError();

program
  .command("scan")
  .description("Scan a repository for cloneability and contributor-readiness issues.")
  .argument("[repoPath]", "repository path", ".")
  .option("--format <format>", "output format: text, json, or markdown", "text")
  .option("--output <file>", "write the report to a file")
  .option("--strict", "exit with code 1 when score is below 75")
  .option("--config <file>", "path to a clonecheck config file")
  .option("--no-color", "disable terminal colors")
  .action((repoPath: string, options: ScanOptions) => {
    return runScan(repoPath, options).catch(handleError);
  });

program
  .command("generate-env-example")
  .description("Print or update a suggested .env.example based on environment variables used in code.")
  .argument("[repoPath]", "repository path", ".")
  .option("--write", "create or append missing variables to .env.example")
  .option("--config <file>", "path to a clonecheck config file")
  .action((repoPath: string, options: GenerateEnvOptions) => {
    return runGenerateEnvExample(repoPath, options).catch(handleError);
  });

program
  .command("init")
  .description("Create a clonecheck.config.json file.")
  .argument("[repoPath]", "repository path", ".")
  .option("--force", "overwrite an existing config file")
  .action((repoPath: string, options: InitOptions) => {
    return runInit(repoPath, options).catch(handleError);
  });

program.parseAsync(process.argv).catch(handleError);
