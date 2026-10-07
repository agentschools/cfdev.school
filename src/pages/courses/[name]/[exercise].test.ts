import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

// Only the 404 paths are covered here. Rendering real content through
// astro:content's render() produces genuine compiled Astro components that
// aren't practical to fake in a unit test; verify the happy path against a
// real running Worker (see AGENTS.md's "Testing Astro components").
vi.mock("astro:content", async () => (await import("../../../test/fake-content")).fakeAstroContent);

describe("exercise page", () => {
  it("404s for an unknown exercise in a known course", async () => {
    const { default: ExercisePage } = await import("./[exercise].astro");
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(ExercisePage, {
      params: { name: "agent-setup", exercise: "nonexistent" },
    });

    expect(response.status).toBe(404);
  });

  it("404s for an unknown course", async () => {
    const { default: ExercisePage } = await import("./[exercise].astro");
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(ExercisePage, { params: { name: "nope", exercise: "models" } });

    expect(response.status).toBe(404);
  });
});
