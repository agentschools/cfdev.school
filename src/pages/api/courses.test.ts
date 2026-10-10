import type { APIContext } from "astro";
import { describe, expect, it, vi } from "vitest";
import { courseSchema } from "../../schemas/course";

vi.mock("astro:content", () => ({
  getCollection: async (name: string) =>
    ({
      courses: [
        { id: "agent-setup", body: "# Agent setup\n", data: { name: "agent-setup", description: "Set up." } },
        {
          id: "workers-basics",
          body: "# Workers basics\n",
          data: { name: "workers-basics", description: "Ship.", metadata: { author: "Cloudflare Dev School" } },
        },
        { id: "bindings", body: "# Bindings\n", data: { name: "bindings", description: "Learn bindings." } },
      ],
      exercises: [
        { id: "agent-setup/00-interview", body: "# Interview\n", data: {} },
        { id: "agent-setup/01-models", body: "# Models\n", data: { description: "Pick a model." } },
        { id: "workers-basics/01-deploy-a-worker", body: "# Deploy a Worker\n", data: {} },
      ],
      defaultInterview: [{ id: "default-interview", body: "# Interview\n", data: {} }],
    })[name],
}));

function context(): APIContext {
  return { url: new URL("https://school.example/api/courses") } as unknown as APIContext;
}

describe("GET /api/courses", () => {
  it("returns every built-in course, matching the schema, with absolute URLs", async () => {
    const { GET } = await import("./courses");
    const body = await (await GET(context())).json();

    expect(body.map((course: { name: string }) => course.name)).toEqual(["agent-setup", "workers-basics", "bindings"]);
    for (const course of body) expect(courseSchema.parse(course)).toEqual(course);

    const [agentSetup, workersBasics] = body;
    expect(agentSetup.url).toBe("https://school.example/courses/agent-setup");
    expect(agentSetup.markdownUrl).toBe("https://school.example/courses/agent-setup/COURSE.md");
    expect(agentSetup.exercises[1]).toEqual({
      slug: "models",
      title: "Models",
      description: "Pick a model.",
      url: "https://school.example/courses/agent-setup/models",
      markdownUrl: "https://school.example/courses/agent-setup/exercises/01-models.md",
    });
    expect(workersBasics.metadata).toEqual({ author: "Cloudflare Dev School" });
    expect(workersBasics.exercises[0].markdownUrl).toBe("https://school.example/courses/workers-basics/exercises/interview.md");
  });
});
