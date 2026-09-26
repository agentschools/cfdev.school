import type { CachedStudent } from "./enroll-client";

export interface AgentPromptContext {
  title: string;
  /** Matches the noun used in the generated prompt's "Let's work on..." line. */
  kind: "lesson" | "exercise";
}

/**
 * Builds the copy/paste prompt shown after enrollment. Same shape for every
 * harness (no "my coding agent is X" line): the agent figures out what it is
 * on its own once it fetches /llms.txt. With no context, this points the
 * agent at the Interview, the first thing llms.txt has it do.
 */
export function buildPrompt(student: CachedStudent, context?: AgentPromptContext): string {
  const origin = window.location.origin;
  const workOnLine = context
    ? `Let's work on the "${context.title}" ${context.kind} together!`
    : `Let's work on the "Interview" lesson together!`;
  return [
    `I'm enrolled in Cloudflare Dev School as ${student.id}`,
    "",
    workOnLine,
    "",
    `Fetch ${origin}/llms.txt for instructions.`,
  ].join("\n");
}
