import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkCourseSkill } from "./sync-course-skill.mjs";

const projects = [];
afterEach(() => projects.splice(0).forEach((project) => rmSync(project, { recursive: true, force: true })));

function fixture() {
  const project = mkdtempSync(join(tmpdir(), "course-skill-test-"));
  projects.push(project);
  const skill = join(project, ".agents/skills/create-course");
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, "SKILL.md"), "A pinned skill.");
  writeFileSync(join(project, ".agents/course-spec.json"), JSON.stringify({
    repository: "https://github.com/agentschools/course-spec",
    revision: "a".repeat(40),
    files: { "SKILL.md": createHash("sha256").update("A pinned skill.").digest("hex") },
  }));
  return { project, skill };
}

describe("course skill pin", () => {
  it("accepts matching bytes and rejects changed files", () => {
    const { project, skill } = fixture();
    expect(checkCourseSkill(project).revision).toBe("a".repeat(40));
    writeFileSync(join(skill, "SKILL.md"), "A local edit.");
    expect(() => checkCourseSkill(project)).toThrow("Course skill changed locally: SKILL.md");
  });

  it("rejects missing and additional files", () => {
    const { project, skill } = fixture();
    writeFileSync(join(skill, "extra.ts"), "");
    expect(() => checkCourseSkill(project)).toThrow("Course skill files differ");
    rmSync(join(skill, "extra.ts"));
    rmSync(join(skill, "SKILL.md"));
    expect(() => checkCourseSkill(project)).toThrow("Course skill files differ");
  });

  it("requires an exact commit in the expected upstream repository", () => {
    const { project } = fixture();
    const path = join(project, ".agents/course-spec.json");
    const lock = JSON.parse(readFileSync(path, "utf8"));
    writeFileSync(path, JSON.stringify({ ...lock, revision: "main" }));
    expect(() => checkCourseSkill(project)).toThrow("Invalid course skill provenance");
    writeFileSync(path, JSON.stringify({ ...lock, repository: "https://example.com" }));
    expect(() => checkCourseSkill(project)).toThrow("Invalid course skill provenance");
  });
});
