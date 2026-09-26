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
  ],
}));

describe("homepage", () => {
  it("renders the prerequisite statement, enroll CTA, and every harness card", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain(
      "All you need to get started is a working AI coding agent on your computer. We'll walk you through setting up Cloudflare.",
    );
    expect(html).toContain('id="harnesses"');
    expect(html).toContain("Enroll in Cloudflare Dev School");
    expect(html).toContain("Free forever. No account required. No personal data collected.");

    for (const harness of harnesses) {
      expect(html).toContain(harness.name);
      if (harness.icon) {
        expect(html).toContain(harness.icon.light);
        expect(html).toContain(harness.icon.dark);
      }
    }
  });

  it("renders the sidebar with available lessons linked and unshipped ones as pending", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain('href="/lessons/models"');
    expect(html).toContain('href="/lessons/instructions"');
    expect(html).not.toContain('href="/lessons/cli"');
    expect(html).toContain("CLI");
  });

  it("does not render the old anchor-nav header or in-page outline", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).not.toContain('href="#harnesses"');
    expect(html).not.toContain('href="#how-it-works"');
  });

  it("renders a harness picker option and the agent prompt box for every harness, hidden by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain('id="harness-picker"');
    expect(html).toContain('id="agent-prompt"');
    expect(html).toContain('id="agent-prompt-copy"');

    for (const harness of harnesses) {
      expect(html).toContain(`data-harness-id="${harness.id}"`);
    }
  });
});
