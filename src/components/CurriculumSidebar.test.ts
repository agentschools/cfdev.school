import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", () => ({
  getCollection: async (collection: string) =>
    collection === "lessons" ? [{ data: { lessonSlug: "models" } }] : [{ data: { exerciseSlug: "deploy-first-worker" } }],
}));

describe("CurriculumSidebar", () => {
  it("links lessons and exercises that have content, shows the rest as pending", async () => {
    const { default: CurriculumSidebar } = await import("./CurriculumSidebar.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(CurriculumSidebar);

    expect(html).toContain('href="/lessons/models"');
    expect(html).not.toContain('href="/lessons/instructions"');
    expect(html).toContain("Instructions");

    expect(html).toContain('href="/exercises"');
    expect(html).toContain('href="/exercises/deploy-first-worker"');
    expect(html).not.toContain('href="/exercises/add-first-binding-kv"');
    expect(html).toContain("Add your first Binding: Workers KV");
  });

  it("marks the current page's item with aria-current", async () => {
    const { default: CurriculumSidebar } = await import("./CurriculumSidebar.astro");
    const container = await AstroContainer.create();
    const html = await container.renderToString(CurriculumSidebar, {
      request: new Request("http://localhost/lessons/models"),
    });

    expect(html).toMatch(/href="\/lessons\/models"[^>]*aria-current="page"/);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});
