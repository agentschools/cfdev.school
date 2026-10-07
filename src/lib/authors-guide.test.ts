import { describe, expect, it } from "vitest";
import guide from "../content/authors.md?raw";
import { courseFrontmatterSchema, courseNameSchema, exerciseSlugSchema } from "../schemas/course";
import { compareExerciseFilenames, exerciseSlugFromFilename, INTERVIEW_SLUG } from "./course-format";
import { rawCourses } from "./course-files";

// The authors guide (src/content/authors.md, #79) describes the course format
// in prose. These check its claims against the code that loads built-in
// courses and accepts reported ones, so the two can't drift apart.
describe("authors guide", () => {
  it("has agent-instructions frontmatter and a body that starts with a # title", () => {
    expect(guide).toMatch(/^---\ndescription: .+\nagent-instructions: \|\n[\s\S]+?\n---\n\n# /);
  });

  it("uses example names that pass the naming rules, and states the real length limits", () => {
    for (const [, name] of guide.matchAll(/^name: (.+)$/gm)) {
      expect(courseNameSchema.safeParse(name).success, name).toBe(true);
    }
    expect(guide).toContain(`at most ${courseNameSchema.maxLength} characters`);
    expect(guide).toContain(`at most ${courseFrontmatterSchema.shape.description.maxLength?.toLocaleString("en-US")} characters`);
  });

  it("describes the real slug, order, and interview rules", () => {
    expect(exerciseSlugFromFilename("01-first-object.md")).toBe("first-object");
    expect(guide).toContain("`01-first-object.md` is `first-object`");
    expect(compareExerciseFilenames("2-alarms.md", "10-cleanup.md")).toBeLessThan(0);
    expect(guide).toContain("`2-alarms.md` comes before `10-cleanup.md`");
    expect(guide).toContain(`slug \`${INTERVIEW_SLUG}\``);
    expect(exerciseSlugSchema.safeParse("your-first-object").success).toBe(true);
  });

  it("links to built-in course files that exist", () => {
    const served = new Set(
      rawCourses().flatMap((course) => [
        `/courses/${course.name}/COURSE.md`,
        ...Object.keys(course.exercises).map((file) => `/courses/${course.name}/exercises/${file}`),
      ]),
    );
    const links = [...guide.matchAll(/\]\((\/courses\/[^)]+)\)/g)].map(([, path]) => path);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(served, link).toContain(link);
  });
});
