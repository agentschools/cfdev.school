import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import { fakeAstroContent } from "../../test/fake-content";
import Index from "./index.astro";

vi.mock("astro:content", async () => (await import("../../test/fake-content")).fakeAstroContent);

describe("courses index", () => {
  it("lists every built-in course in order with a link, description, and exercise count", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    for (const course of await fakeAstroContent.getCollection("courses")) {
      expect(html).toContain(`href="/courses/${course.id}"`);
      expect(html).toContain(course.data.description);
    }
    expect(html).toContain("Start here");
    // Agent setup, then Projects (no courses yet), then Fundamentals.
    const order = ['data-course-name="agent-setup"', 'data-group="projects"', 'data-course-name="publish-a-website"', 'data-group="fundamentals"', 'data-course-name="workers"', 'data-course-name="bindings"'];
    const positions = order.map((text) => html.indexOf(text));
    for (const position of positions) expect(position).toBeGreaterThan(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Workers has one exercise of its own, plus the default interview.
    expect(html).toContain("2 exercises");
  });
});
