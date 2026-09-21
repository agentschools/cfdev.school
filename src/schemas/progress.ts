import { z } from "zod";
import { exerciseSlugSchema } from "./exercise";
import { studentIdSchema } from "./student";

/**
 * Per-student completion of exercises and lessons (see #14). Source of truth
 * for the `exercise_completions` (migrations/0003_create_exercise_completions.sql)
 * and `lesson_completions` (migrations/0004_create_lesson_completions.sql) D1
 * tables, and GET/PUT /api/progress/{studentId}.
 */

export const lessonSlugSchema = z
  .union([
    z.literal("models"),
    z.literal("instructions"),
    z.literal("cli"),
    z.literal("skills"),
    z.literal("tools"),
  ])
  .meta({
    description: "Stable slug for a course lesson.",
    example: "models",
  });

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

export const completedLessonSchema = z.object({
  slug: lessonSlugSchema,
  completedAt: z.iso.datetime().meta({
    description: "When this lesson was marked complete, as an ISO 8601 timestamp.",
  }),
  model: z.string().min(1).optional().meta({
    description: "Model ID the agent was running as when it marked this complete, if known.",
    example: "anthropic/claude-sonnet-4-5",
  }),
});

export const progressSchema = z.object({
  studentId: studentIdSchema,
  completedExercises: z.array(completedExerciseSchema),
  completedLessons: z.array(completedLessonSchema),
  updatedAt: z.iso.datetime().meta({
    description: "When progress was last updated, as an ISO 8601 timestamp. Equals student createdAt when nothing is complete yet.",
  }),
});

/** Body for PUT /api/progress/{studentId} to mark an exercise complete (idempotent upsert). */
export const markExerciseCompleteSchema = z.object({
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

/** Body for PUT /api/progress/{studentId} to mark a lesson complete (idempotent upsert). */
export const markLessonCompleteSchema = z.object({
  lessonSlug: lessonSlugSchema.meta({
    description: "Slug of the lesson to mark complete. Must match a known lesson.",
  }),
  model: z.string().min(1).optional().meta({
    description: "Optional model ID the agent is running as.",
  }),
});

/** Body for PUT /api/progress/{studentId}. Marks one exercise or one lesson complete. */
export const markProgressSchema = z.union([markExerciseCompleteSchema, markLessonCompleteSchema]);

export type LessonSlug = z.infer<typeof lessonSlugSchema>;
export type CompletedExercise = z.infer<typeof completedExerciseSchema>;
export type CompletedLesson = z.infer<typeof completedLessonSchema>;
export type Progress = z.infer<typeof progressSchema>;
export type MarkExerciseComplete = z.infer<typeof markExerciseCompleteSchema>;
export type MarkLessonComplete = z.infer<typeof markLessonCompleteSchema>;
export type MarkProgress = z.infer<typeof markProgressSchema>;
