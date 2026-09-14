import { describe, expect, it } from "vitest";
import { completedExerciseSchema, markProgressSchema, progressSchema } from "./progress";

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

describe("progressSchema", () => {
  it("accepts empty completedExercises", () => {
    expect(() =>
      progressSchema.parse({
        studentId: "curious-hacker-2019",
        completedExercises: [],
        updatedAt: "2026-09-14T12:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("accepts a progress record with one completion", () => {
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
        updatedAt: "2026-09-14T12:00:00.000Z",
      }),
    ).not.toThrow();
  });
});
