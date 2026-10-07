import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Progress } from "../../../schemas/progress";
import { createSqliteD1 } from "../../../test/sqlite-d1";

const state = vi.hoisted(() => ({
  db: undefined as unknown as D1Database,
  broadcasts: [] as Array<{ hub: string; progress: Progress }>,
}));

vi.mock("cloudflare:workers", () => ({
  env: {
    get DB() {
      return state.db;
    },
    PROGRESS_HUB: {
      getByName: (hub: string) => ({
        broadcast: async (progress: Progress) => {
          state.broadcasts.push({ hub, progress });
        },
      }),
    },
  },
}));

// Two small courses: Agent setup (interview, models, instructions) and
// Workers basics (the default interview, deploy-first-worker).
vi.mock("astro:content", async () => (await import("../../../test/fake-content")).fakeAstroContent);

const STUDENT = "curious-hacker-2019";

beforeEach(async () => {
  state.db = createSqliteD1();
  state.broadcasts.length = 0;
  for (const [id, createdAt] of [
    [STUDENT, "2026-09-10T12:00:00.000Z"],
    ["another-student-1234", "2026-09-11T00:00:00.000Z"],
  ]) {
    await state.db.prepare("INSERT INTO students (id, created_at) VALUES (?, ?)").bind(id, createdAt).run();
  }
});

function context(studentId: string, body?: unknown): APIContext {
  return {
    params: { studentId },
    url: new URL(`https://school.example/api/progress/${studentId}`),
    request: { json: async () => body } as unknown as Request,
  } as unknown as APIContext;
}

async function put(studentId: string, body: unknown): Promise<{ status: number; progress: Progress }> {
  const { PUT } = await import("./[studentId]");
  const response = await PUT(context(studentId, body));
  return { status: response.status, progress: (await response.json()) as Progress };
}

function exercise(progress: Progress, course: string, slug: string) {
  return progress.courses.find((item) => item.name === course)?.exercises.find((item) => item.slug === slug);
}

function course(progress: Progress, name: string) {
  return progress.courses.find((item) => item.name === name);
}

const models = { course: "agent-setup", exercise: "models", harness: "claude-code" };

describe("GET /api/progress/{studentId}", () => {
  it("404s for an unknown student", async () => {
    const { GET } = await import("./[studentId]");
    expect((await GET(context("no-such-student-0000"))).status).toBe(404);
  });

  it("lists every course and exercise in order, with no completions, for a new student", async () => {
    const { GET } = await import("./[studentId]");
    const progress = (await (await GET(context(STUDENT))).json()) as Progress;

    expect(progress.studentId).toBe(STUDENT);
    expect(progress.updatedAt).toBe("2026-09-10T12:00:00.000Z");
    expect(progress.courses.map((item) => [item.name, item.exercises.map((ex) => ex.slug)])).toEqual([
      ["agent-setup", ["interview", "models", "instructions"]],
      ["workers-basics", ["interview", "deploy-first-worker"]],
    ]);
    for (const item of progress.courses) {
      expect(item.completedAt).toBeUndefined();
      expect(item.interviewSummary).toBeUndefined();
      for (const ex of item.exercises) expect(ex.completions).toEqual([]);
    }
  });

  it("includes each course's interview summary", async () => {
    await state.db
      .prepare("INSERT INTO interviews (student_id, course_id, responses, summary, updated_at) VALUES (?, ?, ?, ?, ?)")
      .bind(STUDENT, "workers-basics", "[]", "You've never used KV.", "2026-10-01T12:00:00.000Z")
      .run();

    const { GET } = await import("./[studentId]");
    const progress = (await (await GET(context(STUDENT))).json()) as Progress;
    expect(course(progress, "workers-basics")?.interviewSummary).toBe("You've never used KV.");
    expect(course(progress, "agent-setup")?.interviewSummary).toBeUndefined();
  });
});

describe("PUT /api/progress/{studentId}", () => {
  it("404s for an unknown student", async () => {
    expect((await put("no-such-student-0000", models)).status).toBe(404);
  });

  it("400s for an unknown course or exercise, and for the old request shapes", async () => {
    expect((await put(STUDENT, { ...models, course: "nope" })).status).toBe(400);
    expect((await put(STUDENT, { ...models, exercise: "nope" })).status).toBe(400);
    expect((await put(STUDENT, { ...models, course: "workers-basics" })).status).toBe(400);
    expect((await put(STUDENT, { lessonSlug: "models", harness: "claude-code" })).status).toBe(400);
    expect((await put(STUDENT, { exerciseSlug: "deploy-first-worker" })).status).toBe(400);
    expect(state.broadcasts).toHaveLength(0);
  });

  it("400s without a harness", async () => {
    expect((await put(STUDENT, { course: "agent-setup", exercise: "models" })).status).toBe(400);
  });

  it("marks an exercise complete with its URL, harness, and model", async () => {
    const { status, progress } = await put(STUDENT, { ...models, model: "anthropic/claude-sonnet-4-5" });
    expect(status).toBe(200);
    expect(exercise(progress, "agent-setup", "models")?.completions).toEqual([
      {
        harness: "claude-code",
        completedAt: expect.stringMatching(/^\d{4}-/),
        exerciseUrl: "https://school.example/courses/agent-setup/models",
        model: "anthropic/claude-sonnet-4-5",
      },
    ]);
    expect(progress.updatedAt).toBe(exercise(progress, "agent-setup", "models")?.completions[0].completedAt);

    const { GET } = await import("./[studentId]");
    expect(await (await GET(context(STUDENT))).json()).toEqual(progress);
  });

  it("marks a course's default interview complete", async () => {
    const { progress } = await put(STUDENT, { course: "workers-basics", exercise: "interview", harness: "codex" });
    expect(exercise(progress, "workers-basics", "interview")?.completions).toHaveLength(1);
    expect(exercise(progress, "agent-setup", "interview")?.completions).toEqual([]);
  });

  it("keeps one completion per harness, and upserts when the same harness completes it again", async () => {
    await put(STUDENT, models);
    await put(STUDENT, { ...models, harness: "codex" });
    const { progress } = await put(STUDENT, { ...models, model: "openai/gpt-5" });
    const completions = exercise(progress, "agent-setup", "models")!.completions;
    expect(completions.map((item) => item.harness).sort()).toEqual(["claude-code", "codex"]);
    expect(completions.find((item) => item.harness === "claude-code")?.model).toBe("openai/gpt-5");
  });

  it("ignores a summary, which moved to interviews", async () => {
    const { progress } = await put(STUDENT, { course: "agent-setup", exercise: "interview", harness: "claude-code", summary: "Hi." });
    expect(exercise(progress, "agent-setup", "interview")?.completions[0]).not.toHaveProperty("summary");
    expect(course(progress, "agent-setup")?.interviewSummary).toBeUndefined();
  });

  it("marks a course complete once every exercise has a completion, from any harness", async () => {
    const first = await put(STUDENT, { course: "workers-basics", exercise: "interview", harness: "claude-code" });
    expect(course(first.progress, "workers-basics")?.completedAt).toBeUndefined();

    const last = await put(STUDENT, { course: "workers-basics", exercise: "deploy-first-worker", harness: "codex" });
    const completedAt = course(last.progress, "workers-basics")?.completedAt;
    expect(completedAt).toBe(exercise(last.progress, "workers-basics", "deploy-first-worker")?.completions[0].completedAt);
    expect(course(last.progress, "agent-setup")?.completedAt).toBeUndefined();
  });

  it("keeps the course's first completion date when an exercise is completed again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-10-01T12:00:00.000Z"));
      await put(STUDENT, { course: "workers-basics", exercise: "interview", harness: "claude-code" });
      await put(STUDENT, { course: "workers-basics", exercise: "deploy-first-worker", harness: "claude-code" });
      vi.setSystemTime(new Date("2026-10-05T12:00:00.000Z"));
      const again = await put(STUDENT, { course: "workers-basics", exercise: "deploy-first-worker", harness: "pi" });
      expect(course(again.progress, "workers-basics")?.completedAt).toBe("2026-10-01T12:00:00.000Z");
      expect(again.progress.updatedAt).toBe("2026-10-05T12:00:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("broadcasts the new progress to the student's ProgressHub", async () => {
    await put(STUDENT, models);
    expect(state.broadcasts).toHaveLength(1);
    expect(state.broadcasts[0].hub).toBe(STUDENT);
    expect(exercise(state.broadcasts[0].progress, "agent-setup", "models")?.completions).toHaveLength(1);
  });
});

describe("DELETE /api/progress/{studentId}", () => {
  it("404s for an unknown student", async () => {
    const { DELETE } = await import("./[studentId]");
    expect((await DELETE(context("no-such-student-0000"))).status).toBe(404);
  });

  it("clears exercise and course completions but keeps the student and interviews", async () => {
    await put(STUDENT, models);
    await put(STUDENT, { course: "workers-basics", exercise: "interview", harness: "claude-code" });
    await put(STUDENT, { course: "workers-basics", exercise: "deploy-first-worker", harness: "claude-code" });

    await state.db
      .prepare("INSERT INTO interviews (student_id, course_id, responses, summary, updated_at) VALUES (?, ?, ?, ?, ?)")
      .bind(STUDENT, "agent-setup", "[]", "You skipped every question.", "2026-10-01T12:00:00.000Z")
      .run();

    const { DELETE, GET } = await import("./[studentId]");
    const progress = (await (await DELETE(context(STUDENT))).json()) as Progress;
    for (const item of progress.courses) {
      expect(item.completedAt).toBeUndefined();
      for (const ex of item.exercises) expect(ex.completions).toEqual([]);
    }
    expect(course(progress, "agent-setup")?.interviewSummary).toBe("You skipped every question.");
    expect((await GET(context(STUDENT))).status).toBe(200);
    expect(state.broadcasts.at(-1)?.progress).toEqual(progress);
  });

  it("only clears the targeted student's progress", async () => {
    await put(STUDENT, models);
    await put("another-student-1234", models);

    const { DELETE, GET } = await import("./[studentId]");
    await DELETE(context(STUDENT));

    const other = (await (await GET(context("another-student-1234"))).json()) as Progress;
    expect(exercise(other, "agent-setup", "models")?.completions).toHaveLength(1);
  });
});
