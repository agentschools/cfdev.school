import { describe, expect, it } from "vitest";
import { markExerciseCompleteSchema, progressSchema } from "./progress";

describe("markExerciseCompleteSchema", () => {
  const body = { course: "agent-setup", exercise: "models", harness: "claude-code" };

  it("accepts a course, exercise, and harness", () => {
    expect(markExerciseCompleteSchema.parse(body)).toEqual(body);
  });

  it("accepts an optional model", () => {
    const full = { ...body, model: "anthropic/claude-sonnet-4-5" };
    expect(markExerciseCompleteSchema.parse(full)).toEqual(full);
  });

  it("requires a harness", () => {
    expect(() => markExerciseCompleteSchema.parse({ course: "agent-setup", exercise: "models" })).toThrow();
  });

  it("rejects an unknown harness", () => {
    expect(() => markExerciseCompleteSchema.parse({ ...body, harness: "notepad" })).toThrow();
  });

  it("accepts an https URL for a course hosted elsewhere", () => {
    const external = { ...body, course: "https://github.com/acme/durable-objects.git" };
    expect(markExerciseCompleteSchema.parse(external)).toEqual(external);
    expect(() => markExerciseCompleteSchema.parse({ ...body, course: "http://github.com/acme/durable-objects" })).toThrow();
  });

  it("rejects names and slugs that break the naming rules", () => {
    expect(() => markExerciseCompleteSchema.parse({ ...body, course: "Agent Setup" })).toThrow();
    expect(() => markExerciseCompleteSchema.parse({ ...body, exercise: "01-models.md" })).toThrow();
  });

  it("rejects the old lessonSlug and exerciseSlug shapes", () => {
    expect(() => markExerciseCompleteSchema.parse({ lessonSlug: "models", harness: "claude-code" })).toThrow();
    expect(() => markExerciseCompleteSchema.parse({ exerciseSlug: "deploy-first-worker" })).toThrow();
  });

  it("drops a summary, which moved to interviews", () => {
    expect(markExerciseCompleteSchema.parse({ ...body, summary: "You're new here." })).toEqual(body);
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
          interviewSummary: "You're new here.",
          exercises: [
            {
              slug: "interview",
              completions: [
                {
                  harness: "claude-code",
                  completedAt: "2026-10-01T12:00:00.000Z",
                  exerciseUrl: "https://school.example/courses/agent-setup/interview",
                },
              ],
            },
          ],
        },
        { name: "workers-basics", exercises: [{ slug: "interview", completions: [] }] },
      ],
      externalCourses: [
        {
          url: "https://github.com/acme/durable-objects",
          title: "Durable Objects",
          exercises: [
            { slug: "interview", title: "Interview", url: "https://school.example/default-interview.md", completions: [] },
          ],
        },
      ],
      updatedAt: "2026-10-02T12:00:00.000Z",
    };
    expect(progressSchema.parse(progress)).toEqual(progress);
  });
});
