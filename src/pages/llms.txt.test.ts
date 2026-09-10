import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { GET } from "./llms.txt";

describe("GET /llms.txt", () => {
  it("serves plain text describing the real API surface", async () => {
    const response = await GET({} as APIContext);
    expect(response.headers.get("Content-Type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("Cloudflare Dev School");
    expect(text).toContain("POST /api/students");
    expect(text).toContain("GET /api/openapi.json");
  });
});
