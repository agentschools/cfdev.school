import { describe, expect, it } from "vitest";
import { interviewAnswersSchema, interviewSchema } from "./interview";

describe("interviewAnswersSchema", () => {
  it("accepts an empty object (all fields independently optional)", () => {
    expect(() => interviewAnswersSchema.parse({})).not.toThrow();
  });

  it("accepts a partial update of just quizOptIn", () => {
    expect(() => interviewAnswersSchema.parse({ quizOptIn: false })).not.toThrow();
  });

  it("rejects an invalid enum value", () => {
    expect(() => interviewAnswersSchema.parse({ technicalBackground: "wizard" })).toThrow();
  });
});

describe("interviewSchema", () => {
  it("accepts a fully answered interview", () => {
    expect(() =>
      interviewSchema.parse({
        studentId: "curious-hacker-2019",
        technicalBackground: "intermediate",
        cloudflareFamiliarity: "some-experience",
        learningGoals: "Deploy my side project.",
        os: "macos",
        quizOptIn: true,
        updatedAt: "2026-09-10T12:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("accepts null for unanswered fields", () => {
    expect(() =>
      interviewSchema.parse({
        studentId: "curious-hacker-2019",
        technicalBackground: null,
        cloudflareFamiliarity: null,
        learningGoals: null,
        os: null,
        quizOptIn: true,
        updatedAt: "2026-09-10T12:00:00.000Z",
      }),
    ).not.toThrow();
  });
});
