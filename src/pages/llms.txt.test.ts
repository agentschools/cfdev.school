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
    expect(text).toContain("GET /api/students/{id}/interviews");
    expect(text).toContain("PUT /api/students/{id}/interviews");
    expect(text).not.toMatch(/\/api\/students\/\{id\}\/interview\b/);
    expect(text).toContain("GET /api/harnesses/{harnessId}");
    expect(text).toContain("GET /api/courses");
    expect(text).toContain("GET /api/progress/{studentId}");
    expect(text).toContain("PUT /api/progress/{studentId}");
    expect(text).toContain("PUT /api/students/{id}/courses");
    expect(text).toContain("/default-interview.md");
    expect(text).not.toContain("aren't supported yet");
  });

  it("points agents at the course list instead of hardcoding exercise order", async () => {
    const text = await (await GET({} as APIContext)).text();
    expect(text).toContain("markdownUrl");
    expect(text).toContain("agent-setup");
    expect(text).not.toContain("/api/lessons");
    expect(text).not.toContain("/api/exercises");
  });
});
