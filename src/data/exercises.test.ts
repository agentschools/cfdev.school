import { describe, expect, it } from "vitest";
import { getExercise, listExercises } from "./exercises";
import { exerciseSchema } from "../schemas/exercise";

describe("exercises catalog", () => {
  it("includes both v1 exercises in order", () => {
    const all = listExercises();
    expect(all).toHaveLength(2);
    expect(all[0]?.slug).toBe("deploy-first-worker");
    expect(all[1]?.slug).toBe("add-first-binding-kv");
    for (const exercise of all) {
      expect(() => exerciseSchema.parse(exercise)).not.toThrow();
    }
  });

  it("looks up by slug and returns undefined for unknown", () => {
    expect(getExercise("deploy-first-worker")?.title).toContain("Deploy");
    expect(getExercise("add-first-binding-kv")?.title).toContain("Binding");
    expect(getExercise("nope")).toBeUndefined();
  });

  it("agent instructions require URL verification before completion", () => {
    const exercise = getExercise("deploy-first-worker");
    expect(exercise?.agentInstructions).toMatch(/verify/i);
    expect(exercise?.agentInstructions).toContain("deploy-first-worker");
    expect(exercise?.agentInstructions).toMatch(/PUT \/api\/progress/i);
  });

  it("KV exercise requires a two-step write-then-read verification before completion", () => {
    const exercise = getExercise("add-first-binding-kv");
    expect(exercise?.agentInstructions).toMatch(/verify/i);
    expect(exercise?.agentInstructions).toContain("add-first-binding-kv");
    expect(exercise?.agentInstructions).toMatch(/separate/i);
    expect(exercise?.agentInstructions).toMatch(/PUT \/api\/progress/i);
  });
});
