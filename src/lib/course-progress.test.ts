import { describe, expect, it } from "vitest";
import type { Progress } from "../schemas/progress";
import { type CatalogCourse, startedCourses } from "./course-progress";

const catalog: CatalogCourse[] = [
  {
    name: "agent-setup",
    title: "Agent setup",
    url: "/courses/agent-setup",
    exercises: [
      { slug: "interview", title: "Interview", url: "/courses/agent-setup/interview" },
      { slug: "models", title: "Models", url: "/courses/agent-setup/models" },
    ],
  },
  {
    name: "workers",
    title: "Workers",
    url: "/courses/workers",
    exercises: [{ slug: "interview", title: "Interview", url: "/courses/workers/interview" }],
  },
];

const completion = {
  harness: "claude-code" as const,
  completedAt: "2026-10-01T12:00:00.000Z",
  exerciseUrl: "https://school.example/courses/agent-setup/interview",
};

function progress(overrides: Partial<Progress> = {}): Progress {
  return {
    studentId: "curious-hacker-2019",
    courses: [
      {
        name: "agent-setup",
        exercises: [
          { slug: "interview", completions: [] },
          { slug: "models", completions: [] },
        ],
      },
      { name: "workers", exercises: [{ slug: "interview", completions: [] }] },
    ],
    externalCourses: [],
    updatedAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("startedCourses", () => {
  it("is empty for a new student", () => {
    expect(startedCourses(progress(), catalog)).toEqual([]);
  });

  it("counts a built-in course as started once it has a completion or an interview, with titles from the catalog", () => {
    const started = startedCourses(
      progress({
        courses: [
          {
            name: "agent-setup",
            exercises: [
              { slug: "interview", completions: [completion] },
              { slug: "models", completions: [] },
            ],
          },
          { name: "workers", interviewSummary: "You're new to Workers.", exercises: [{ slug: "interview", completions: [] }] },
        ],
      }),
      catalog,
    );

    expect(started.map((course) => [course.title, course.remaining])).toEqual([
      ["Agent setup", 1],
      ["Workers", 1],
    ]);
    expect(started[0]).toMatchObject({
      url: "/courses/agent-setup",
      external: false,
      exercises: [
        { title: "Interview", url: "/courses/agent-setup/interview", completions: [completion] },
        { title: "Models", url: "/courses/agent-setup/models", completions: [] },
      ],
    });
  });

  it("counts exercises added since a completed course was finished", () => {
    const [course] = startedCourses(
      progress({
        courses: [
          {
            name: "agent-setup",
            completedAt: "2026-10-01T12:00:00.000Z",
            exercises: [
              { slug: "interview", completions: [completion] },
              { slug: "models", completions: [] },
            ],
          },
        ],
      }),
      catalog,
    );
    expect(course).toMatchObject({ completedAt: "2026-10-01T12:00:00.000Z", remaining: 1 });
  });

  it("lists reported courses after the built-in ones, linking out", () => {
    const started = startedCourses(
      progress({
        courses: [{ name: "agent-setup", exercises: [{ slug: "interview", completions: [completion] }] }],
        externalCourses: [
          {
            url: "https://github.com/acme/durable-objects",
            title: "Durable Objects",
            exercises: [{ slug: "interview", title: "Interview", url: "https://school.example/default-interview.md", completions: [] }],
          },
        ],
      }),
      catalog,
    );
    expect(started.map((course) => [course.title, course.url, course.external])).toEqual([
      ["Agent setup", "/courses/agent-setup", false],
      ["Durable Objects", "https://github.com/acme/durable-objects", true],
    ]);
  });
});

describe("groupByTrack", () => {
  it("puts courses outside any track first, then each track, then courses hosted elsewhere, leaving out empty groups", async () => {
    const { groupByTrack } = await import("./course-progress");
    const courses = [
      { title: "Bindings", track: "fundamentals" as const, external: false },
      { title: "Somebody's course", external: true },
      { title: "Agent setup", external: false },
      { title: "Workers", track: "fundamentals" as const, external: false },
    ];
    expect(groupByTrack(courses).map((group) => [group.id, group.title, group.courses.map((c) => c.title)])).toEqual([
      ["start", undefined, ["Agent setup"]],
      ["fundamentals", "Fundamentals", ["Bindings", "Workers"]],
      ["elsewhere", "Hosted elsewhere", ["Somebody's course"]],
    ]);
  });
});
