import { describe, expect, it, vi } from "vitest";

const collections = vi.hoisted(() => ({
  courses: [
    { id: "workers", filePath: "courses/fundamentals/workers/COURSE.md", body: "\n# Workers\n", data: { name: "workers", description: "Ship a Worker." } },
    { id: "agent-setup", filePath: "courses/agent-setup/COURSE.md", body: "\n# Agent setup\n", data: { name: "agent-setup", description: "Set up." } },
    { id: "bindings", filePath: "courses/fundamentals/bindings/COURSE.md", body: "\n# Bindings\n", data: { name: "bindings", description: "Learn bindings." } },
    {
      id: "publish-a-website",
      filePath: "courses/projects/publish-a-website/COURSE.md",
      body: "\n# Publish a website\n",
      data: { name: "publish-a-website", description: "Publish a site." },
    },
    {
      id: "run-a-blog-with-emdash",
      filePath: "courses/projects/run-a-blog-with-emdash/COURSE.md",
      body: "\n# Run a blog with EmDash\n",
      data: { name: "run-a-blog-with-emdash", description: "Run a blog with EmDash." },
    },
    {
      id: "build-a-guestbook",
      filePath: "courses/projects/build-a-guestbook/COURSE.md",
      body: "\n# Build a guestbook\n",
      data: { name: "build-a-guestbook", description: "Build a guestbook." },
    },
    {
      id: "durable-objects",
      filePath: "courses/fundamentals/durable-objects/COURSE.md",
      body: "\n# Durable Objects\n",
      data: { name: "durable-objects", description: "Learn Durable Objects." },
    },
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
      ["publish-a-website", "Publish a website"],
      ["run-a-blog-with-emdash", "Run a blog with EmDash"],
      ["build-a-guestbook", "Build a guestbook"],
      ["workers", "Workers"],
      ["bindings", "Bindings"],
      ["durable-objects", "Durable Objects"],
    ]);
  });

  it("takes each course's track from its directory", async () => {
    const { getBuiltInCourses } = await import("./courses");
    const courses = await getBuiltInCourses();
    expect(courses.map((course) => [course.name, course.track])).toEqual([
      ["agent-setup", undefined],
      ["publish-a-website", "projects"],
      ["run-a-blog-with-emdash", "projects"],
      ["build-a-guestbook", "projects"],
      ["workers", "fundamentals"],
      ["bindings", "fundamentals"],
      ["durable-objects", "fundamentals"],
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
    const [agentSetup, publishAWebsite, , buildAGuestbook, workers, , durableObjects] = courses;

    expect(nextStep(courses, agentSetup, 0).url).toBe("/courses/agent-setup/models");
    expect(nextStep(courses, workers, workers.exercises.length - 1)).toMatchObject({
      url: "/courses/bindings",
      label: "Next course: Bindings →",
    });
    expect(nextStep(courses, durableObjects, durableObjects.exercises.length - 1).url).toBe("/courses");
    expect(nextStep(courses, publishAWebsite, publishAWebsite.exercises.length - 1)).toMatchObject({
      url: "/courses/run-a-blog-with-emdash",
      label: "Next course: Run a blog with EmDash →",
    });
    // The last course in Projects doesn't continue into Fundamentals.
    expect(nextStep(courses, buildAGuestbook, buildAGuestbook.exercises.length - 1).url).toBe("/courses");
  });

  it("sends a student finishing Agent setup to the catalog to pick a track", async () => {
    const { getBuiltInCourses, nextStep } = await import("./courses");
    const courses = await getBuiltInCourses();
    const step = nextStep(courses, courses[0], courses[0].exercises.length - 1);
    expect(step.url).toBe("/courses");
    expect(step.label).toContain("pick a project or the fundamentals");
  });
});
