import { z } from "zod";
import { exerciseSlugSchema } from "./exercise";
import { studentIdSchema } from "./student";

/**
 * Per-student completion of exercises (and later lessons via #14).
 * Source of truth for the `exercise_completions` D1 table
 * (migrations/0003_create_exercise_completions.sql) and
 * GET/PUT /api/progress/{studentId}.
 */

export const completedExerciseSchema = z.object({
  slug: exerciseSlugSchema,
  completedAt: z.iso.datetime().meta({
    description: "When this exercise was marked complete, as an ISO 8601 timestamp.",
  }),
  deployedUrl: z.string().url().optional().meta({
    description:
      "Public URL of the student's deployed Worker, if the agent captured it after verifying the response. Optional — never required for completion.",
  }),
  model: z.string().min(1).optional().meta({
    description: "Model ID the agent was running as when it marked this complete, if known.",
    example: "anthropic/claude-sonnet-4-5",
  }),
});

export const progressSchema = z.object({
  studentId: studentIdSchema,
  completedExercises: z.array(completedExerciseSchema),
  updatedAt: z.iso.datetime().meta({
    description: "When progress was last updated, as an ISO 8601 timestamp. Equals student createdAt when nothing is complete yet.",
  }),
});

/** Body for PUT /api/progress/{studentId}. Marks one exercise complete (idempotent upsert). */
export const markProgressSchema = z.object({
  exerciseSlug: exerciseSlugSchema.meta({
    description: "Slug of the exercise to mark complete. Must match a known exercise.",
  }),
  deployedUrl: z.string().url().optional().meta({
    description: "Optional public URL the agent verified before marking complete.",
  }),
  model: z.string().min(1).optional().meta({
    description: "Optional model ID the agent is running as.",
  }),
});

export type CompletedExercise = z.infer<typeof completedExerciseSchema>;
export type Progress = z.infer<typeof progressSchema>;
export type MarkProgress = z.infer<typeof markProgressSchema>;
