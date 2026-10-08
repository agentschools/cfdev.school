import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorPrompt, buildPrompt } from "./agent-prompt";

const student = { id: "curious-hacker-2019", createdAt: "2026-09-10T12:00:00.000Z" };

beforeEach(() => {
  vi.stubGlobal("window", { location: { origin: "https://cloudflare-dev-school.ziki.workers.dev" } });
});

describe("buildPrompt", () => {
  it("embeds the student's id, points at Agent setup's interview by default, and fetches llms.txt", () => {
    expect(buildPrompt(student)).toBe(
      [
        "I'm enrolled in Cloudflare Dev School as curious-hacker-2019",
        "",
        'Let\'s work on the "Interview" exercise from the "Agent setup" course together!',
        "",
        "Fetch https://cloudflare-dev-school.ziki.workers.dev/llms.txt for instructions.",
      ].join("\n"),
    );
  });

  it("names the exercise and its course", () => {
    const prompt = buildPrompt(student, { courseTitle: "Workers basics", exerciseTitle: "Deploy a Worker" });

    expect(prompt).toContain('Let\'s work on the "Deploy a Worker" exercise from the "Workers basics" course together!');
    expect(prompt).toContain("Fetch https://cloudflare-dev-school.ziki.workers.dev/llms.txt for instructions.");
  });

  it("names just the course when there's no exercise", () => {
    expect(buildPrompt(student, { courseTitle: "Workers basics" })).toContain(
      'Let\'s work on the "Workers basics" course together!',
    );
  });

  it("asks to redo an exercise the student already completed", () => {
    const prompt = buildPrompt(student, { courseTitle: "Agent setup", exerciseTitle: "Models", redo: true });

    expect(prompt).toContain(
      'Let\'s redo the "Models" exercise from the "Agent setup" course together, even though I\'ve already completed it.',
    );
  });
});

describe("buildAuthorPrompt", () => {
  it("points the author's agent at this site's authors guide, with no student ID", () => {
    expect(buildAuthorPrompt()).toBe(
      [
        "I want to create a course for Cloudflare Dev School.",
        "",
        "Read https://cloudflare-dev-school.ziki.workers.dev/authors.md, then help me plan and write it.",
      ].join("\n"),
    );
  });
});
