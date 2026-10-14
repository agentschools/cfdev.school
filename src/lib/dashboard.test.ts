import { describe, expect, it } from "vitest";
import type { ExerciseCompletion, Progress } from "../schemas/progress";
import type { CatalogCourse } from "./course-progress";
import { buildDashboard } from "./dashboard";

const catalog: CatalogCourse[] = [
  {
    name: "agent-setup",
    title: "Agent setup",
    url: "/courses/agent-setup",
    exercises: [
      { slug: "interview", title: "Interview", url: "/courses/agent-setup/interview", description: "Tell your agent about you." },
      { slug: "models", title: "Models", url: "/courses/agent-setup/models", description: "Pick a model." },
    ],
  },
  {
    name: "workers",
    title: "Workers",
    url: "/courses/workers",
    track: "fundamentals",
    exercises: [
      { slug: "interview", title: "Interview", url: "/courses/workers/interview" },
      { slug: "deploy-a-worker", title: "Deploy a Worker", url: "/courses/workers/deploy-a-worker" },
    ],
  },
  {
    name: "bindings",
    title: "Bindings",
    url: "/courses/bindings",
    track: "fundamentals",
    exercises: [{ slug: "interview", title: "Interview", url: "/courses/bindings/interview" }],
  },
];

function done(at: string, harness: ExerciseCompletion["harness"] = "claude-code"): ExerciseCompletion[] {
  return [{ harness, completedAt: at }];
}

/** Completion timestamps per course and exercise slug; anything missing is incomplete. */
function progress(
  completions: Record<string, Record<string, ExerciseCompletion[]>> = {},
  extra: { completed?: string[]; summary?: string } = {},
): Progress {
  return {
    studentId: "curious-hacker-2019",
    courses: catalog.map((course) => ({
      name: course.name,
      ...(extra.completed?.includes(course.name) ? { completedAt: "2026-10-02T00:00:00.000Z" } : {}),
      ...(course.name === "agent-setup" && extra.summary ? { interviewSummary: extra.summary } : {}),
      exercises: course.exercises.map((exercise) => ({
        slug: exercise.slug,
        completions: completions[course.name]?.[exercise.slug] ?? [],
      })),
    })),
    externalCourses: [],
    updatedAt: "2026-10-01T12:00:00.000Z",
  };
}

describe("buildDashboard", () => {
  it("starts a new student on Agent setup's interview", () => {
    const dashboard = buildDashboard(progress(), catalog);
    expect(dashboard.upNext).toEqual({
      kind: "exercise",
      courseTitle: "Agent setup",
      exerciseTitle: "Interview",
      index: 0,
      description: "Tell your agent about you.",
      continuing: false,
    });
    expect(dashboard.courses).toEqual([]);
    expect(dashboard.agents).toEqual([]);
    expect(dashboard.aboutYou).toBeUndefined();
    expect(dashboard.welcome).toBe(true);
  });

  it("stops welcoming the student once the interview starts or anything is completed", () => {
    expect(buildDashboard(progress({}, { summary: "New to agents." }), catalog).welcome).toBe(false);
    expect(buildDashboard(progress({ workers: { interview: done("2026-10-01T10:00:00.000Z") } }), catalog).welcome).toBe(false);
  });

  it("continues the unfinished course with the most recent completion", () => {
    const dashboard = buildDashboard(
      progress({
        "agent-setup": { interview: done("2026-10-01T10:00:00.000Z") },
        workers: { interview: done("2026-10-01T11:00:00.000Z", "codex") },
      }),
      catalog,
    );
    expect(dashboard.upNext).toMatchObject({
      courseTitle: "Workers",
      exerciseTitle: "Deploy a Worker",
      index: 1,
      continuing: true,
    });
    expect(dashboard.courses).toEqual([
      {
        id: "start",
        courses: [{ title: "Agent setup", url: "/courses/agent-setup", external: false, done: 1, segments: [true, false], next: "Models" }],
      },
      {
        id: "fundamentals",
        title: "Fundamentals",
        courses: [
          {
            title: "Workers",
            url: "/courses/workers",
            external: false,
            track: "fundamentals",
            done: 1,
            segments: [true, false],
            next: "Deploy a Worker",
          },
        ],
      },
    ]);
    expect(dashboard.agents).toEqual([
      { harness: "claude-code", exercises: 1 },
      { harness: "codex", exercises: 1 },
    ]);
  });

  it("offers the tracks once Agent setup is done and nothing else is in progress", () => {
    const setupDone = { interview: done("2026-10-01T10:00:00.000Z"), models: done("2026-10-01T11:00:00.000Z") };
    const dashboard = buildDashboard(
      progress({ "agent-setup": setupDone }, { completed: ["agent-setup"], summary: "You're new here." }),
      catalog,
    );
    expect(dashboard.upNext).toEqual({ kind: "choose", justFinishedAgentSetup: true });
    expect(dashboard.aboutYou).toBe("You're new here.");
    expect(dashboard.courses[0].courses[0]).toMatchObject({ completedAt: "2026-10-02T00:00:00.000Z", done: 2 });
    expect(dashboard.courses[0].courses[0].next).toBeUndefined();
    expect(dashboard.agents).toEqual([{ harness: "claude-code", exercises: 2 }]);
    expect(dashboard.trackStarts).toEqual({ fundamentals: { title: "Workers", url: "/courses/workers" } });
  });

  it("points each track at its first unfinished course, and says when more than Agent setup is done", () => {
    const all = { interview: done("2026-10-01T10:00:00.000Z"), models: done("2026-10-01T10:00:00.000Z") };
    const dashboard = buildDashboard(
      progress(
        {
          "agent-setup": all,
          workers: { interview: done("2026-10-01T11:00:00.000Z"), "deploy-a-worker": done("2026-10-01T12:00:00.000Z") },
        },
        { completed: ["agent-setup", "workers"] },
      ),
      catalog,
    );
    expect(dashboard.upNext).toEqual({ kind: "choose", justFinishedAgentSetup: false });
    expect(dashboard.trackStarts.fundamentals).toEqual({ title: "Bindings", url: "/courses/bindings" });
  });
});
