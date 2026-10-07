import { describe, expect, it } from "vitest";
import { normalizeCourseUrl } from "./course-url";

describe("normalizeCourseUrl", () => {
  it("maps every form of the same repo URL to one ID", () => {
    for (const url of [
      "https://github.com/acme/durable-objects",
      "https://github.com/acme/durable-objects/",
      "https://github.com/acme/durable-objects.git",
      "https://GitHub.com/acme/durable-objects.git/",
      "https://github.com/acme/durable-objects?tab=readme#intro",
      "https://user:token@github.com/acme/durable-objects",
    ]) {
      expect(normalizeCourseUrl(url)).toBe("https://github.com/acme/durable-objects");
    }
  });

  it("keeps the path's case and a single-file course's filename", () => {
    expect(normalizeCourseUrl("https://example.com/Courses/KV.md")).toBe("https://example.com/Courses/KV.md");
  });

  it("keeps a non-default port and drops a bare trailing slash", () => {
    expect(normalizeCourseUrl("https://example.com:8443/")).toBe("https://example.com:8443");
  });

  it("rejects anything but https", () => {
    expect(normalizeCourseUrl("http://github.com/acme/durable-objects")).toBeNull();
    expect(normalizeCourseUrl("git@github.com:acme/durable-objects.git")).toBeNull();
    expect(normalizeCourseUrl("agent-setup")).toBeNull();
  });
});
