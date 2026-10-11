import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import { harnesses } from "../data/harnesses";
import Index from "./index.astro";

// The homepage and the global CurriculumSidebar (rendered by Layout) read the
// course content collections. See AGENTS.md's "Testing Astro components" note.
vi.mock("astro:content", async () => (await import("../test/fake-content")).fakeAstroContent);

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

  it("renders the sidebar with Agent setup's exercises and the track courses linked", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toContain('href="/courses/agent-setup/models"');
    expect(html).toContain('href="/courses/agent-setup/instructions"');
    expect(html).toContain('href="/courses/workers"');
  });

  it("renders the enrolled dashboard shell, filled in client-side, with the catalog and harness names it needs", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toMatch(/id="up-next"[^>]*data-loading/);
    expect(html).toContain('id="dashboard-prompt-copy"');
    expect(html).toMatch(/id="your-courses"[^>]*hidden/);
    expect(html).toContain('href="/profile"');
    expect(html).toMatch(/id="about-you"[^>]*hidden/);
    expect(html).toMatch(/id="your-agents"[^>]*hidden/);
    expect(html).toContain("&quot;/courses/workers/deploy-a-worker&quot;");
    expect(html).toContain("&quot;Claude Code&quot;");
    // Marks the page enrolled before paint, so returning students don't see the hero.
    expect(html).toContain('localStorage.getItem("cfDevSchool.student")');
  });

  it("offers the tracks after Agent setup, available ones first", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).toMatch(/data-track-start="fundamentals"/);
    expect(html.indexOf("Learn how it works")).toBeLessThan(html.indexOf("Build something"));
    expect(html).toContain("Coming soon");
  });

  it("does not render the old anchor-nav header or in-page outline", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Index);

    expect(html).not.toContain('href="#harnesses"');
    expect(html).not.toContain('href="#how-it-works"');
  });
});
