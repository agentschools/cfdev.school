import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { exerciseSlugFromFilename, INTERVIEW_SLUG, titleFromMarkdown } from "../lib/course-format";
import { rawCourses } from "../lib/course-files";
import {
  courseFrontmatterSchema,
  courseNameSchema,
  exerciseFrontmatterSchema,
  exerciseSlugSchema,
} from "../schemas/course";
import { COURSE_ORDER, REQUIRED_COURSE, TRACKS } from "./courses";

// Checks the real files in courses/ against the course format (see #73).
// The content collections enforce the same frontmatter schemas at build time,
// but CI doesn't build, so they're parsed here too.
const courses = rawCourses();

const frontmatterPattern = /^---\n([\s\S]*?)\n---\n/;

function body(markdown: string): string {
  return markdown.replace(frontmatterPattern, "");
}

function frontmatter(markdown: string): unknown {
  const yaml = markdown.match(frontmatterPattern)?.[1];
  return yaml === undefined ? {} : parseYaml(yaml);
}

describe("built-in courses", () => {
  it("lists every course directory in COURSE_ORDER, and nothing else", () => {
    expect([...COURSE_ORDER].sort()).toEqual(courses.map((course) => course.name).sort());
    expect(COURSE_ORDER).toContain(REQUIRED_COURSE);
  });

  it("puts courses either at the top level or in a known track directory", () => {
    for (const course of courses) if (course.track) expect(TRACKS, course.name).toContain(course.track);
    expect(courses.find((course) => course.name === REQUIRED_COURSE)?.track).toBeUndefined();
  });

  for (const course of courses) {
    describe(course.name, () => {
      it("has a valid name matching its directory, and a # title", () => {
        expect(courseNameSchema.safeParse(course.name).success).toBe(true);
        expect(course.courseMarkdown).toMatch(new RegExp(`^---\\n[\\s\\S]*^name: ${course.name}$`, "m"));
        expect(titleFromMarkdown(body(course.courseMarkdown))).toBeTruthy();
      });

      it("has valid COURSE.md and exercise frontmatter", () => {
        expect(courseFrontmatterSchema.safeParse(frontmatter(course.courseMarkdown)).error).toBeUndefined();
        for (const [file, markdown] of Object.entries(course.exercises)) {
          expect(exerciseFrontmatterSchema.safeParse(frontmatter(markdown)).error, file).toBeUndefined();
        }
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
