import { describe, expect, it } from "vitest";
import { previewPaths, updateBody } from "./preview-links.mjs";

const exercisesSource = [
  "export const exercises = [",
  "{",
  '  slug: "deploy-first-worker",',
  '  title: "Deploy",',
  "},",
  "{",
  '  slug: "add-first-binding-kv",',
  '  title: "KV",',
  "},",
  "];",
].join("\n");

const files = {
  "src/content/lessons/foo.md": "---\nlessonSlug: foo\ntitle: Foo\n---\nBody",
  "src/content/exercises/bar.md": "---\nexerciseSlug: bar\n---\nBody",
  "src/data/exercises.ts": exercisesSource,
};
const readFile = (path) => files[path];

describe("previewPaths", () => {
  it("links a new lesson's page and API route", () => {
    const paths = previewPaths([{ filename: "src/content/lessons/foo.md", status: "added" }], readFile);
    expect(paths).toEqual(["/lessons/foo", "/api/lessons/foo"]);
  });

  it("links llms.txt and the OpenAPI doc", () => {
    const paths = previewPaths(
      [
        { filename: "src/pages/llms.txt.ts", status: "modified" },
        { filename: "src/schemas/progress.ts", status: "modified" },
      ],
      readFile,
    );
    expect(paths).toEqual(["/llms.txt", "/api/openapi.json"]);
  });

  it("links only the exercise entries a catalog patch touches", () => {
    const patch = "@@ -7,3 +7,3 @@\n   slug: \"add-first-binding-kv\",\n-  title: \"Old\",\n+  title: \"KV\",\n },";
    const paths = previewPaths([{ filename: "src/data/exercises.ts", status: "modified", patch }], readFile);
    expect(paths).toEqual(["/exercises/add-first-binding-kv", "/api/exercises/add-first-binding-kv"]);
  });

  it("skips removed files and tests, falling back to the homepage", () => {
    const paths = previewPaths(
      [
        { filename: "src/content/lessons/gone.md", status: "removed" },
        { filename: "src/pages/llms.txt.test.ts", status: "modified" },
      ],
      readFile,
    );
    expect(paths).toEqual(["/"]);
  });
});

describe("updateBody", () => {
  const urls = ["https://pr-1.example.dev/lessons/foo"];

  it("appends the list to the end of the body", () => {
    expect(updateBody("This PR adds foo.", urls)).toBe(
      "This PR adds foo.\n\n<!-- preview-links:start -->\n- https://pr-1.example.dev/lessons/foo\n<!-- preview-links:end -->\n",
    );
  });

  it("replaces an existing list instead of adding another", () => {
    const once = updateBody("This PR adds foo.", ["https://pr-1.example.dev/"]);
    expect(updateBody(once, urls)).toBe(updateBody("This PR adds foo.", urls));
  });

  it("handles an empty body", () => {
    expect(updateBody(null, urls)).toMatch(/^<!-- preview-links:start -->/);
  });
});
