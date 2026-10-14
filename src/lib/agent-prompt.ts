import type { CachedStudent } from "./enroll-client";

export interface AgentPromptContext {
  courseTitle: string;
  /** The student has completed some of this course's exercises already. */
  continuing?: boolean;
  /** An exercise the student already completed (e.g. with another agent) and wants to go through again. */
  redoExercise?: string;
}

/**
 * Builds the copy/paste prompt shown after enrollment. Same shape for every
 * harness (no "my coding agent is X" line): the agent figures out what it is
 * on its own once it fetches /llms.txt. It names the course, not an exercise:
 * the agent checks progress and picks up at the first incomplete exercise.
 * With no context, it's Agent setup, which a new student starts with its
 * interview (see /llms.txt's "Starting fast").
 */
export function buildPrompt(student: CachedStudent, context?: AgentPromptContext): string {
  const origin = window.location.origin;
  const { courseTitle, continuing, redoExercise } = context ?? { courseTitle: "Agent setup" };
  const workOnLine = redoExercise
    ? `Let's redo the "${redoExercise}" exercise from the "${courseTitle}" course together, even though I've already completed it.`
    : continuing
      ? `Let's continue working on the "${courseTitle}" course.`
      : `Let's work on the "${courseTitle}" course together.`;
  return [
    `I'm enrolled in Cloudflare Dev School as ${student.id}`,
    "",
    workOnLine,
    "",
    `Fetch ${origin}/llms.txt for instructions.`,
  ].join("\n");
}

/** The enrolled homepage's prompt once Agent setup is done and no course is in progress: the agent asks which track to take (see /llms.txt's "Courses"). */
export function buildChooseCoursePrompt(student: CachedStudent): string {
  return [
    `I'm enrolled in Cloudflare Dev School as ${student.id}`,
    "",
    "I'm ready for my next course. Help me pick what to do next.",
    "",
    `Fetch ${window.location.origin}/llms.txt for instructions.`,
  ].join("\n");
}

/** The prompt on /authors (#79): no student ID, it starts writing a course rather than taking one. */
export function buildAuthorPrompt(): string {
  return [
    "I want to create a course for Cloudflare Dev School.",
    "",
    `Read ${window.location.origin}/authors.md, then help me plan and write it.`,
  ].join("\n");
}
