import { describe, expect, it } from "vitest";
import { getHarness, harnessProfileSchema, harnesses } from "./harnesses";

describe("harnesses data", () => {
  it("has one profile per supported harness plus the generic fallback", () => {
    const ids = harnesses.map((h) => h.id).sort();
    expect(ids).toEqual(["claude-code", "codex", "copilot", "cursor", "generic", "opencode", "pi"].sort());
  });

  it("conforms to the harness profile schema", () => {
    for (const harness of harnesses) {
      expect(() => harnessProfileSchema.parse(harness)).not.toThrow();
    }
  });

  it("cites at least one source for every non-generic harness", () => {
    for (const harness of harnesses) {
      if (harness.id === "generic") continue;
      expect(harness.sources.length).toBeGreaterThan(0);
    }
  });

  it("looks up a harness by id", () => {
    expect(getHarness("codex").name).toBe("OpenAI Codex");
  });

  it("throws for an unknown harness id", () => {
    // @ts-expect-error deliberately invalid id
    expect(() => getHarness("nonexistent")).toThrow();
  });

  // Anthropic doesn't allow Claude Pro/Max plans in third-party harnesses, so
  // no harness but Claude Code may claim a Claude plan counts against its limits.
  // The daily refresh job edits this file; this keeps it from drifting on the
  // one claim the Models exercise warns students about.
  it("never has a Claude plan counting against its limits outside Claude Code", () => {
    for (const harness of harnesses.filter((h) => h.id !== "claude-code")) {
      for (const plan of harness.subscriptionBilling.plans.filter((p) => /claude/i.test(p.plan))) {
        expect(plan.countsAgainstPlan, `${harness.id}: ${plan.plan}`).not.toBe(true);
      }
    }
  });

  // The Models exercise uses these two as its examples. Other harnesses'
  // lineups are filled in by the refresh job.
  it("gives Claude Code's and Codex's models a bestFor line", () => {
    for (const harness of harnesses.filter((h) => h.id === "claude-code" || h.id === "codex")) {
      for (const model of harness.models) expect(model.bestFor, `${harness.id}: ${model.name}`).toBeTruthy();
    }
  });
});
