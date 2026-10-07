import { z } from "zod";
import { harnessProfileSchema } from "../data/harnesses";
import { courseNameSchema, exerciseSlugSchema } from "./course";
import { interviewSummarySchema } from "./interview";
import { studentIdSchema } from "./student";

/**
 * Per-student progress through courses (see #73 and #75). Source of truth for
 * the `course_exercise_completions` and `course_completions` D1 tables
 * (migrations/0008_course_progress.sql) and GET|PUT|DELETE
 * /api/progress/{studentId}.
 *
 * Exercise completions are per harness (#52): a student can complete the
 * same exercise once with each agent they use, since exercises like
 * Instructions or Skills change agent-specific files. A course is complete
 * once each of its exercises has at least one completion. That's recorded
 * when it first happens and kept even if the course gains exercises later.
 *
 * Each course also carries its interview summary (src/schemas/interview.ts),
 * so saving an interview updates open tabs over the same progress broadcast.
 */

const harnessSchema = harnessProfileSchema.shape.id.meta({
  description:
    'Harness (agent) that completed the exercise, the same ID used for GET /api/harnesses/{id}. Use "generic" if yours isn\'t listed.',
  example: "claude-code",
});

const modelSchema = z.string().min(1).meta({
  description: "Model ID the agent was running as when it marked the exercise complete.",
  example: "anthropic/claude-sonnet-4-5",
});

export const exerciseCompletionSchema = z.object({
  harness: harnessSchema,
  completedAt: z.iso.datetime().meta({
    description: "When this harness last marked the exercise complete, as an ISO 8601 timestamp.",
  }),
  exerciseUrl: z.url().meta({ description: "The exercise's page when it was completed." }),
  model: modelSchema.optional(),
});

export const exerciseProgressSchema = z.object({
  slug: exerciseSlugSchema,
  completions: z.array(exerciseCompletionSchema).meta({
    description: "One per harness that completed the exercise, oldest first. Empty until it's complete.",
  }),
});

export const courseProgressSchema = z.object({
  name: courseNameSchema,
  completedAt: z.iso.datetime().optional().meta({
    description:
      "When every exercise in the course first had a completion. Kept even if the course gains exercises later, which then show up with no completions.",
  }),
  interviewSummary: interviewSummarySchema.optional().meta({
    description:
      "The summary saved with the student's interview for this course (PUT /api/students/{id}/interviews), once there is one.",
  }),
  exercises: z.array(exerciseProgressSchema).meta({ description: "Every exercise in the course, in order." }),
});

export const progressSchema = z.object({
  studentId: studentIdSchema,
  courses: z.array(courseProgressSchema).meta({ description: "Every built-in course, in order." }),
  updatedAt: z.iso.datetime().meta({
    description:
      "When progress was last updated, as an ISO 8601 timestamp. Equals the student's createdAt when nothing is complete yet.",
  }),
});

/** Body for PUT /api/progress/{studentId}: marks one exercise complete (idempotent upsert per exercise + harness). */
export const markExerciseCompleteSchema = z.object({
  course: courseNameSchema.meta({ description: "The course's name, as GET /api/courses lists it." }),
  exercise: exerciseSlugSchema.meta({ description: "The exercise's slug, as GET /api/courses lists it." }),
  harness: harnessSchema,
  model: modelSchema.optional(),
});

export type ExerciseCompletion = z.infer<typeof exerciseCompletionSchema>;
export type ExerciseProgress = z.infer<typeof exerciseProgressSchema>;
export type CourseProgress = z.infer<typeof courseProgressSchema>;
export type Progress = z.infer<typeof progressSchema>;
export type MarkExerciseComplete = z.infer<typeof markExerciseCompleteSchema>;
