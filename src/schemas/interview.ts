import { z } from "zod";
import { studentIdSchema } from "./student";

/**
 * The interview the agent conducts right after the student pastes the
 * handoff prompt (see plan.agent.md's Interview section): technical
 * background, Cloudflare familiarity, and learning goals shape tone and
 * depth of explanation only, never which lessons run or how the database
 * branches, per v1 scope. Quiz opt-in is a standalone preference the
 * student can change any time, not just during the interview.
 *
 * Source of truth for the `interview_answers` D1 table shape (see
 * migrations/0002_create_interview_answers.sql) and the
 * /api/students/{id}/interview request/response bodies.
 */

export const technicalBackgroundSchema = z
  .enum(["beginner", "intermediate", "advanced"])
  .meta({ description: "Self-reported general coding experience." });

export const cloudflareFamiliaritySchema = z.enum(["new", "some-experience", "regular-user"]).meta({
  description:
    "Self-reported familiarity with Cloudflare. Used only to inform tone and depth of explanation, never to skip lessons or branch logic in v1.",
});

export const osSchema = z
  .enum(["macos", "linux", "windows", "other"])
  .meta({ description: "Student's operating system, auto-detected by the agent, not asked as a question." });

/** Partial input body for PUT /api/students/{id}/interview. Every field is independently updatable. */
export const interviewAnswersSchema = z.object({
  technicalBackground: technicalBackgroundSchema.optional(),
  cloudflareFamiliarity: cloudflareFamiliaritySchema.optional(),
  learningGoals: z.string().min(1).optional().meta({
    description: "Free-text description of what the student wants to get out of the course.",
    example: "I want to deploy my side project on Cloudflare Workers.",
  }),
  os: osSchema.optional(),
  quizOptIn: z.boolean().optional().meta({
    description: "Whether the student wants to be quizzed at the end of each lesson. Defaults to true.",
  }),
});

/** Stored/returned shape: every answer starts unset until the student (or agent) provides it. */
export const interviewSchema = z.object({
  studentId: studentIdSchema,
  technicalBackground: technicalBackgroundSchema.nullable(),
  cloudflareFamiliarity: cloudflareFamiliaritySchema.nullable(),
  learningGoals: z.string().nullable(),
  os: osSchema.nullable(),
  quizOptIn: z.boolean(),
  updatedAt: z.iso.datetime().meta({
    description: "When these answers were last updated, as an ISO 8601 timestamp.",
  }),
});

export type InterviewAnswers = z.infer<typeof interviewAnswersSchema>;
export type Interview = z.infer<typeof interviewSchema>;
