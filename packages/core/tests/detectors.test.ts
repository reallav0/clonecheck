import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectPackageManager,
  extractDockerComposeEnvVars,
  extractEnvVarUsages,
  extractReadmeCommands,
  findMissingEnvVars,
  isPackageInstallCommand,
  parseEnvExampleVars
} from "../src/index.js";
import { discoverFiles, readTextFile } from "../src/utils/files.js";

const fixturesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("package manager detection", () => {
  it("detects pnpm from lockfiles", () => {
    const detection = detectPackageManager(["package.json", "pnpm-lock.yaml"]);

    expect(detection.manager).toBe("pnpm");
    expect(detection.lockfiles).toEqual(["pnpm-lock.yaml"]);
  });
});

describe("README command extraction", () => {
  it("extracts package manager and docker commands from shell blocks", () => {
    const commands = extractReadmeCommands(`
# App

\`\`\`bash
pnpm install
pnpm dev
pnpm --filter @clonecheck/cli dev -- scan .
docker compose up
\`\`\`
`);

    expect(commands.map((command) => command.command)).toEqual([
      "pnpm install",
      "pnpm dev",
      "pnpm --filter @clonecheck/cli dev -- scan .",
      "docker compose up"
    ]);
    expect(commands.map((command) => command.kind)).toEqual(["install", "run", "run", "docker"]);
  });

  it("distinguishes repo installs from package installation examples", () => {
    expect(isPackageInstallCommand("npm install")).toBe(false);
    expect(isPackageInstallCommand("pnpm install --frozen-lockfile")).toBe(false);
    expect(isPackageInstallCommand("npm install --save-dev clonecheck")).toBe(true);
    expect(isPackageInstallCommand("pnpm add -D clonecheck")).toBe(false);
  });
});

describe("environment variable detection", () => {
  it("detects supported JS, Python, Go, and Rust env patterns", () => {
    const usages = extractEnvVarUsages(
      `
process.env.DATABASE_URL
process.env["JWT_SECRET"]
process.env['STRIPE_SECRET_KEY']
import.meta.env.VITE_API_URL
os.environ["PYTHON_SECRET"]
os.getenv("PYTHON_OPTIONAL")
os.Getenv("GO_SECRET")
std::env::var("RUST_SECRET")
`,
      "src/config.ts"
    );

    expect(usages.map((usage) => usage.name)).toEqual([
      "DATABASE_URL",
      "JWT_SECRET",
      "STRIPE_SECRET_KEY",
      "VITE_API_URL",
      "PYTHON_SECRET",
      "PYTHON_OPTIONAL",
      "GO_SECRET",
      "RUST_SECRET"
    ]);
  });

  it("compares detected env vars with documented examples", () => {
    const documented = parseEnvExampleVars(`
DATABASE_URL=
# Comment
export VITE_API_URL=
`);
    const missing = findMissingEnvVars(
      [
        { name: "DATABASE_URL", file: "src/app.ts", line: 1 },
        { name: "JWT_SECRET", file: "src/app.ts", line: 2 },
        { name: "VITE_API_URL", file: "src/app.ts", line: 3 }
      ],
      documented
    );

    expect(missing).toEqual(["JWT_SECRET"]);
  });
});

describe("Docker Compose env detection", () => {
  it("extracts variable references with and without defaults", () => {
    const refs = extractDockerComposeEnvVars(
      `
services:
  db:
    environment:
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres}
      DATABASE_URL: \${DATABASE_URL}
`,
      "docker-compose.yml"
    );

    expect(refs.map((ref) => ref.name)).toEqual(["POSTGRES_PASSWORD", "DATABASE_URL"]);
  });

  it("discovers compose fixtures from disk", async () => {
    const repoPath = path.join(fixturesPath, "docker-compose-missing-env");
    const files = await discoverFiles(repoPath);
    const compose = await readTextFile(repoPath, "docker-compose.yml");

    expect(files).toContain("docker-compose.yml");
    expect(compose).toContain("POSTGRES_PASSWORD");
  });
});
