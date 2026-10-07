import { describe, expect, it } from "vitest";
import { markExerciseCompleteSchema, progressSchema } from "./progress";

describe("markExerciseCompleteSchema", () => {
  const body = { course: "agent-setup", exercise: "models", harness: "claude-code" };

  it("accepts a course, exercise, and harness", () => {
    expect(markExerciseCompleteSchema.parse(body)).toEqual(body);
  });

  it("accepts an optional model and summary", () => {
    const full = { ...body, model: "anthropic/claude-sonnet-4-5", summary: "You're new to Cloudflare." };
    expect(markExerciseCompleteSchema.parse(full)).toEqual(full);
  });

  it("requires a harness", () => {
    expect(() => markExerciseCompleteSchema.parse({ course: "agent-setup", exercise: "models" })).toThrow();
  });

  it("rejects an unknown harness", () => {
    expect(() => markExerciseCompleteSchema.parse({ ...body, harness: "notepad" })).toThrow();
  });

  it("rejects names and slugs that break the naming rules", () => {
    expect(() => markExerciseCompleteSchema.parse({ ...body, course: "Agent Setup" })).toThrow();
    expect(() => markExerciseCompleteSchema.parse({ ...body, exercise: "01-models.md" })).toThrow();
  });

  it("rejects the old lessonSlug and exerciseSlug shapes", () => {
    expect(() => markExerciseCompleteSchema.parse({ lessonSlug: "models", harness: "claude-code" })).toThrow();
    expect(() => markExerciseCompleteSchema.parse({ exerciseSlug: "deploy-first-worker" })).toThrow();
  });

  it("rejects a summary over 280 characters", () => {
    expect(() => markExerciseCompleteSchema.parse({ ...body, summary: "x".repeat(281) })).toThrow();
  });
});

describe("progressSchema", () => {
  it("accepts courses with completed and incomplete exercises", () => {
    const progress = {
      studentId: "curious-hacker-2019",
      courses: [
        {
          name: "agent-setup",
          completedAt: "2026-10-02T12:00:00.000Z",
          exercises: [
            {
              slug: "interview",
              completions: [
                {
                  harness: "claude-code",
                  completedAt: "2026-10-01T12:00:00.000Z",
                  exerciseUrl: "https://school.example/courses/agent-setup/interview",
                  summary: "You're new here.",
                },
              ],
            },
          ],
        },
        { name: "workers-basics", exercises: [{ slug: "interview", completions: [] }] },
      ],
      updatedAt: "2026-10-02T12:00:00.000Z",
    };
    expect(progressSchema.parse(progress)).toEqual(progress);
  });
});
