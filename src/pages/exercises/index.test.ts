import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import { listExercises } from "../../data/exercises";
import Index from "./index.astro";

// The global CurriculumSidebar (rendered by Layout) reads the content
// collections to decide which entries are linkable. See AGENTS.md's
// "Testing Astro components" note.
vi.mock("astro:content", () => ({
  getCollection: async (collection: string) =>
    collection === "lessons" ? [{ data: { lessonSlug: "models" } }] : [{ data: { exerciseSlug: "deploy-first-worker" } }],
}));

describe("exercises index", () => {
  it("lists every exercise with a link, order label, and hidden completion check", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    for (const exercise of listExercises()) {
      expect(html).toContain(`href="/exercises/${exercise.slug}"`);
      expect(html).toContain(exercise.title);
      expect(html).toContain(exercise.description);
      expect(html).toContain(`Exercise ${exercise.order}`);
      expect(html).toContain(`data-exercise-slug="${exercise.slug}"`);
    }
  });
});
