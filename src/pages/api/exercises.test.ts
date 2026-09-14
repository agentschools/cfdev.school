import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";
import { GET } from "./exercises";

describe("GET /api/exercises", () => {
  it("lists the v1 exercise catalog", async () => {
    const response = await GET({} as APIContext);
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      slug: string;
      agentInstructions: string;
      content: string;
    }>;
    expect(body).toHaveLength(1);
    expect(body[0]?.slug).toBe("deploy-first-worker");
    expect(body[0]?.agentInstructions).toBeTruthy();
    expect(body[0]?.content).toBeTruthy();
  });
});
