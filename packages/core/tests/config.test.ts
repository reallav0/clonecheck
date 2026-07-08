import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ClonecheckConfigError, initConfig, loadConfig } from "../src/index.js";

describe("config loading", () => {
  it("loads default config when no file exists", async () => {
    const repoPath = await mkdtemp(path.join(os.tmpdir(), "clonecheck-config-"));
    const { config } = await loadConfig(repoPath);

    expect(config).toEqual({
      ignore: [],
      ignoreEnvVars: [],
      checks: {}
    });
  });

  it("validates clonecheck config files", async () => {
    const repoPath = await mkdtemp(path.join(os.tmpdir(), "clonecheck-config-"));
    await writeFile(
      path.join(repoPath, "clonecheck.config.json"),
      JSON.stringify({
        ignore: ["examples/**"],
        ignoreEnvVars: ["CUSTOM_IGNORE"],
        checks: { "ci-presence": false }
      }),
      "utf8"
    );

    const { config } = await loadConfig(repoPath);

    expect(config.ignore).toEqual(["examples/**"]);
    expect(config.ignoreEnvVars).toEqual(["CUSTOM_IGNORE"]);
    expect(config.checks["ci-presence"]).toBe(false);
  });

  it("throws a friendly error for invalid config", async () => {
    const repoPath = await mkdtemp(path.join(os.tmpdir(), "clonecheck-config-"));
    await writeFile(path.join(repoPath, "clonecheck.config.json"), JSON.stringify({ ignore: "nope" }), "utf8");

    await expect(loadConfig(repoPath)).rejects.toBeInstanceOf(ClonecheckConfigError);
  });

  it("creates a default config without overwriting existing files", async () => {
    const repoPath = await mkdtemp(path.join(os.tmpdir(), "clonecheck-config-"));
    const first = await initConfig(repoPath);
    const second = await initConfig(repoPath);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
  });
});
