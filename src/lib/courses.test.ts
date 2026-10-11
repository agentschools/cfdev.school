import { describe, expect, it, vi } from "vitest";

const collections = vi.hoisted(() => ({
  courses: [
    { id: "workers", filePath: "courses/fundamentals/workers/COURSE.md", body: "\n# Workers\n", data: { name: "workers", description: "Ship a Worker." } },
    { id: "agent-setup", filePath: "courses/agent-setup/COURSE.md", body: "\n# Agent setup\n", data: { name: "agent-setup", description: "Set up." } },
    { id: "bindings", filePath: "courses/fundamentals/bindings/COURSE.md", body: "\n# Bindings\n", data: { name: "bindings", description: "Learn bindings." } },
  ],
  exercises: [
    { id: "agent-setup/10-tools", body: "# Tools\n", data: {} },
    { id: "agent-setup/02-models", body: "# Models\n", data: { description: "Pick a model." } },
    { id: "agent-setup/00-interview", body: "# Interview\n", data: {} },
    { id: "workers/01-deploy-a-worker", body: "# Deploy a Worker\n", data: {} },
  ],
  defaultInterview: [{ id: "default-interview", body: "# Interview\n", data: { description: "Default." } }],
}));

vi.mock("astro:content", () => ({
  getCollection: async (name: keyof typeof collections) => collections[name],
}));

describe("getBuiltInCourses", () => {
  it("returns courses in catalog order with titles from their # heading", async () => {
    const { getBuiltInCourses } = await import("./courses");
    const courses = await getBuiltInCourses();
    expect(courses.map((course) => [course.name, course.title])).toEqual([
      ["agent-setup", "Agent setup"],
      ["workers", "Workers"],
      ["bindings", "Bindings"],
    ]);
  });

  it("takes each course's track from its directory", async () => {
    const { getBuiltInCourses } = await import("./courses");
    const courses = await getBuiltInCourses();
    expect(courses.map((course) => [course.name, course.track])).toEqual([
      ["agent-setup", undefined],
      ["workers", "fundamentals"],
      ["bindings", "fundamentals"],
    ]);
  });

  it("orders exercises by filename, naturally, with slugs from filenames", async () => {
    const { getBuiltInCourse } = await import("./courses");
    const course = await getBuiltInCourse("agent-setup");
    expect(course?.exercises.map((exercise) => [exercise.slug, exercise.title, exercise.file])).toEqual([
      ["interview", "Interview", "00-interview.md"],
      ["models", "Models", "02-models.md"],
      ["tools", "Tools", "10-tools.md"],
    ]);
    expect(course?.exercises[1].description).toBe("Pick a model.");
  });

  it("adds the default interview first to a course without one", async () => {
    const { getBuiltInCourse } = await import("./courses");
    const course = await getBuiltInCourse("workers");
    expect(course?.exercises.map((exercise) => [exercise.slug, exercise.file])).toEqual([
      ["interview", "interview.md"],
      ["deploy-a-worker", "01-deploy-a-worker.md"],
    ]);
    expect(course?.exercises[0].entry.id).toBe("default-interview");
  });

  it("returns undefined for an unknown course", async () => {
    const { getBuiltInCourse } = await import("./courses");
    expect(await getBuiltInCourse("nope")).toBeUndefined();
  });
});

describe("nextStep", () => {
  it("points to the next exercise, then the next course in the same track, then the catalog", async () => {
    const { getBuiltInCourses, nextStep } = await import("./courses");
    const courses = await getBuiltInCourses();
    const [agentSetup, workers, bindings] = courses;

    expect(nextStep(courses, agentSetup, 0).url).toBe("/courses/agent-setup/models");
    expect(nextStep(courses, workers, workers.exercises.length - 1)).toMatchObject({
      url: "/courses/bindings",
      label: "Next course: Bindings →",
    });
    expect(nextStep(courses, bindings, bindings.exercises.length - 1).url).toBe("/courses");
  });

  it("sends a student finishing Agent setup to the catalog to pick a track", async () => {
    const { getBuiltInCourses, nextStep } = await import("./courses");
    const courses = await getBuiltInCourses();
    const step = nextStep(courses, courses[0], courses[0].exercises.length - 1);
    expect(step.url).toBe("/courses");
    expect(step.label).toContain("pick a project or the fundamentals");
  });
});
