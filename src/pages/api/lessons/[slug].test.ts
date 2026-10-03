import type { APIContext } from "astro";
import { describe, expect, it, vi } from "vitest";

const fakeEntries = [
  { data: { lessonSlug: "models", title: "Models", description: "Pick a model", quiz: true, agentInstructions: "models instructions" } },
  { data: { lessonSlug: "tools", title: "Tools", description: "Add tools", quiz: true, agentInstructions: "tools instructions" } },
];

vi.mock("astro:content", () => ({
  getCollection: async (_name: string, filter?: (entry: unknown) => boolean) =>
    filter ? fakeEntries.filter(filter) : fakeEntries,
}));

function context(slug: string): APIContext {
  return { params: { slug } } as unknown as APIContext;
}

describe("GET /api/lessons/{slug}", () => {
  it("404s for an unknown lesson slug", async () => {
    const { GET } = await import("./[slug]");
    const response = await GET(context("nonexistent"));
    expect(response.status).toBe(404);
  });

  it("returns the lesson's content", async () => {
    const { GET } = await import("./[slug]");
    const response = await GET(context("models"));
    const body = await response.json();
    expect(body).toEqual({
      slug: "models",
      title: "Models",
      description: "Pick a model",
      quiz: true,
      agentInstructions: "models instructions",
    });
  });
});
