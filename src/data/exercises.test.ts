import { describe, expect, it } from "vitest";
import { getExercise, listExercises } from "./exercises";
import { exerciseSchema } from "../schemas/exercise";

describe("exercises catalog", () => {
  it("includes all v1 exercises in order", () => {
    const all = listExercises();
    expect(all).toHaveLength(3);
    expect(all[0]?.slug).toBe("deploy-first-worker");
    expect(all[1]?.slug).toBe("add-first-binding-kv");
    expect(all[2]?.slug).toBe("use-worker-previews");
    for (const exercise of all) {
      expect(() => exerciseSchema.parse(exercise)).not.toThrow();
    }
  });

  it("looks up by slug and returns undefined for unknown", () => {
    expect(getExercise("deploy-first-worker")?.title).toContain("Deploy");
    expect(getExercise("add-first-binding-kv")?.title).toBe("Add your first binding");
    expect(getExercise("use-worker-previews")?.title).toBe("Use Worker Previews");
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

  it("Previews exercise verifies isolation from production before completion", () => {
    const exercise = getExercise("use-worker-previews");
    expect(exercise?.agentInstructions).toMatch(/verify/i);
    expect(exercise?.agentInstructions).toContain("use-worker-previews");
    expect(exercise?.agentInstructions).toContain("cf previews deploy");
    expect(exercise?.agentInstructions).toContain("isPreview");
    expect(exercise?.agentInstructions).toMatch(/PUT \/api\/progress/i);
  });

  it("every exercise carries light teaching beats, still gated on verification", () => {
    for (const slug of ["deploy-first-worker", "add-first-binding-kv", "use-worker-previews"]) {
      const exercise = getExercise(slug);
      expect(exercise?.agentInstructions).toMatch(/interview answers/i);
      expect(exercise?.agentInstructions).toMatch(/comprehension check/i);
    }
  });
});
