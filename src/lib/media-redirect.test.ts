import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { GET } from "../pages/media/[...path]";

describe("GET /media/[...path]", () => {
  it("redirects to the same path on media.cfdev.school", async () => {
    const response = await GET({ params: { path: "courses/ai-gateway/overview.mp4" } } as unknown as APIContext);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://media.cfdev.school/courses/ai-gateway/overview.mp4");
  });
});
