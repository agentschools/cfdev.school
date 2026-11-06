import { describe, expect, it } from "vitest";
import { courseFrontmatterSchema, exerciseFrontmatterSchema } from "./schemas";

describe("frontmatter schemas", () => {
  it("reject misspelled or unknown keys", () => {
    const course = { name: "workers", description: "Deploy a Worker." };
    expect(courseFrontmatterSchema.parse(course)).toEqual(course);
    expect(() => courseFrontmatterSchema.parse({ ...course, compatability: "A Cloudflare account." })).toThrow();
    expect(() => exerciseFrontmatterSchema.parse({ "agent-instruction": "Verify it." })).toThrow();
  });
});
