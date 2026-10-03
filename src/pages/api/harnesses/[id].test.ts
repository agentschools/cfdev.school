import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { harnessProfileSchema } from "../../../data/harnesses";
import { GET } from "./[id]";

function context(id: string): APIContext {
  return { params: { id } } as unknown as APIContext;
}

describe("GET /api/harnesses/{id}", () => {
  it("returns the harness profile when the id exists", async () => {
    const response = await GET(context("claude-code"));
    expect(response.status).toBe(200);
    const body = harnessProfileSchema.parse(await response.json());
    expect(body.instructionsFile.path).toContain("~/.claude/CLAUDE.md");
  });

  it("404s for an unknown id", async () => {
    const response = await GET(context("nope"));
    expect(response.status).toBe(404);
  });
});
