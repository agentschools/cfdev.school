import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

// Only the 404 path is covered here. Rendering real content through
// astro:content's render() produces genuine compiled Astro components that
// aren't practical to fake in a unit test; verify the happy path against a
// real running Worker (see AGENTS.md's "Testing Astro components").
vi.mock("astro:content", () => ({
  getCollection: async () => [],
  render: async () => ({ Content: () => null }),
}));

describe("lesson page", () => {
  it("404s for an unknown lesson slug", async () => {
    const { default: LessonPage } = await import("./[slug].astro");
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(LessonPage, { params: { slug: "nonexistent" } });

    expect(response.status).toBe(404);
  });
});
