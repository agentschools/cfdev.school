import type { CachedStudent } from "./enroll-client";

export interface AgentPromptContext {
  title: string;
  /** Matches the noun used in the generated prompt's "Let's work on..." line. */
  kind: "lesson" | "exercise";
  /** The student already completed this (e.g. with another agent) and wants to go through it again. */
  redo?: boolean;
}

/**
 * Builds the copy/paste prompt shown after enrollment. Same shape for every
 * harness (no "my coding agent is X" line): the agent figures out what it is
 * on its own once it fetches /llms.txt. With no context, this points the
 * agent at the Interview, the first thing llms.txt has it do.
 */
export function buildPrompt(student: CachedStudent, context?: AgentPromptContext): string {
  const origin = window.location.origin;
  const workOnLine = !context
    ? `Let's work on the "Interview" lesson together!`
    : context.redo
      ? `Let's redo the "${context.title}" ${context.kind} together, even though I've already completed it.`
      : `Let's work on the "${context.title}" ${context.kind} together!`;
  return [
    `I'm enrolled in Cloudflare Dev School as ${student.id}`,
    "",
    workOnLine,
    "",
    `Fetch ${origin}/llms.txt for instructions.`,
  ].join("\n");
}
