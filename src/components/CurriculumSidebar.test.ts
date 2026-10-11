import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", async () => (await import("../test/fake-content")).fakeAstroContent);

async function render(path = "/"): Promise<string> {
  const { default: CurriculumSidebar } = await import("./CurriculumSidebar.astro");
  const container = await AstroContainer.create();
  return container.renderToString(CurriculumSidebar, { request: new Request(`http://localhost${path}`) });
}

describe("CurriculumSidebar", () => {
  it("shows Agent setup with its exercises, then each track with its courses", async () => {
    const html = await render();

    expect(html).toContain('href="/courses/agent-setup/models"');
    const order = ['href="/courses/agent-setup"', ">Projects<", "Coming soon", ">Fundamentals<", 'href="/courses/workers"', 'href="/courses/bindings"'];
    const positions = order.map((text) => html.indexOf(text));
    for (const position of positions) expect(position).toBeGreaterThan(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toContain('href="/courses"');
  });

  it("shows a track course's exercises only on one of its pages", async () => {
    expect(await render()).not.toContain('href="/courses/workers/deploy-a-worker"');

    const html = await render("/courses/workers/deploy-a-worker");
    expect(html).toContain('href="/courses/workers/deploy-a-worker"');
    // Workers has no interview of its own, so it gets the default one.
    expect(html).toContain('href="/courses/workers/interview"');
    expect(html).not.toContain('href="/courses/bindings/live-objects"');
  });

  it("lets Agent setup collapse once complete, except on its own pages", async () => {
    expect(await render()).toContain('data-collapse-when-complete="agent-setup"');
    expect(await render("/courses/agent-setup/models")).not.toContain("data-collapse-when-complete");
  });

  it("numbers each course's exercises from 00, starting with the interview", async () => {
    const html = await render("/courses/workers");

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
