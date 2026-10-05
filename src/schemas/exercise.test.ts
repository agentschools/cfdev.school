import { describe, expect, it } from "vitest";
import { exerciseSchema, exerciseSlugSchema } from "./exercise";

describe("exerciseSlugSchema", () => {
  it("accepts every v1 exercise slug", () => {
    expect(exerciseSlugSchema.parse("deploy-first-worker")).toBe("deploy-first-worker");
    expect(exerciseSlugSchema.parse("add-first-binding-kv")).toBe("add-first-binding-kv");
    expect(exerciseSlugSchema.parse("use-worker-previews")).toBe("use-worker-previews");
  });

  it("rejects an unknown slug", () => {
    expect(() => exerciseSlugSchema.parse("build-a-saas")).toThrow();
  });
});

describe("exerciseSchema", () => {
  it("accepts a full exercise record", () => {
    expect(() =>
      exerciseSchema.parse({
        order: 1,
        slug: "deploy-first-worker",
        title: "Deploy your first Worker",
        description: "Create, run locally, deploy, and visit a minimal text Worker.",
        agentInstructions: "Verify the deployed URL returns the expected text before marking complete.",
        content: "# Deploy your first Worker\n\nCreate a minimal Worker.",
      }),
    ).not.toThrow();
  });
});
