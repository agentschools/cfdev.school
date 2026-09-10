import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidStudentId } from "../../lib/student-id";

const rows = new Map<string, { id: string; created_at: string }>();

const db = {
  prepare: (sql: string) => {
    if (sql.startsWith("SELECT")) {
      return {
        bind: (id: string) => ({
          first: async () => rows.get(id) ?? null,
        }),
      };
    }
    return {
      bind: (id: string, createdAt: string) => ({
        run: async () => {
          rows.set(id, { id, created_at: createdAt });
        },
      }),
    };
  },
};

vi.mock("cloudflare:workers", () => ({ env: { DB: db } }));

beforeEach(() => {
  rows.clear();
});

describe("POST /api/students", () => {
  it("creates a student and returns a valid id", async () => {
    const { POST } = await import("./students");
    const response = await POST({} as APIContext);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(isValidStudentId(body.id)).toBe(true);
    expect(new Date(body.createdAt).toString()).not.toBe("Invalid Date");
    expect(rows.has(body.id)).toBe(true);
  });
});
