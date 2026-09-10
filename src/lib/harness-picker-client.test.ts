import { beforeEach, describe, expect, it, vi } from "vitest";
import { getHarness } from "../data/harnesses";
import { buildPrompt } from "./harness-picker-client";

beforeEach(() => {
  vi.stubGlobal("window", { location: { origin: "https://cloudflare-dev-school.ziki.workers.dev" } });
});

describe("buildPrompt", () => {
  it("embeds the student's id and the current origin", () => {
    const student = { id: "curious-hacker-2019", createdAt: "2026-09-10T12:00:00.000Z" };
    const harness = getHarness("claude-code");

    const prompt = buildPrompt(student, harness);

    expect(prompt).toContain("curious-hacker-2019");
    expect(prompt).toContain("https://cloudflare-dev-school.ziki.workers.dev");
    expect(prompt).toContain("https://cloudflare-dev-school.ziki.workers.dev/llms.txt");
    expect(prompt).toContain(harness.name);
  });
});
