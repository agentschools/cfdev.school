import type { APIContext } from "astro";
import { describe, expect, it, vi } from "vitest";

const fakeEntries = [
  { data: { lessonSlug: "models", harness: "claude-code", title: "Models", agentInstructions: "claude instructions" } },
  { data: { lessonSlug: "models", harness: "codex", title: "Models", agentInstructions: "codex instructions" } },
  { data: { lessonSlug: "models", harness: "generic", title: "Models", agentInstructions: "generic instructions" } },
];

vi.mock("astro:content", () => ({
  getCollection: async (_name: string, filter?: (entry: unknown) => boolean) =>
    filter ? fakeEntries.filter(filter) : fakeEntries,
}));

function context(slug: string, harness?: string): APIContext {
  const url = new URL(`https://example.com/api/lessons/${slug}${harness ? `?harness=${harness}` : ""}`);
  return { params: { slug }, url } as unknown as APIContext;
}

describe("GET /api/lessons/{slug}", () => {
  it("404s for an unknown lesson slug", async () => {
    const { GET } = await import("./[slug]");
    const response = await GET(context("nonexistent"));
    expect(response.status).toBe(404);
  });

  it("returns the requested harness variant", async () => {
    const { GET } = await import("./[slug]");
    const response = await GET(context("models", "codex"));
    const body = await response.json();
    expect(body.harness).toBe("codex");
    expect(body.agentInstructions).toBe("codex instructions");
  });

  it("falls back to generic for a harness with no dedicated variant", async () => {
    const { GET } = await import("./[slug]");
    const response = await GET(context("models", "pi"));
    const body = await response.json();
    expect(body.harness).toBe("generic");
  });

  it("falls back to generic when no harness is given", async () => {
    const { GET } = await import("./[slug]");
    const response = await GET(context("models"));
    const body = await response.json();
    expect(body.harness).toBe("generic");
  });
});
