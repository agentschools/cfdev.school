import { describe, expect, it } from "vitest";
import { exerciseSlugFromFilename, INTERVIEW_SLUG, titleFromMarkdown } from "../lib/course-format";
import { rawCourses } from "../lib/course-files";
import { courseNameSchema, exerciseSlugSchema } from "../schemas/course";
import { COURSE_ORDER, REQUIRED_COURSE } from "./courses";

// Checks the real files in courses/ against the course format (see #73).
// Frontmatter schemas are enforced by the content collections at build time.
const courses = rawCourses();

function body(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
}

describe("built-in courses", () => {
  it("lists every course directory in COURSE_ORDER, and nothing else", () => {
    expect([...COURSE_ORDER].sort()).toEqual(courses.map((course) => course.name).sort());
    expect(COURSE_ORDER).toContain(REQUIRED_COURSE);
  });

  for (const course of courses) {
    describe(course.name, () => {
      it("has a valid name matching its directory, and a # title", () => {
        expect(courseNameSchema.safeParse(course.name).success).toBe(true);
        expect(course.courseMarkdown).toMatch(new RegExp(`^---\\n[\\s\\S]*^name: ${course.name}$`, "m"));
        expect(titleFromMarkdown(body(course.courseMarkdown))).toBeTruthy();
      });

      it("has exercises with valid, unique slugs and a # title each", () => {
        const slugs = Object.keys(course.exercises).map(exerciseSlugFromFilename);
        expect(slugs).toContain(INTERVIEW_SLUG);
        expect(new Set(slugs).size).toBe(slugs.length);
        for (const [file, markdown] of Object.entries(course.exercises)) {
          expect(exerciseSlugSchema.safeParse(exerciseSlugFromFilename(file)).success, file).toBe(true);
          expect(titleFromMarkdown(body(markdown)), file).toBeTruthy();
        }
      });
    });
  }
});
