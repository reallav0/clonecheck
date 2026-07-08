import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

export const DEFAULT_FILE_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**"
];

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".go",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".md",
  ".py",
  ".rs",
  ".sh",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
]);

export function normalizeRelativePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function absolutePath(repoPath: string, relativePath: string): string {
  return path.join(repoPath, relativePath);
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function discoverFiles(repoPath: string, ignore: string[] = []): Promise<string[]> {
  const files = await fg(["**/*"], {
    cwd: repoPath,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    unique: true,
    ignore: [...DEFAULT_FILE_IGNORE, ...ignore]
  });

  return files.map(normalizeRelativePath).sort((a, b) => a.localeCompare(b));
}

export async function readTextFile(repoPath: string, relativePath: string): Promise<string | undefined> {
  const target = absolutePath(repoPath, relativePath);
  try {
    const info = await stat(target);
    if (info.size > 1_000_000) {
      return undefined;
    }

    return await readFile(target, "utf8");
  } catch {
    return undefined;
  }
}

export function isLikelyTextFile(relativePath: string): boolean {
  const baseName = path.basename(relativePath);
  if (
    baseName === ".env.example" ||
    baseName === ".env.sample" ||
    baseName === ".env.template" ||
    baseName === "example.env"
  ) {
    return true;
  }

  return TEXT_EXTENSIONS.has(path.extname(relativePath));
}

export function findCaseInsensitive(files: string[], expected: string): string | undefined {
  const expectedLower = expected.toLowerCase();
  return files.find((file) => file.toLowerCase() === expectedLower);
}

export function findAnyCaseInsensitive(files: string[], expected: string[]): string | undefined {
  for (const filename of expected) {
    const match = findCaseInsensitive(files, filename);
    if (match) {
      return match;
    }
  }

  return undefined;
}

export function lineNumberFromIndex(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}
