import { describe, expect, it } from "vitest";
import { studentSchema } from "./student";

describe("studentSchema", () => {
  it("accepts a valid student", () => {
    expect(() =>
      studentSchema.parse({
        id: "curious-hacker-2019",
        createdAt: "2026-09-10T12:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("rejects a malformed id", () => {
    expect(() =>
      studentSchema.parse({
        id: "not-a-valid-id",
        createdAt: "2026-09-10T12:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects a non-ISO createdAt", () => {
    expect(() =>
      studentSchema.parse({
        id: "curious-hacker-2019",
        createdAt: "not a date",
      }),
    ).toThrow();
  });
});
