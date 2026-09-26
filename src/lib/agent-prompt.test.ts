import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPrompt } from "./agent-prompt";

beforeEach(() => {
  vi.stubGlobal("window", { location: { origin: "https://cloudflare-dev-school.ziki.workers.dev" } });
});

describe("buildPrompt", () => {
  it("embeds the student's id, points at the Interview by default, and fetches llms.txt", () => {
    const student = { id: "curious-hacker-2019", createdAt: "2026-09-10T12:00:00.000Z" };

    const prompt = buildPrompt(student);

    expect(prompt).toBe(
      [
        "I'm enrolled in Cloudflare Dev School as curious-hacker-2019",
        "",
        'Let\'s work on the "Interview" lesson together!',
        "",
        "Fetch https://cloudflare-dev-school.ziki.workers.dev/llms.txt for instructions.",
      ].join("\n"),
    );
  });

  it("names the exercise when given an exercise context", () => {
    const student = { id: "curious-hacker-2019", createdAt: "2026-09-10T12:00:00.000Z" };

    const prompt = buildPrompt(student, { kind: "exercise", title: "Deploy your first Worker" });

    expect(prompt).toContain('Let\'s work on the "Deploy your first Worker" exercise together!');
    expect(prompt).toContain("Fetch https://cloudflare-dev-school.ziki.workers.dev/llms.txt for instructions.");
  });
});
