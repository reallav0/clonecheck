import { describe, expect, it } from "vitest";
import { formatMarkdownReport, type ClonecheckReport } from "../src/index.js";

describe("markdown reporter", () => {
  it("renders a GitHub-friendly report", () => {
    const report: ClonecheckReport = {
      repoPath: "/tmp/app",
      projectName: "app",
      score: 72,
      status: "needs-work",
      checks: [
        {
          id: "env-example",
          title: "Environment example",
          status: "warning",
          issues: [
            {
              id: "env-example.JWT_SECRET",
              title: "Environment variable is undocumented",
              message: "Environment variable JWT_SECRET is used but missing from .env.example.",
              severity: "warning",
              suggestion: "Add JWT_SECRET= to .env.example."
            }
          ],
          scoreImpact: 7
        }
      ],
      suggestions: ["Add JWT_SECRET= to .env.example."],
      metadata: {
        detectedProjectTypes: ["node"],
        detectedPackageManager: "pnpm",
        generatedAt: "2026-07-08T00:00:00.000Z",
        clonecheckVersion: "0.1.0"
      }
    };

    const markdown = formatMarkdownReport(report);

    expect(markdown).toContain("# Clonecheck Report");
    expect(markdown).toContain("| env-example |");
    expect(markdown).toContain("## Suggestions");
  });
});
