import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import guide from "../content/authors.md?raw";
import { exerciseFrontmatterSchema } from "../schemas/course";

// The authors guide (src/content/authors.md, #79) holds what Dev School adds
// to the COURSE.md format. The format's own prose is checked against its code
// in the vendored skill's src/spec.test.ts.
describe("authors guide", () => {
  it("has agent-instructions frontmatter and a body that starts with a # title", () => {
    expect(guide).toMatch(/^---\ndescription: .+\nagent-instructions: \|\n[\s\S]+?\n---\n\n# /);
    const yaml = guide.match(/^---\n([\s\S]*?)\n---\n/)![1];
    expect(exerciseFrontmatterSchema.safeParse(parseYaml(yaml)).error).toBeUndefined();
  });

  it("uses the pinned skill and its relative format reference", () => {
    expect(guide).toContain("/course-authoring/SKILL.md");
    const skill = readFileSync(new URL("../../.agents/skills/create-course/SKILL.md", import.meta.url), "utf8");
    expect(skill).toContain("[SPEC.md](SPEC.md)");
  });
});
