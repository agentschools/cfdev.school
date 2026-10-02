import { describe, expect, it } from "vitest";
import {
  completedExerciseSchema,
  completedLessonSchema,
  markLessonCompleteSchema,
  markProgressSchema,
  progressSchema,
} from "./progress";

describe("markProgressSchema", () => {
  it("accepts exerciseSlug alone", () => {
    expect(markProgressSchema.parse({ exerciseSlug: "deploy-first-worker" })).toEqual({
      exerciseSlug: "deploy-first-worker",
    });
  });

  it("accepts optional deployedUrl and model", () => {
    expect(
      markProgressSchema.parse({
        exerciseSlug: "deploy-first-worker",
        deployedUrl: "https://hello.example.workers.dev",
        model: "anthropic/claude-sonnet-4-5",
      }),
    ).toMatchObject({
      exerciseSlug: "deploy-first-worker",
      deployedUrl: "https://hello.example.workers.dev",
      model: "anthropic/claude-sonnet-4-5",
    });
  });

  it("rejects an unknown exercise slug", () => {
    expect(() => markProgressSchema.parse({ exerciseSlug: "nope" })).toThrow();
  });

  it("rejects a non-URL deployedUrl", () => {
    expect(() =>
      markProgressSchema.parse({
        exerciseSlug: "deploy-first-worker",
        deployedUrl: "not-a-url",
      }),
    ).toThrow();
  });

  it("accepts lessonSlug alone", () => {
    expect(markProgressSchema.parse({ lessonSlug: "models" })).toEqual({ lessonSlug: "models" });
  });

  it("accepts an optional summary with lessonSlug", () => {
    expect(markProgressSchema.parse({ lessonSlug: "interview", summary: "You're new to Cloudflare." })).toEqual({
      lessonSlug: "interview",
      summary: "You're new to Cloudflare.",
    });
  });

  it("rejects an empty or overlong summary", () => {
    expect(() => markLessonCompleteSchema.parse({ lessonSlug: "interview", summary: "" })).toThrow();
    expect(() => markLessonCompleteSchema.parse({ lessonSlug: "interview", summary: "x".repeat(281) })).toThrow();
  });

  it("accepts the interview lesson", () => {
    expect(markProgressSchema.parse({ lessonSlug: "interview" })).toEqual({ lessonSlug: "interview" });
  });

  it("accepts an optional model with lessonSlug", () => {
    expect(
      markProgressSchema.parse({ lessonSlug: "models", model: "anthropic/claude-sonnet-4-5" }),
    ).toMatchObject({
      lessonSlug: "models",
      model: "anthropic/claude-sonnet-4-5",
    });
  });

  it("rejects an unknown lesson slug", () => {
    expect(() => markProgressSchema.parse({ lessonSlug: "nope" })).toThrow();
  });

  it("rejects a body with neither exerciseSlug nor lessonSlug", () => {
    expect(() => markProgressSchema.parse({ model: "anthropic/claude-sonnet-4-5" })).toThrow();
  });
});

describe("completedExerciseSchema", () => {
  it("accepts a completion without deployedUrl", () => {
    expect(() =>
      completedExerciseSchema.parse({
        slug: "deploy-first-worker",
        completedAt: "2026-09-14T12:00:00.000Z",
      }),
    ).not.toThrow();
  });
});

describe("completedLessonSchema", () => {
  it("accepts a completion without model", () => {
    expect(() =>
      completedLessonSchema.parse({
        slug: "models",
        completedAt: "2026-09-14T12:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("rejects an unknown lesson slug", () => {
    expect(() =>
      completedLessonSchema.parse({
        slug: "nope",
        completedAt: "2026-09-14T12:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("progressSchema", () => {
  it("accepts empty completedExercises and completedLessons", () => {
    expect(() =>
      progressSchema.parse({
        studentId: "curious-hacker-2019",
        completedExercises: [],
        completedLessons: [],
        updatedAt: "2026-09-14T12:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("accepts a progress record with one exercise and one lesson completion", () => {
    expect(() =>
      progressSchema.parse({
        studentId: "curious-hacker-2019",
        completedExercises: [
          {
            slug: "deploy-first-worker",
            completedAt: "2026-09-14T12:00:00.000Z",
            deployedUrl: "https://hello.example.workers.dev",
          },
        ],
        completedLessons: [
          {
            slug: "models",
            completedAt: "2026-09-14T12:00:00.000Z",
          },
        ],
        updatedAt: "2026-09-14T12:00:00.000Z",
      }),
    ).not.toThrow();
  });
});
