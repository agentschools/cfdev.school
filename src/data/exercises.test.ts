import { describe, expect, it } from "vitest";
import { getExercise, listExercises } from "./exercises";
import { exerciseSchema } from "../schemas/exercise";

describe("exercises catalog", () => {
  it("includes deploy-first-worker as the only v1 exercise", () => {
    const all = listExercises();
    expect(all).toHaveLength(1);
    expect(all[0]?.slug).toBe("deploy-first-worker");
    expect(() => exerciseSchema.parse(all[0])).not.toThrow();
  });

  it("looks up by slug and returns undefined for unknown", () => {
    expect(getExercise("deploy-first-worker")?.title).toContain("Deploy");
    expect(getExercise("nope")).toBeUndefined();
  });

  it("agent instructions require URL verification before completion", () => {
    const exercise = getExercise("deploy-first-worker");
    expect(exercise?.agentInstructions).toMatch(/verify/i);
    expect(exercise?.agentInstructions).toContain("deploy-first-worker");
    expect(exercise?.agentInstructions).toMatch(/PUT \/api\/progress/i);
  });
});
