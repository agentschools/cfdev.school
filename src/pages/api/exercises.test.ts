import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { GET } from "./exercises";
import { listExercises } from "../../data/exercises";

describe("GET /api/exercises", () => {
  it("lists the exercise catalog in order", async () => {
    const response = await GET({} as APIContext);
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      slug: string;
      agentInstructions: string;
      content: string;
    }>;
    expect(body.map((e) => e.slug)).toEqual(listExercises().map((e) => e.slug));
    for (const exercise of body) {
      expect(exercise.agentInstructions).toBeTruthy();
      expect(exercise.content).toBeTruthy();
    }
  });
});
