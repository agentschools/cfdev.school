import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", () => ({
  getCollection: async () => [{ data: { lessonSlug: "models" } }],
}));

describe("CurriculumSidebar", () => {
  it("links only lessons with content, shows the rest as pending, and lists exercises", async () => {
    const { default: CurriculumSidebar } = await import("./CurriculumSidebar.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(CurriculumSidebar);

    expect(html).toContain('href="/lessons/models"');
    expect(html).not.toContain('href="/lessons/instructions"');
    expect(html).toContain("Instructions");
    expect(html).toContain("Deploy your first Worker");
    expect(html).toContain("Add your first Binding: Workers KV");
  });
});
