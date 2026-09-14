import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { GET } from "./[slug]";

function context(slug: string): APIContext {
  return { params: { slug } } as unknown as APIContext;
}

describe("GET /api/exercises/{slug}", () => {
  it("returns the exercise when the slug exists", async () => {
    const response = await GET(context("deploy-first-worker"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { slug: string; title: string };
    expect(body.slug).toBe("deploy-first-worker");
    expect(body.title).toContain("Deploy");
  });

  it("404s for an unknown slug", async () => {
    const response = await GET(context("nope"));
    expect(response.status).toBe(404);
  });
});
