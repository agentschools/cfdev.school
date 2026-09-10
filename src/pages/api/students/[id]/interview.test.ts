import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

const students = new Set<string>(["curious-hacker-2019"]);
const interviews = new Map<string, Record<string, unknown>>();

const db = {
  prepare: (sql: string) => {
    if (sql.startsWith("SELECT id FROM students")) {
      return {
        bind: (id: string) => ({
          first: async () => (students.has(id) ? { id } : null),
        }),
      };
    }
    if (sql.startsWith("SELECT * FROM interview_answers")) {
      return {
        bind: (id: string) => ({
          first: async () => interviews.get(id) ?? null,
        }),
      };
    }
    if (sql.startsWith("INSERT INTO interview_answers")) {
      return {
        bind: (
          studentId: string,
          technicalBackground: string | null,
          cloudflareFamiliarity: string | null,
          learningGoals: string | null,
          os: string | null,
          quizOptIn: number,
          updatedAt: string,
        ) => ({
          run: async () => {
            interviews.set(studentId, {
              student_id: studentId,
              technical_background: technicalBackground,
              cloudflare_familiarity: cloudflareFamiliarity,
              learning_goals: learningGoals,
              os,
              quiz_opt_in: quizOptIn,
              updated_at: updatedAt,
            });
          },
        }),
      };
    }
    throw new Error(`Unexpected SQL in test: ${sql}`);
  },
};

vi.mock("cloudflare:workers", () => ({ env: { DB: db } }));

function context(id: string, body?: unknown): APIContext {
  return {
    params: { id },
    request: { json: async () => body } as unknown as Request,
  } as unknown as APIContext;
}

beforeEach(() => {
  interviews.clear();
});

describe("GET /api/students/{id}/interview", () => {
  it("404s when the student hasn't been interviewed yet", async () => {
    const { GET } = await import("./interview");
    const response = await GET(context("curious-hacker-2019"));
    expect(response.status).toBe(404);
  });
});

describe("PUT /api/students/{id}/interview", () => {
  it("404s for an unknown student", async () => {
    const { PUT } = await import("./interview");
    const response = await PUT(context("no-such-student-0000", { learningGoals: "test" }));
    expect(response.status).toBe(404);
  });

  it("creates an interview with quizOptIn defaulting to true", async () => {
    const { PUT } = await import("./interview");
    const response = await PUT(context("curious-hacker-2019", { technicalBackground: "intermediate" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.technicalBackground).toBe("intermediate");
    expect(body.quizOptIn).toBe(true);
    expect(body.learningGoals).toBeNull();
  });

  it("merges partial updates without clobbering previously answered fields", async () => {
    const { PUT, GET } = await import("./interview");
    await PUT(context("curious-hacker-2019", { technicalBackground: "advanced", learningGoals: "Ship a Worker" }));

    const updateResponse = await PUT(context("curious-hacker-2019", { quizOptIn: false }));
    const updated = await updateResponse.json();
    expect(updated.quizOptIn).toBe(false);
    expect(updated.technicalBackground).toBe("advanced");
    expect(updated.learningGoals).toBe("Ship a Worker");

    const getResponse = await GET(context("curious-hacker-2019"));
    const fetched = await getResponse.json();
    expect(fetched).toEqual(updated);
  });
});
