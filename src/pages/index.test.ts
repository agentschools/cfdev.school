import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import { harnesses } from "../data/harnesses";
import Index from "./index.astro";

// The global CurriculumSidebar (rendered by Layout) reads the "lessons" content
// collection to decide which lessons are linkable yet. See AGENTS.md's
// "Testing Astro components" note.
vi.mock("astro:content", () => ({
  getCollection: async () => [
    { data: { lessonSlug: "models" } },
    { data: { lessonSlug: "instructions" } },
    { data: { lessonSlug: "cli" } },
    { data: { lessonSlug: "skills" } },
    { data: { lessonSlug: "tools" } },
  ],
}));

describe("homepage", () => {
  it("renders the headline, blurb, enroll CTA, and a monochrome logo for every harness", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain("You and your agent, ready for Cloudflare.");
    expect(html).toContain("setting up your favorite agent harness to work well with Cloudflare");
    expect(html).toContain('id="harnesses"');
    expect(html).toContain("Enroll — it takes 2 seconds");
    expect(html).toContain("Free forever. No account required.");

    for (const harness of harnesses.filter((h) => h.id !== "generic" && h.icon)) {
      expect(html).toContain(`data-tooltip="${harness.name}"`);
      expect(html).toContain(`aria-label="${harness.name}"`);
      expect(html).toContain(harness.icon!.mono);
    }
  });

  it("shows a sample student ID card and the sidebar brand to logged-out visitors, with no header Enroll button", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain('id="student-id-card"');
    expect(html).not.toMatch(/id="student-id-card"[^>]*hidden/);
    expect(html).toContain("smooth-operator-4629");
    expect(html).toContain(">Dev School</a>");
    expect(html.match(/data-enroll-trigger/g)).toHaveLength(1);
  });

  it("renders the sidebar with available lessons linked and unshipped ones as pending", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain('href="/lessons/models"');
    expect(html).toContain('href="/lessons/instructions"');
    expect(html).toContain('href="/lessons/cli"');
    expect(html).toContain('href="/lessons/skills"');
    expect(html).toContain('href="/lessons/tools"');
  });

  it("does not render the old anchor-nav header or in-page outline", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).not.toContain('href="#harnesses"');
    expect(html).not.toContain('href="#how-it-works"');
  });

  it("renders the agent prompt box, hidden by default, with no harness picker", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain('id="agent-prompt"');
    expect(html).toContain('id="agent-prompt-copy"');
    expect(html).not.toContain("harness-picker");
    expect(html).not.toContain("Pick your agent");
  });
});
