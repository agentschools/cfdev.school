import { describe, expect, it } from "vitest";
import { completionLabels, courseStatus } from "./profile-client";

const exercises = [{ title: "Interview" }, { title: "Models" }, { title: "Instructions" }] as Parameters<
  typeof courseStatus
>[0]["exercises"];

describe("courseStatus", () => {
  it("counts completed exercises in a course that isn't finished", () => {
    expect(courseStatus({ exercises, remaining: 2 })).toBe("1 of 3 exercises complete");
  });

  it("shows when a course was finished", () => {
    expect(courseStatus({ exercises, remaining: 0, completedAt: "2026-10-01T12:00:00.000Z" })).toBe("Completed October 1, 2026");
  });

  it("counts exercises added since the student finished", () => {
    expect(courseStatus({ exercises, remaining: 1, completedAt: "2026-10-01T12:00:00.000Z" })).toBe(
      "Completed October 1, 2026 · 1 new exercise since you finished",
    );
    expect(courseStatus({ exercises, remaining: 2, completedAt: "2026-10-01T12:00:00.000Z" })).toBe(
      "Completed October 1, 2026 · 2 new exercises since you finished",
    );
  });
});

describe("completionLabels", () => {
  it("names each agent with its completion date, oldest first", () => {
    expect(
      completionLabels(
        [
          { harness: "codex", completedAt: "2026-10-03T12:00:00.000Z" },
          { harness: "claude-code", completedAt: "2026-10-01T12:00:00.000Z" },
        ],
        { "claude-code": "Claude Code", codex: "OpenAI Codex" },
      ),
    ).toEqual(["Claude Code, Oct 1, 2026", "OpenAI Codex, Oct 3, 2026"]);
  });
});
