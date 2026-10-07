import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rawCourses } from "./course-files";

const defaultInterview = readFileSync("src/content/default-interview.md", "utf8");

describe("rawCourses", () => {
  it("has every built-in course's files exactly as they are in the repo", () => {
    for (const course of rawCourses()) {
      expect(course.courseMarkdown).toBe(readFileSync(`courses/${course.name}/COURSE.md`, "utf8"));
      for (const [file, markdown] of Object.entries(course.exercises)) {
        const path = `courses/${course.name}/exercises/${file}`;
        expect(markdown, path).toBe(existsSync(path) ? readFileSync(path, "utf8") : defaultInterview);
      }
    }
  });

  it("adds the default interview to a course that doesn't write its own", () => {
    const workersBasics = rawCourses().find((course) => course.name === "workers-basics");
    expect(workersBasics?.exercises["interview.md"]).toBe(defaultInterview);
  });
});
