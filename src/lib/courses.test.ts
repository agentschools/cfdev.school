import { describe, expect, it, vi } from "vitest";

const collections = vi.hoisted(() => ({
  courses: [
    { id: "workers-basics", body: "\n# Workers basics\n", data: { name: "workers-basics", description: "Ship a Worker." } },
    { id: "agent-setup", body: "\n# Agent setup\n", data: { name: "agent-setup", description: "Set up." } },
  ],
  exercises: [
    { id: "agent-setup/10-tools", body: "# Tools\n", data: {} },
    { id: "agent-setup/02-models", body: "# Models\n", data: { description: "Pick a model." } },
    { id: "agent-setup/00-interview", body: "# Interview\n", data: {} },
    { id: "workers-basics/01-deploy-a-worker", body: "# Deploy a Worker\n", data: {} },
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
      ["workers-basics", "Workers basics"],
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
    const course = await getBuiltInCourse("workers-basics");
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
