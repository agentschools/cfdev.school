import { describe, expect, it } from "vitest";
import { formatCompletedBanner } from "./exercise-client";

const names = { "claude-code": "Claude Code", codex: "OpenAI Codex", pi: "Pi", generic: "an unknown agent" };

describe("formatCompletedBanner", () => {
  it("names the agent for a single completion", () => {
    const text = formatCompletedBanner([{ harness: "claude-code", completedAt: "2026-10-01T18:00:00.000Z" }], names);
    expect(text).toBe("You completed this exercise on October 1, 2026 using Claude Code.");
  });

  it("lists every agent's completion, oldest first", () => {
    const text = formatCompletedBanner(
      [
        { harness: "codex", completedAt: "2026-11-01T18:00:00.000Z" },
        { harness: "claude-code", completedAt: "2026-10-01T18:00:00.000Z" },
      ],
      names,
    );
    expect(text).toBe(
      "You completed this exercise on October 1, 2026 using Claude Code and on November 1, 2026 using OpenAI Codex.",
    );
  });

  it("uses an Oxford comma for three or more agents and the generic name for unknown agents", () => {
    const text = formatCompletedBanner(
      [
        { harness: "claude-code", completedAt: "2026-10-01T18:00:00.000Z" },
        { harness: "pi", completedAt: "2026-10-02T18:00:00.000Z" },
        { harness: "generic", completedAt: "2026-10-03T18:00:00.000Z" },
      ],
      names,
    );
    expect(text).toBe(
      "You completed this exercise on October 1, 2026 using Claude Code, on October 2, 2026 using Pi, and on October 3, 2026 using an unknown agent.",
    );
  });

  it("leaves out the agent when the completion doesn't record one", () => {
    const text = formatCompletedBanner([{ completedAt: "2026-10-01T18:00:00.000Z" }], names);
    expect(text).toBe("You completed this exercise on October 1, 2026.");
  });
});
