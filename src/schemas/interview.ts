import { z } from "zod";
import { courseRefSchema } from "./course";
import { studentIdSchema } from "./student";

/**
 * Interviews (see #73 and #76): every course starts with one, and the
 * student's answers are stored per course as question-and-answer pairs. Each
 * answer carries its question's text because a course without its own
 * interview gets one the agent writes, so there are no stable question IDs.
 * Agent setup's interview (agent experience, where they've deployed, goals,
 * quiz preference, and the detected OS) is the baseline every course reads.
 * Answers shape tone and depth only, never which exercises run.
 *
 * Source of truth for the `interviews` D1 table
 * (migrations/0009_create_interviews.sql) and GET|PUT
 * /api/students/{id}/interviews.
 */

export const interviewResponseSchema = z.object({
  question: z.string().min(1).meta({
    description:
      "The question's text as you asked it, or a description of something you detected without asking (e.g. the student's OS).",
    example: "How much have you used AI coding agents like this one?",
  }),
  answer: z.union([z.string().min(1), z.array(z.string().min(1))]).meta({
    description:
      "The choice the student picked or their own words, or an array of choices for a question that allows several.",
    example: "now and then",
  }),
});

export const interviewSummarySchema = z.string().min(1).max(280).meta({
  description:
    "One sentence, written by the agent for the student, summarizing their answers. Agent setup's is shown on the student's homepage.",
  example: "You're new to AI agents, haven't deployed anything before, are on macOS, want to build a link shortener, and opted into quizzes.",
});

/** Body for PUT /api/students/{id}/interviews: replaces one course's interview. */
export const saveInterviewSchema = z.object({
  course: courseRefSchema,
  responses: z.array(interviewResponseSchema).meta({
    description:
      "Every answer, in the order asked, leaving out questions the student skipped. Replaces what's stored, so include answers that didn't change.",
  }),
  summary: interviewSummarySchema,
});

export const interviewSchema = saveInterviewSchema.extend({
  updatedAt: z.iso.datetime().meta({
    description: "When this interview was last saved, as an ISO 8601 timestamp.",
  }),
});

export const interviewsSchema = z.object({
  studentId: studentIdSchema,
  interviews: z.array(interviewSchema).meta({
    description:
      "One per course the student has been interviewed for: built-in courses in catalog order, then courses hosted elsewhere, oldest first. Empty until the first interview.",
  }),
});

export type InterviewResponse = z.infer<typeof interviewResponseSchema>;
export type SaveInterview = z.infer<typeof saveInterviewSchema>;
export type Interview = z.infer<typeof interviewSchema>;
export type Interviews = z.infer<typeof interviewsSchema>;
