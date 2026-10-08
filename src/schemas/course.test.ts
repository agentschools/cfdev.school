import { describe, expect, it } from "vitest";
import { reportCourseSchema } from "./course";

describe("reportCourseSchema", () => {
  const body = {
    url: "https://github.com/acme/durable-objects",
    title: "Durable Objects",
    exercises: [
      { slug: "first-object", title: "Your first object", url: "https://github.com/acme/durable-objects/blob/main/exercises/01-first-object.md" },
      { slug: "websockets", title: "WebSockets", url: "https://github.com/acme/durable-objects/blob/main/exercises/02-websockets.md" },
    ],
  };

  it("accepts a manifest with optional description and author", () => {
    const full = { ...body, description: "Build stateful apps.", author: "Acme" };
    expect(reportCourseSchema.parse(full)).toEqual(full);
  });

  it("rejects a course or exercise URL that isn't https", () => {
    expect(() => reportCourseSchema.parse({ ...body, url: "http://github.com/acme/durable-objects" })).toThrow();
    const exercise = { ...body.exercises[0], url: "file:///tmp/01-first-object.md" };
    expect(() => reportCourseSchema.parse({ ...body, exercises: [exercise] })).toThrow();
  });

  it("rejects slugs that break the naming rules, and duplicate slugs", () => {
    expect(() => reportCourseSchema.parse({ ...body, exercises: [{ ...body.exercises[0], slug: "First-Object" }] })).toThrow();
    expect(() => reportCourseSchema.parse({ ...body, exercises: [body.exercises[0], body.exercises[0]] })).toThrow();
  });
});
