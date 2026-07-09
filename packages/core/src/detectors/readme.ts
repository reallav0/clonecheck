import type { PackageManager } from "../types.js";
import { findAnyCaseInsensitive } from "../utils/files.js";
import { isPackageManager } from "./packageManager.js";

export const README_FILENAMES = ["README.md", "readme.md", "Readme.md"];

export interface ReadmeCommand {
  command: string;
  packageManager?: PackageManager;
  kind: "install" | "run" | "test" | "build" | "docker" | "other";
}

const SHELL_LANGUAGES = new Set(["", "bash", "sh", "shell", "zsh", "console", "terminal"]);

export function findReadmeFile(files: string[]): string | undefined {
  return findAnyCaseInsensitive(files, README_FILENAMES);
}

function normalizeCommand(line: string): string {
  return line
    .trim()
    .replace(/^(?:\$|>|❯)\s*/, "")
    .replace(/^sudo\s+/, "");
}

export function extractShellBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const fenceRegex = /```([A-Za-z0-9_-]*)[^\n]*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(markdown)) !== null) {
    const language = (match[1] ?? "").toLowerCase();
    const body = match[2] ?? "";
    if (SHELL_LANGUAGES.has(language)) {
      blocks.push(body);
    }
  }

  return blocks;
}

function detectKind(command: string): ReadmeCommand["kind"] {
  if (/\bdocker(?:\s+compose|-compose)\s+up\b/.test(command)) {
    return "docker";
  }
  if (/\b(?:npm|pnpm|yarn|bun)\s+(?:install|i)\b/.test(command)) {
    return "install";
  }
  if (hasPackageScriptCommand(command, "test")) {
    return "test";
  }
  if (hasPackageScriptCommand(command, "build")) {
    return "build";
  }
  if (
    hasPackageScriptCommand(command, "dev") ||
    hasPackageScriptCommand(command, "start") ||
    hasPackageScriptCommand(command, "serve")
  ) {
    return "run";
  }

  return "other";
}

function hasPackageScriptCommand(command: string, scriptName: string): boolean {
  const escaped = scriptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const npmPattern = new RegExp(`\\bnpm\\s+run\\s+${escaped}\\b`);
  const directPattern = new RegExp(
    `\\b(?:pnpm|yarn|bun)\\b(?:\\s+(?:--filter|-F)\\s+\\S+)?\\s+(?:run\\s+)?${escaped}\\b`
  );
  const bunRunPattern = new RegExp(`\\bbun\\s+run\\s+${escaped}\\b`);

  return npmPattern.test(command) || directPattern.test(command) || bunRunPattern.test(command);
}

function detectPackageManagerFromCommand(command: string): PackageManager | undefined {
  const match = command.match(/\b(npm|pnpm|yarn|bun)\b/);
  const manager = match?.[1];
  return manager && isPackageManager(manager) ? manager : undefined;
}

export function extractReadmeCommands(markdown: string): ReadmeCommand[] {
  const commands: ReadmeCommand[] = [];

  for (const block of extractShellBlocks(markdown)) {
    for (const rawLine of block.split(/\r?\n/)) {
      const command = normalizeCommand(rawLine);
      if (!command || command.startsWith("#")) {
        continue;
      }

      const packageManager = detectPackageManagerFromCommand(command);
      const kind = detectKind(command);
      if (packageManager || kind !== "other") {
        commands.push({ command, packageManager, kind });
      }
    }
  }

  return commands;
}

export function readmeMentionsRunCommand(commands: ReadmeCommand[]): boolean {
  return commands.some((command) => command.kind === "run" || command.kind === "docker");
}

export function readmeMentionsSetupCommand(commands: ReadmeCommand[]): boolean {
  return commands.some(
    (command) =>
      command.kind === "docker" ||
      (command.kind === "install" && !isPackageInstallCommand(command.command))
  );
}

export function isPackageInstallCommand(command: string): boolean {
  const parts = command.trim().split(/\s+/);
  const managerIndex = parts.findIndex((part) => part === "npm" || part === "pnpm" || part === "yarn" || part === "bun");
  if (managerIndex < 0) {
    return false;
  }

  const installIndex = parts.findIndex(
    (part, index) => index > managerIndex && (part === "install" || part === "i")
  );
  if (installIndex < 0) {
    return false;
  }

  return parts.slice(installIndex + 1).some((part) => !part.startsWith("-") && !part.includes("="));
}
