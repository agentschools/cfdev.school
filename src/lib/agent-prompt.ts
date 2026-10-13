import type { CachedStudent } from "./enroll-client";

export interface AgentPromptContext {
  courseTitle: string;
  /** Leave out for a prompt about the whole course. */
  exerciseTitle?: string;
  /** The student already completed this exercise (e.g. with another agent) and wants to go through it again. */
  redo?: boolean;
}

/**
 * Builds the copy/paste prompt shown after enrollment. Same shape for every
 * harness (no "my coding agent is X" line): the agent figures out what it is
 * on its own once it fetches /llms.txt. With no context, this points the
 * agent at Agent setup's interview, the first thing llms.txt has it do.
 */
export function buildPrompt(student: CachedStudent, context?: AgentPromptContext): string {
  const origin = window.location.origin;
  const { courseTitle, exerciseTitle, redo } = context ?? { courseTitle: "Agent setup", exerciseTitle: "Interview" };
  const workOnLine = !exerciseTitle
    ? `Let's work on the "${courseTitle}" course together.`
    : redo
      ? `Let's redo the "${exerciseTitle}" exercise from the "${courseTitle}" course together, even though I've already completed it.`
      : `Let's work on the "${exerciseTitle}" exercise from the "${courseTitle}" course together.`;
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
