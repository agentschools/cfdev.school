import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

// Only the 404 path is covered here, for the same reason as the exercise
// page: render() output isn't practical to fake.
vi.mock("astro:content", async () => (await import("../../../test/fake-content")).fakeAstroContent);

describe("course page", () => {
  it("404s for an unknown course", async () => {
    const { default: CoursePage } = await import("./index.astro");
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(CoursePage, { params: { name: "nope" } });

    expect(response.status).toBe(404);
  });
});
