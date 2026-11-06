import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { compareExerciseFilenames, exerciseSlugFromFilename, INTERVIEW_SLUG } from "./rules";
import { courseFrontmatterSchema, courseNameSchema, exerciseFrontmatterSchema, exerciseSlugSchema } from "./schemas";

// SPEC.md describes the format in prose. These check its claims and examples
// against the code, so the two can't drift apart.
const spec = readFileSync(new URL("../SPEC.md", import.meta.url), "utf8");

/** Frontmatter of every ```markdown example in the spec, by its title. */
function exampleFrontmatter(): { title: string; data: unknown }[] {
  return [...spec.matchAll(/```markdown title="([^"]+)"\n---\n([\s\S]*?)\n---\n/g)].map(([, title, yaml]) => ({
    title,
    data: parseYaml(yaml),
  }));
}

describe("SPEC.md", () => {
  it("has examples whose frontmatter passes the schemas", () => {
    const examples = exampleFrontmatter();
    expect(examples.length).toBeGreaterThan(0);
    for (const { title, data } of examples) {
      const schema = title === "COURSE.md" ? courseFrontmatterSchema : exerciseFrontmatterSchema;
      expect(schema.safeParse(data).error, title).toBeUndefined();
    }
  });

  it("uses example names that pass the naming rules, and states the real length limits", () => {
    for (const [, name] of spec.matchAll(/^name: (.+)$/gm)) {
      expect(courseNameSchema.safeParse(name).success, name).toBe(true);
    }
    expect(spec).toContain(`at most ${courseNameSchema.maxLength} characters`);
    expect(spec).toContain(`at most ${courseFrontmatterSchema.shape.description.maxLength?.toLocaleString("en-US")} characters`);
    expect(spec).toContain(`at most ${courseFrontmatterSchema.shape.compatibility.unwrap().maxLength} characters`);
  });

  it("describes the real slug, order, and interview rules", () => {
    expect(exerciseSlugFromFilename("01-first-object.md")).toBe("first-object");
    expect(spec).toContain("`01-first-object.md` is `first-object`");
    expect(compareExerciseFilenames("2-alarms.md", "10-cleanup.md")).toBeLessThan(0);
    expect(spec).toContain("`2-alarms.md` comes before `10-cleanup.md`");
    expect(spec).toContain(`slug \`${INTERVIEW_SLUG}\``);
    expect(exerciseSlugSchema.safeParse("your-first-object").success).toBe(true);
  });
});

describe("create-course skill", () => {
  it("has SKILL.md frontmatter that follows the Agent Skills spec", () => {
    const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");
    const data = parseYaml(skill.match(/^---\n([\s\S]*?)\n---\n/)![1]);
    // A skill's frontmatter fields are the same as a course's.
    expect(courseFrontmatterSchema.safeParse(data).error).toBeUndefined();
    expect(data.name).toBe("create-course");
    // Installed skills must use their bundled reference, not a moving remote copy.
    expect(skill).toContain("[SPEC.md](SPEC.md)");
  });
});
