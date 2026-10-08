import { describe, expect, it } from "vitest";
import {
  compareExerciseFilenames,
  exerciseSlugFromFilename,
  titleFromMarkdown,
  withInterviewFirst,
} from "./course-format";

describe("exerciseSlugFromFilename", () => {
  it("drops .md and a leading number prefix", () => {
    expect(exerciseSlugFromFilename("03-first-object.md")).toBe("first-object");
    expect(exerciseSlugFromFilename("10_websockets.md")).toBe("websockets");
    expect(exerciseSlugFromFilename("interview.md")).toBe("interview");
  });

  it("keeps numbers after the prefix", () => {
    expect(exerciseSlugFromFilename("01-r2-buckets.md")).toBe("r2-buckets");
  });
});

describe("compareExerciseFilenames", () => {
  it("sorts number prefixes naturally", () => {
    expect(["10-c.md", "2-b.md", "1-a.md"].sort(compareExerciseFilenames)).toEqual(["1-a.md", "2-b.md", "10-c.md"]);
  });
});

describe("titleFromMarkdown", () => {
  it("finds the first # heading", () => {
    expect(titleFromMarkdown("\n# Deploy a Worker\n\nBody\n\n## Step 1")).toBe("Deploy a Worker");
  });

  it("ignores # lines inside fenced code blocks", () => {
    expect(titleFromMarkdown("```bash\n# install it\nnpm i -g cf\n```\n\n# CLI\n")).toBe("CLI");
  });

  it("returns undefined when there's no # heading", () => {
    expect(titleFromMarkdown("## Only h2\n")).toBeUndefined();
  });
});

describe("withInterviewFirst", () => {
  const implicit = () => ({ slug: "interview", implicit: true });

  it("moves an existing interview to the front", () => {
    const exercises = [{ slug: "models" }, { slug: "interview" }, { slug: "cli" }];
    expect(withInterviewFirst(exercises, implicit).map((exercise) => exercise.slug)).toEqual(["interview", "models", "cli"]);
  });

  it("adds an implicit interview when there isn't one", () => {
    const result = withInterviewFirst([{ slug: "deploy" }], implicit);
    expect(result[0]).toEqual({ slug: "interview", implicit: true });
    expect(result.map((exercise) => exercise.slug)).toEqual(["interview", "deploy"]);
  });
});
