import { describe, expect, it } from "vitest";
import { scoreImpactForIssues, statusFromScore } from "../src/index.js";

describe("scoring", () => {
  it("scores normal mode severities", () => {
    expect(
      scoreImpactForIssues([
        { id: "a", title: "A", message: "A", severity: "error" },
        { id: "b", title: "B", message: "B", severity: "warning" },
        { id: "c", title: "C", message: "C", severity: "info" }
      ])
    ).toBe(24);
  });

  it("scores strict mode severities", () => {
    expect(
      scoreImpactForIssues(
        [
          { id: "a", title: "A", message: "A", severity: "warning" },
          { id: "b", title: "B", message: "B", severity: "info" }
        ],
        true
      )
    ).toBe(13);
  });

  it("maps scores to statuses", () => {
    expect(statusFromScore(95)).toBe("excellent");
    expect(statusFromScore(80)).toBe("good");
    expect(statusFromScore(60)).toBe("needs-work");
    expect(statusFromScore(40)).toBe("poor");
  });
});
