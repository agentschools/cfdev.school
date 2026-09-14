import { z } from "zod";

/**
 * Exercises are hands-on projects the agent guides the student through.
 * v1 ships one: "Deploy your first Worker" (see plan.agent.md Exercises).
 *
 * Source of truth for GET /api/exercises and GET /api/exercises/{slug}
 * response shapes. Content lives in src/data/exercises.ts.
 */

export const exerciseSlugSchema = z.literal("deploy-first-worker").meta({
  description: "Stable slug for a course exercise. v1 has only deploy-first-worker.",
  example: "deploy-first-worker",
});

export const exerciseSchema = z.object({
  order: z.number().int().positive().meta({ description: "Display order, starting at 1." }),
  slug: exerciseSlugSchema,
  title: z.string().min(1),
  description: z.string().min(1).meta({ description: "One-line summary for listings." }),
  agentInstructions: z.string().min(1).meta({
    description:
      "Instructions for the agent: how to guide the student, what to verify before marking complete, and what to do after.",
  }),
  content: z.string().min(1).meta({
    description: "Student-facing exercise guide as prose markdown.",
  }),
});

export type ExerciseSlug = z.infer<typeof exerciseSlugSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
