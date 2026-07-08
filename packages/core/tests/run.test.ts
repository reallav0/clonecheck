import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatJsonReport, runClonecheck } from "../src/index.js";

const fixturesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("runClonecheck", () => {
  it("reports package-manager and port mismatches", async () => {
    const report = await runClonecheck({
      repoPath: path.join(fixturesPath, "node-pnpm-readme-npm")
    });

    expect(report.metadata.detectedPackageManager).toBe("pnpm");
    expect(report.checks.find((check) => check.id === "readme-commands")?.status).toBe("warning");
    expect(report.checks.find((check) => check.id === "port-documentation")?.status).toBe("warning");
  });

  it("reports missing env example variables", async () => {
    const report = await runClonecheck({
      repoPath: path.join(fixturesPath, "env-missing")
    });

    const envCheck = report.checks.find((check) => check.id === "env-example");
    expect(envCheck?.issues.map((issue) => issue.id)).toContain("env-example.JWT_SECRET");
  });

  it("emits valid JSON", async () => {
    const report = await runClonecheck({
      repoPath: path.join(fixturesPath, "env-missing")
    });

    expect(JSON.parse(formatJsonReport(report))).toMatchObject({
      projectName: "env-missing"
    });
  });
});
