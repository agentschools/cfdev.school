import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rawCourses } from "./course-files";

const defaultInterview = readFileSync("src/content/default-interview.md", "utf8");

describe("rawCourses", () => {
  it("has every built-in course's files exactly as they are in the repo", () => {
    for (const course of rawCourses()) {
      const dir = course.track ? `courses/${course.track}/${course.name}` : `courses/${course.name}`;
      expect(course.courseMarkdown).toBe(readFileSync(`${dir}/COURSE.md`, "utf8"));
      for (const [file, markdown] of Object.entries(course.exercises)) {
        const path = `${dir}/exercises/${file}`;
        expect(markdown, path).toBe(existsSync(path) ? readFileSync(path, "utf8") : defaultInterview);
      }
    }
  });

  it("finds a course in a track directory, and leaves the track off one that isn't in one", () => {
    expect(rawCourses().find((course) => course.name === "bindings")?.track).toBe("fundamentals");
    expect(rawCourses().find((course) => course.name === "agent-setup")?.track).toBeUndefined();
  });

  it("adds the default interview to a course that doesn't write its own", () => {
    const workersCourse = rawCourses().find((course) => course.name === "workers");
    expect(workersCourse?.exercises["interview.md"]).toBe(defaultInterview);
  });
});
