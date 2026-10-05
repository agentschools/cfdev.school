import { describe, expect, it } from "vitest";
import { exercises, getExercise, listExercises } from "./exercises";
import { exerciseSchema } from "../schemas/exercise";

describe("exercises catalog", () => {
  it("lists every exercise sorted by order, each with a unique slug and order", () => {
    const all = listExercises();
    expect(all.length).toBe(exercises.length);
    expect(all.map((e) => e.order)).toEqual([...all.map((e) => e.order)].sort((a, b) => a - b));
    expect(new Set(all.map((e) => e.order)).size).toBe(all.length);
    expect(new Set(all.map((e) => e.slug)).size).toBe(all.length);
    for (const exercise of all) {
      expect(() => exerciseSchema.parse(exercise)).not.toThrow();
    }
  });

  it("looks up by slug and returns undefined for unknown", () => {
    for (const exercise of listExercises()) {
      expect(getExercise(exercise.slug)).toBe(exercise);
    }
    expect(getExercise("nope")).toBeUndefined();
  });

  it("every exercise requires verification before marking itself complete", () => {
    for (const exercise of listExercises()) {
      expect(exercise.agentInstructions).toMatch(/verify/i);
      expect(exercise.agentInstructions).toContain(exercise.slug);
      expect(exercise.agentInstructions).toMatch(/PUT \/api\/progress/i);
    }
  });

  it("KV exercise requires a two-step write-then-read verification before completion", () => {
    expect(getExercise("add-first-binding-kv")?.agentInstructions).toMatch(/separate/i);
  });

  it("every exercise carries light teaching beats, still gated on verification", () => {
    for (const exercise of listExercises()) {
      expect(exercise.agentInstructions).toMatch(/interview answers/i);
      expect(exercise.agentInstructions).toMatch(/comprehension check/i);
    }
  });
});
