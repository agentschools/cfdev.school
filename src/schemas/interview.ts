import { z } from "zod";
import { studentIdSchema } from "./student";

/**
 * The interview the agent conducts right after the student pastes the
 * handoff prompt (see plan.agent.md's Interview section): AI agent
 * experience, platforms used before, and learning goals shape tone and
 * depth of explanation only, never which exercises run or how the database
 * branches, per v1 scope. Quiz opt-in is a standalone preference the
 * student can change any time, not just during the interview.
 *
 * Source of truth for the `interview_answers` D1 table shape (see
 * migrations/0002_create_interview_answers.sql) and the
 * /api/students/{id}/interview request/response bodies.
 */

export const agentExperienceSchema = z
  .enum(["new", "occasional", "daily"])
  .meta({ description: "Self-reported experience with AI coding agents." });

export const platformsUsedSchema = z.array(z.string().min(1)).meta({
  description:
    "Hosting or cloud platforms the student has deployed to before, in their own words. Empty means none. Used only to inform tone, depth, and comparisons, never to skip exercises or branch logic in v1.",
  example: ["Vercel", "AWS"],
});

export const osSchema = z
  .enum(["macos", "linux", "windows", "other"])
  .meta({ description: "Student's operating system, auto-detected by the agent, not asked as a question." });

/** Partial input body for PUT /api/students/{id}/interview. Every field is independently updatable. */
export const interviewAnswersSchema = z.object({
  agentExperience: agentExperienceSchema.optional(),
  platformsUsed: platformsUsedSchema.optional(),
  learningGoals: z.string().min(1).optional().meta({
    description: "Free-text description of what the student wants to get out of the course.",
    example: "I want to deploy my side project on Cloudflare Workers.",
  }),
  os: osSchema.optional(),
  quizOptIn: z.boolean().optional().meta({
    description: "Whether the student wants to be quizzed at the end of each exercise. Defaults to true.",
  }),
});

/** Stored/returned shape: every answer starts unset until the student (or agent) provides it. */
export const interviewSchema = z.object({
  studentId: studentIdSchema,
  agentExperience: agentExperienceSchema.nullable(),
  platformsUsed: platformsUsedSchema.nullable(),
  learningGoals: z.string().nullable(),
  os: osSchema.nullable(),
  quizOptIn: z.boolean(),
  updatedAt: z.iso.datetime().meta({
    description: "When these answers were last updated, as an ISO 8601 timestamp.",
  }),
});

export type InterviewAnswers = z.infer<typeof interviewAnswersSchema>;
export type Interview = z.infer<typeof interviewSchema>;
