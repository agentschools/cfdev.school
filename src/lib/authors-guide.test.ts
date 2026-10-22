import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import guide from "../content/authors.md?raw";
import { exerciseFrontmatterSchema } from "../schemas/course";

// The authors guide (src/content/authors.md, #79) holds what Dev School adds
// to the COURSE.md format. The format's own prose is checked against its code
// in the @agentschools/course-spec repo.
describe("authors guide", () => {
  it("has agent-instructions frontmatter and a body that starts with a # title", () => {
    expect(guide).toMatch(/^---\ndescription: .+\nagent-instructions: \|\n[\s\S]+?\n---\n\n# /);
    const yaml = guide.match(/^---\n([\s\S]*?)\n---\n/)![1];
    expect(exerciseFrontmatterSchema.safeParse(parseYaml(yaml)).error).toBeUndefined();
  });

  it("points at the create-course skill in the course-spec package", () => {
    const skill = guide.match(/course-spec\/main\/(skills\/[^\s]+\/SKILL\.md)/)![1];
    expect(existsSync(new URL(`../../node_modules/@agentschools/course-spec/${skill}`, import.meta.url)), skill).toBe(true);
  });
});
