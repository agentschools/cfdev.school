import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", async () => (await import("../test/fake-content")).fakeAstroContent);

async function render(path = "/"): Promise<string> {
  const { default: CurriculumSidebar } = await import("./CurriculumSidebar.astro");
  const container = await AstroContainer.create();
  return container.renderToString(CurriculumSidebar, { request: new Request(`http://localhost${path}`) });
}

describe("CurriculumSidebar", () => {
  it("links each built-in course, in order, and each of its exercises", async () => {
    const html = await render();

    expect(html.indexOf('href="/courses/agent-setup"')).toBeLessThan(html.indexOf('href="/courses/workers-basics"'));
    expect(html).toContain('href="/courses/agent-setup/models"');
    expect(html).toContain('href="/courses/workers-basics/deploy-a-worker"');
    // Workers basics has no interview of its own, so it gets the default one.
    expect(html).toContain('href="/courses/workers-basics/interview"');
    expect(html).toContain('href="/courses"');
  });

  it("numbers each course's exercises from 00, starting with the interview", async () => {
    const html = await render();

    expect(html).toMatch(/00\.<\/span>\s*Interview/);
    expect(html).toMatch(/01\.<\/span>\s*Models/);
    expect(html).toMatch(/01\.<\/span>\s*Deploy a Worker/);
  });

  it("marks the current page's item with aria-current", async () => {
    const html = await render("/courses/agent-setup/models");

    expect(html).toMatch(/href="\/courses\/agent-setup\/models"[^>]*aria-current="page"/);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});
