import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

const students = new Map<string, { id: string; created_at: string }>([
  ["curious-hacker-2019", { id: "curious-hacker-2019", created_at: "2026-09-10T12:00:00.000Z" }],
]);
const exerciseCompletions = new Map<string, Record<string, unknown>>();
const lessonCompletions = new Map<string, Record<string, unknown>>();

function completionKey(studentId: string, slug: string) {
  return `${studentId}::${slug}`;
}

const db = {
  prepare: (sql: string) => {
    if (sql.startsWith("SELECT id, created_at FROM students") || sql.startsWith("SELECT id FROM students")) {
      return {
        bind: (id: string) => ({
          first: async () => students.get(id) ?? null,
        }),
      };
    }
    if (sql.startsWith("SELECT * FROM exercise_completions WHERE student_id = ? ORDER BY")) {
      return {
        bind: (studentId: string) => ({
          all: async () => ({
            results: [...exerciseCompletions.values()].filter((row) => row.student_id === studentId),
          }),
        }),
      };
    }
    if (sql.startsWith("SELECT * FROM lesson_completions WHERE student_id = ? ORDER BY")) {
      return {
        bind: (studentId: string) => ({
          all: async () => ({
            results: [...lessonCompletions.values()].filter((row) => row.student_id === studentId),
          }),
        }),
      };
    }
    if (sql.startsWith("INSERT INTO exercise_completions")) {
      return {
        bind: (
          studentId: string,
          exerciseSlug: string,
          completedAt: string,
          deployedUrl: string | null,
          model: string | null,
        ) => ({
          run: async () => {
            exerciseCompletions.set(completionKey(studentId, exerciseSlug), {
              student_id: studentId,
              exercise_slug: exerciseSlug,
              completed_at: completedAt,
              deployed_url: deployedUrl,
              model,
            });
          },
        }),
      };
    }
    if (sql.startsWith("INSERT INTO lesson_completions")) {
      return {
        bind: (
          studentId: string,
          lessonSlug: string,
          harness: string,
          completedAt: string,
          model: string | null,
          summary: string | null,
        ) => ({
          run: async () => {
            const key = completionKey(studentId, `${lessonSlug}::${harness}`);
            const existing = lessonCompletions.get(key);
            lessonCompletions.set(key, {
              student_id: studentId,
              lesson_slug: lessonSlug,
              harness,
              completed_at: completedAt,
              model: model ?? existing?.model ?? null,
              summary: summary ?? existing?.summary ?? null,
            });
          },
        }),
      };
    }
    if (sql.startsWith("DELETE FROM exercise_completions WHERE student_id = ?")) {
      return {
        bind: (studentId: string) => ({
          run: async () => {
            for (const [key, row] of exerciseCompletions) {
              if (row.student_id === studentId) exerciseCompletions.delete(key);
            }
          },
        }),
      };
    }
    if (sql.startsWith("DELETE FROM lesson_completions WHERE student_id = ?")) {
      return {
        bind: (studentId: string) => ({
          run: async () => {
            for (const [key, row] of lessonCompletions) {
              if (row.student_id === studentId) lessonCompletions.delete(key);
            }
          },
        }),
      };
    }
    throw new Error(`Unexpected SQL in test: ${sql}`);
  },
};

const broadcasts: Array<{ hub: string; progress: { completedLessons: unknown[] } }> = [];
const progressHub = {
  getByName: (hub: string) => ({
    broadcast: async (progress: { completedLessons: unknown[] }) => {
      broadcasts.push({ hub, progress });
    },
  }),
};

vi.mock("cloudflare:workers", () => ({ env: { DB: db, PROGRESS_HUB: progressHub } }));

function context(studentId: string, body?: unknown): APIContext {
  return {
    params: { studentId },
    request: { json: async () => body } as unknown as Request,
  } as unknown as APIContext;
}

beforeEach(() => {
  exerciseCompletions.clear();
  lessonCompletions.clear();
  broadcasts.length = 0;
});

describe("GET /api/progress/{studentId}", () => {
  it("404s for an unknown student", async () => {
    const { GET } = await import("./[studentId]");
    const response = await GET(context("no-such-student-0000"));
    expect(response.status).toBe(404);
  });

  it("returns empty completedExercises and completedLessons for a new student", async () => {
    const { GET } = await import("./[studentId]");
    const response = await GET(context("curious-hacker-2019"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      studentId: string;
      completedExercises: unknown[];
      completedLessons: unknown[];
      updatedAt: string;
    };
    expect(body.studentId).toBe("curious-hacker-2019");
    expect(body.completedExercises).toEqual([]);
    expect(body.completedLessons).toEqual([]);
    expect(body.updatedAt).toBe("2026-09-10T12:00:00.000Z");
  });
});

describe("PUT /api/progress/{studentId}", () => {
  it("404s for an unknown student", async () => {
    const { PUT } = await import("./[studentId]");
    const response = await PUT(context("no-such-student-0000", { exerciseSlug: "deploy-first-worker" }));
    expect(response.status).toBe(404);
  });

  it("400s for an unknown exercise slug", async () => {
    const { PUT } = await import("./[studentId]");
    const response = await PUT(context("curious-hacker-2019", { exerciseSlug: "nope" }));
    expect(response.status).toBe(400);
  });

  it("400s for an unknown lesson slug", async () => {
    const { PUT } = await import("./[studentId]");
    const response = await PUT(context("curious-hacker-2019", { lessonSlug: "nope", harness: "claude-code" }));
    expect(response.status).toBe(400);
  });

  it("marks an exercise complete without deployedUrl", async () => {
    const { PUT, GET } = await import("./[studentId]");
    const response = await PUT(context("curious-hacker-2019", { exerciseSlug: "deploy-first-worker" }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      completedExercises: Array<{ slug: string; completedAt: string; deployedUrl?: string }>;
    };
    expect(body.completedExercises).toHaveLength(1);
    expect(body.completedExercises[0]?.slug).toBe("deploy-first-worker");
    expect(body.completedExercises[0]?.deployedUrl).toBeUndefined();
    expect(body.completedExercises[0]?.completedAt).toMatch(/^\d{4}-/);

    const fetched = (await (await GET(context("curious-hacker-2019"))).json()) as typeof body;
    expect(fetched.completedExercises).toEqual(body.completedExercises);
  });

  it("stores optional deployedUrl and model on upsert", async () => {
    const { PUT } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { exerciseSlug: "deploy-first-worker" }));

    const response = await PUT(
      context("curious-hacker-2019", {
        exerciseSlug: "deploy-first-worker",
        deployedUrl: "https://hello.example.workers.dev",
        model: "anthropic/claude-sonnet-4-5",
      }),
    );
    const body = (await response.json()) as {
      completedExercises: Array<{ deployedUrl?: string; model?: string }>;
    };
    expect(body.completedExercises).toHaveLength(1);
    expect(body.completedExercises[0]?.deployedUrl).toBe("https://hello.example.workers.dev");
    expect(body.completedExercises[0]?.model).toBe("anthropic/claude-sonnet-4-5");
  });

  it("marks a lesson complete", async () => {
    const { PUT, GET } = await import("./[studentId]");
    const response = await PUT(
      context("curious-hacker-2019", {
        lessonSlug: "models",
        harness: "claude-code",
        model: "anthropic/claude-sonnet-4-5",
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      completedLessons: Array<{ slug: string; completedAt: string; model?: string }>;
    };
    expect(body.completedLessons).toHaveLength(1);
    expect(body.completedLessons[0]?.slug).toBe("models");
    expect(body.completedLessons[0]?.model).toBe("anthropic/claude-sonnet-4-5");

    const fetched = (await (await GET(context("curious-hacker-2019"))).json()) as typeof body;
    expect(fetched.completedLessons).toEqual(body.completedLessons);
  });

  it("stores a lesson summary and keeps it when a later PUT omits it", async () => {
    const { PUT } = await import("./[studentId]");
    const lesson = { lessonSlug: "interview", harness: "claude-code" };
    await PUT(context("curious-hacker-2019", { ...lesson, summary: "You're new to Cloudflare." }));
    const response = await PUT(context("curious-hacker-2019", { lessonSlug: "interview", harness: "claude-code" }));
    const body = (await response.json()) as { completedLessons: Array<{ summary?: string }> };
    expect(body.completedLessons[0]?.summary).toBe("You're new to Cloudflare.");
  });

  it("replaces a lesson summary when a later PUT sends a new one", async () => {
    const { PUT } = await import("./[studentId]");
    const lesson = { lessonSlug: "interview", harness: "claude-code" };
    await PUT(context("curious-hacker-2019", { ...lesson, summary: "Quizzes on." }));
    const response = await PUT(context("curious-hacker-2019", { ...lesson, summary: "Quizzes off." }));
    const body = (await response.json()) as { completedLessons: Array<{ summary?: string }> };
    expect(body.completedLessons[0]?.summary).toBe("Quizzes off.");
  });

  it("400s for a lesson without a harness", async () => {
    const { PUT } = await import("./[studentId]");
    const response = await PUT(context("curious-hacker-2019", { lessonSlug: "models" }));
    expect(response.status).toBe(400);
  });

  it("keeps one completion per harness for the same lesson", async () => {
    const { PUT } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { lessonSlug: "models", harness: "claude-code" }));
    const response = await PUT(context("curious-hacker-2019", { lessonSlug: "models", harness: "codex" }));
    const body = (await response.json()) as { completedLessons: Array<{ slug: string; harness: string }> };
    expect(body.completedLessons.map((item) => item.harness).sort()).toEqual(["claude-code", "codex"]);
  });

  it("upserts when the same harness completes a lesson again", async () => {
    const { PUT } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { lessonSlug: "models", harness: "pi" }));
    const response = await PUT(context("curious-hacker-2019", { lessonSlug: "models", harness: "pi" }));
    const body = (await response.json()) as { completedLessons: unknown[] };
    expect(body.completedLessons).toHaveLength(1);
  });

  it("broadcasts the new progress to the student's ProgressHub", async () => {
    const { PUT } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { lessonSlug: "models", harness: "claude-code" }));
    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0]?.hub).toBe("curious-hacker-2019");
    expect(broadcasts[0]?.progress.completedLessons).toHaveLength(1);
  });

  it("doesn't broadcast when the request is rejected", async () => {
    const { PUT } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { lessonSlug: "nope", harness: "claude-code" }));
    expect(broadcasts).toHaveLength(0);
  });

  it("tracks exercises and lessons independently", async () => {
    const { PUT } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { exerciseSlug: "deploy-first-worker" }));
    const response = await PUT(context("curious-hacker-2019", { lessonSlug: "models", harness: "claude-code" }));
    const body = (await response.json()) as {
      completedExercises: unknown[];
      completedLessons: unknown[];
    };
    expect(body.completedExercises).toHaveLength(1);
    expect(body.completedLessons).toHaveLength(1);
  });
});

describe("DELETE /api/progress/{studentId}", () => {
  it("404s for an unknown student", async () => {
    const { DELETE } = await import("./[studentId]");
    const response = await DELETE(context("no-such-student-0000"));
    expect(response.status).toBe(404);
  });

  it("clears completed exercises and lessons but keeps the student", async () => {
    const { PUT, DELETE, GET } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { exerciseSlug: "deploy-first-worker" }));
    await PUT(context("curious-hacker-2019", { lessonSlug: "models", harness: "claude-code" }));

    const response = await DELETE(context("curious-hacker-2019"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { completedExercises: unknown[]; completedLessons: unknown[] };
    expect(body.completedExercises).toEqual([]);
    expect(body.completedLessons).toEqual([]);

    const fetched = await GET(context("curious-hacker-2019"));
    expect(fetched.status).toBe(200);
    expect(broadcasts.at(-1)?.progress.completedLessons).toEqual([]);
  });

  it("only clears the targeted student's progress", async () => {
    students.set("another-student-1234", { id: "another-student-1234", created_at: "2026-09-11T00:00:00.000Z" });
    const { PUT, DELETE, GET } = await import("./[studentId]");
    await PUT(context("curious-hacker-2019", { exerciseSlug: "deploy-first-worker" }));
    await PUT(context("another-student-1234", { exerciseSlug: "deploy-first-worker" }));

    await DELETE(context("curious-hacker-2019"));

    const other = (await (await GET(context("another-student-1234"))).json()) as { completedExercises: unknown[] };
    expect(other.completedExercises).toHaveLength(1);
  });
});
