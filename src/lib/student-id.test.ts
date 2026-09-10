import { describe, expect, it, vi } from "vitest";
import { generateStudentId, isValidStudentId } from "./student-id";

describe("isValidStudentId", () => {
  it("accepts valid IDs", () => {
    expect(isValidStudentId("curious-hacker-2019")).toBe(true);
    expect(isValidStudentId("based-wizard-1000")).toBe(true);
    expect(isValidStudentId("sharp-coder-9999")).toBe(true);
  });

  it("rejects IDs with wrong format", () => {
    expect(isValidStudentId("")).toBe(false);
    expect(isValidStudentId("single-1234")).toBe(false);
    expect(isValidStudentId("too-many-parts-1234")).toBe(false);
    expect(isValidStudentId("curious-hacker-123")).toBe(false); // 3 digits
    expect(isValidStudentId("curious-hacker-12345")).toBe(false); // 5 digits
    expect(isValidStudentId("Curious-hacker-1234")).toBe(false); // uppercase
    expect(isValidStudentId("curious-hacker-abcd")).toBe(false); // letters instead of digits
  });
});

function mockDb(first: () => Promise<unknown>): D1Database {
  return {
    prepare: () => ({
      bind: () => ({
        first,
      }),
    }),
  } as unknown as D1Database;
}

describe("generateStudentId", () => {
  it("returns a valid student ID without a database", async () => {
    const id = await generateStudentId();
    expect(isValidStudentId(id)).toBe(true);
  });

  it("generates different IDs on successive calls", async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      ids.add(await generateStudentId());
    }
    // With 14 adjectives * 11 nouns * 9000 numbers, collisions in 20 tries are near-impossible
    expect(ids.size).toBe(20);
  });

  it("retries when the database returns a collision", async () => {
    let calls = 0;
    const first = vi.fn(async () => {
      calls++;
      // First two calls return a collision, third returns null (available)
      return calls <= 2 ? { id: "collision" } : null;
    });

    const id = await generateStudentId(mockDb(first));
    expect(isValidStudentId(id)).toBe(true);
    expect(first).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const first = vi.fn(async () => ({ id: "collision" })); // always collides

    await expect(generateStudentId(mockDb(first), 3)).rejects.toThrow(
      "Failed to generate a unique student ID after retries",
    );
    expect(first).toHaveBeenCalledTimes(3);
  });
});
