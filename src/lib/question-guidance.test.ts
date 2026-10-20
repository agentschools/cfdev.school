import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import policy from "../content/question-guidance.md?raw";
import defaultInterview from "../content/default-interview.md?raw";
import authors from "../content/authors.md?raw";
import { GET } from "../pages/llms.txt";
import { rawCourses } from "./course-files";

// Content contract checks, not a simulator of model or native UI behavior.
const interviews = rawCourses().flatMap((course) =>
  Object.entries(course.exercises)
    .filter(([file]) => file.endsWith("-interview.md"))
    .map(([file, text]) => ({ name: `${course.name}/${file}`, text })),
);
interviews.push({ name: "default interview", text: defaultInterview });

describe("school-wide question guidance", () => {
  it("includes the complete shared policy once in the actual response", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text.split(policy.trim())).toHaveLength(2);
    expect(text).not.toMatch(/Open every exercise with its title/);
    expect(text).toMatch(/Except for interviews[^\n]+open every exercise/);
    expect(text).not.toMatch(/Don't use a question tool|never through a harness's native question tool/);
  });

  it.each(interviews)("keeps $name on shared presentation rules", ({ text }) => {
    const yaml = text.match(/^---\n([\s\S]*?)\n---/)![1];
    const instructions = parseYaml(yaml)["agent-instructions"] as string;
    expect(instructions.replace(/\s+/g, " ")).toContain('/llms.txt\'s "Asking and answering questions"');
    expect(instructions).not.toMatch(/AskUserQuestion|request_user_input|plain-text|not a question\s+tool/);
    expect(instructions).toContain("PUT /api/students/{id}/interviews");
  });

  it("keeps the author guide focused on question intent", () => {
    expect(authors).toContain('Follow /llms.txt\'s "Asking and answering questions"');
    expect(authors).toMatch(/free-text or multiple-selection intent/);
    expect(authors).not.toMatch(/Claude Code's question tool/);
  });

  it("preserves Agent setup's open goal and multiple-selection answer contract", () => {
    const text = interviews.find(({ name }) => name.startsWith("agent-setup/"))!.text;
    expect(text).toMatch(/3\. "What do you want to build or learn\?" Free text/);
    expect(text).toMatch(/Choices, multiple\s+allowed:/);
    expect(text).toMatch(/an array of the choices they\s+picked \(or typed\) for question 2/);
  });

  // These protect the key prompt branches against accidental deletion or
  // reversal. Live harness execution is separately recorded as untested.
  it.each([
    ["native batch", /Batch independent questions into one native questionnaire call/, /Respect native limits/],
    ["unsupported answer type", /Never invent choices for an open question/, /ask that part in text/],
    ["text fallback", /lettered choices each on its own line/, /Accept letters, words, or mixed answers/],
    ["partial and continuation", /Missing answers are not skips/, /later messages as continuations/],
    ["missing follow-up", /ask only the missing ones once/, /keep unresolved questions pending/],
    ["skip", /Honor explicit skip or move-on requests for optional questions/, /required clarifications need an answer/],
    ["persistence", /save only after all questions are answered or intentionally skipped/, /confirm saving succeeded before completion/],
    ["adaptive quiz", /Don't batch when the next question or feedback depends on the answer/, /Quiz answers are never scored or stored/],
    ["expected setup absence", /Guard optional commands and files with existence checks/, /Explain unexpected failures/],
  ])("retains the %s scenario rules", (_name, first, second) => {
    expect(policy).toMatch(first);
    expect(policy).toMatch(second);
  });
});
