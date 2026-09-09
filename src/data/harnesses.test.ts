import { describe, expect, it } from "vitest";
import { getHarness, harnessProfileSchema, harnesses } from "./harnesses";

describe("harnesses data", () => {
  it("has one profile per supported harness plus the generic fallback", () => {
    const ids = harnesses.map((h) => h.id).sort();
    expect(ids).toEqual(["claude-code", "codex", "generic", "opencode", "pi"].sort());
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
});
