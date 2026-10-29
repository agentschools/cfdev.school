import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { exerciseFrontmatterSchema } from "../schemas/course";
import { rawCourses } from "./course-files";
import { replaceInterviewAnswer, webInterviewSummary } from "./web-interview-client";

const courses = ["agent-setup", "publish-a-website"];

describe("optional web interviews", () => {
  it.each(courses)("uses the same four questions in the raw agent file and content schema: %s", (name) => {
    const markdown = rawCourses().find((course) => course.name === name)!.exercises["00-interview.md"];
    const data = exerciseFrontmatterSchema.parse(parse(markdown.split("---")[1]));
    const questions = data["interview-questions"]!;
    expect(questions).toHaveLength(4);
    expect(new Set(questions.map((item) => item.question)).size).toBe(4);
    expect(questions.filter((item) => item.type === "multiple")).toHaveLength(1);
    expect(rawCourses().some((course) => Object.values(course.exercises).includes(markdown))).toBe(true);
    expect(data["agent-instructions"]).toContain("single source");
    expect(data["agent-instructions"]).toContain("pending");
    expect(data["agent-instructions"]).toContain("[]");
  });

  it("preserves detected context, other answers, and explicit skips when correcting an answer", () => {
    const responses = [
      { question: "OS", answer: "macOS" },
      { question: "Goal", answer: "old idea" },
      { question: "Quiz", answer: [] },
    ];
    const updated = replaceInterviewAnswer(responses, "Goal", "new idea");
    expect(updated).toEqual([responses[0], responses[2], { question: "Goal", answer: "new idea" }]);
    expect(responses[1].answer).toBe("old idea");
    expect(replaceInterviewAnswer(updated, "Goal", [])).toEqual([responses[0], responses[2], { question: "Goal", answer: [] }]);
  });

  it("summarizes only the current questionnaire, without claiming pending checks or completion", () => {
    expect(webInterviewSummary("Agent setup", [{ question: "OS", answer: "macOS" }, { question: "Goal", answer: "a site" }, { question: "Quiz", answer: [] }], ["Goal", "Quiz"]))
      .toBe("You've shared 1 answer for Agent setup; 1 question skipped. You can change these anytime.");
  });
});

describe("pending web answers", () => {
  it("keeps unfinished questions separate from explicit skips when saving a partial interview", async () => {
    const { interviewResponseSchema } = await import("../schemas/interview");
    const pending = interviewResponseSchema.parse({ question: "Goal", answer: [], pending: true });
    const skipped = interviewResponseSchema.parse({ question: "Quiz", answer: [] });
    expect(interviewResponseSchema.safeParse({ question: "Goal", answer: "already answered", pending: true }).success).toBe(false);
    expect(webInterviewSummary("Agent setup", [pending, skipped], ["Goal", "Quiz"]))
      .toBe("You've shared 0 answers for Agent setup; 1 question skipped. You can change these anytime.");
    expect(replaceInterviewAnswer([pending, skipped], "Goal", "a website"))
      .toEqual([skipped, { question: "Goal", answer: "a website" }]);
  });
});
