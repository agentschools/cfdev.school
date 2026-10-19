import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import Profile from "./profile.astro";

// The page and the global CurriculumSidebar read the course content
// collections. See AGENTS.md's "Testing Astro components" note.
vi.mock("astro:content", async () => (await import("../test/fake-content")).fakeAstroContent);

describe("/profile", () => {
  it("renders the enroll nudge, the empty state, and the built-in catalog for the client, all hidden until it knows the student", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Profile);

    expect(html).toMatch(/<h1[^>]*>Profile<\/h1>/);
    expect(html).toMatch(/id="profile-enroll-nudge"[^>]*hidden/);
    expect(html).toMatch(/id="profile-empty"[^>]*hidden/);
    expect(html).toContain('href="/courses/agent-setup"');
    expect(html).toContain("data-catalog=");
    expect(html).toContain("&quot;/courses/workers/deploy-a-worker&quot;");
    expect(html).toContain("&quot;generic&quot;:&quot;Unknown agent&quot;");
  });

  it("keeps later color changes in collapsed appearance settings, outside the header", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Profile);
    expect(html).toMatch(/<details class="appearance-settings"[^>]*>/);
    expect(html).not.toMatch(/<details class="appearance-settings"[^>]*open/);
    expect(html).toContain("Appearance settings</summary>");
    expect(html).toContain("data-color-selector");
    expect(html.match(/<header[\s\S]*?<\/header>/)![0]).not.toContain("data-color-selector");
  });

  it("links to itself from the sidebar's Account section", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Profile, { request: new Request("https://school.example/profile") });

    expect(html).toMatch(/href="\/profile" aria-current="page"/);
  });
});
