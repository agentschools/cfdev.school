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
    expect(html.indexOf('data-course-name="agent-setup"')).toBeLessThan(html.indexOf('data-course-name="workers-basics"'));
    expect(html).toMatch(/Course 1\s*· Start here/);
    // Workers basics has one exercise of its own, plus the default interview.
    expect(html).toContain("2 exercises");
  });
});
