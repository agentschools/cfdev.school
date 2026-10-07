import { describe, expect, it } from "vitest";
import { interviewsSchema, saveInterviewSchema } from "./interview";

describe("saveInterviewSchema", () => {
  const body = {
    course: "agent-setup",
    responses: [
      { question: "How much have you used AI coding agents like this one?", answer: "now and then" },
      { question: "Where have you deployed apps before? (pick any)", answer: ["Vercel or Netlify", "Cloudflare"] },
    ],
    summary: "You use AI agents now and then and have deployed on Vercel and Cloudflare.",
  };

  it("accepts string and array answers", () => {
    expect(saveInterviewSchema.parse(body)).toEqual(body);
  });

  it("accepts an interview where every question was skipped", () => {
    expect(() => saveInterviewSchema.parse({ ...body, responses: [] })).not.toThrow();
  });

  it("requires a summary of at most 280 characters", () => {
    expect(() => saveInterviewSchema.parse({ course: body.course, responses: body.responses })).toThrow();
    expect(() => saveInterviewSchema.parse({ ...body, summary: "x".repeat(281) })).toThrow();
  });

  it("rejects an empty question or answer", () => {
    expect(() => saveInterviewSchema.parse({ ...body, responses: [{ question: "", answer: "yes" }] })).toThrow();
    expect(() => saveInterviewSchema.parse({ ...body, responses: [{ question: "Quiz?", answer: "" }] })).toThrow();
  });

  it("rejects the old field-per-answer shape", () => {
    expect(() => saveInterviewSchema.parse({ agentExperience: "occasional", quizOptIn: true })).toThrow();
  });
});

describe("interviewsSchema", () => {
  it("accepts a student with no interviews yet", () => {
    expect(() => interviewsSchema.parse({ studentId: "curious-hacker-2019", interviews: [] })).not.toThrow();
  });
});
