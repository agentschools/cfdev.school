import { describe, expect, it } from "vitest";
import { previewPaths, updateBody } from "./preview-links.mjs";

const files = {
  "src/data/harnesses.ts": ["export const harnesses = [", "  {", '    id: "pi",', "  },", "];"].join("\n"),
};
const readFile = (path) => files[path];

describe("previewPaths", () => {
  it("links a course's page and raw COURSE.md", () => {
    const paths = previewPaths([{ filename: "courses/agent-setup/COURSE.md", status: "modified" }], readFile);
    expect(paths).toEqual(["/courses/agent-setup", "/courses/agent-setup/COURSE.md"]);
  });

  it("links an exercise's page, without its number prefix, and its raw file", () => {
    const paths = previewPaths([{ filename: "courses/agent-setup/exercises/01-models.md", status: "added" }], readFile);
    expect(paths).toEqual(["/courses/agent-setup/models", "/courses/agent-setup/exercises/01-models.md"]);
  });

  it("leaves the track out of a course in a track directory's links", () => {
    const paths = previewPaths([{ filename: "courses/fundamentals/bindings/exercises/01-live-objects.md", status: "added" }], readFile);
    expect(paths).toEqual(["/courses/bindings/live-objects", "/courses/bindings/exercises/01-live-objects.md"]);
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

  it("links only the harness entries a patch touches, plus the homepage", () => {
    const patch = "@@ -3,1 +3,1 @@\n-    id: \"old\",\n+    id: \"pi\",";
    const paths = previewPaths([{ filename: "src/data/harnesses.ts", status: "modified", patch }], readFile);
    expect(paths).toEqual(["/api/harnesses/pi", "/"]);
  });

  it("skips removed files and tests, falling back to the homepage", () => {
    const paths = previewPaths(
      [
        { filename: "courses/agent-setup/exercises/99-gone.md", status: "removed" },
        { filename: "src/pages/llms.txt.test.ts", status: "modified" },
      ],
      readFile,
    );
    expect(paths).toEqual(["/"]);
  });
});

describe("updateBody", () => {
  const urls = ["https://pr-1.example.dev/courses/foo"];

  it("appends the list to the end of the body", () => {
    expect(updateBody("This PR adds foo.", urls)).toBe(
      "This PR adds foo.\n\n<!-- preview-links:start -->\n- https://pr-1.example.dev/courses/foo\n<!-- preview-links:end -->\n",
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
