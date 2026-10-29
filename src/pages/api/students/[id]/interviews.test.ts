import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Interviews } from "../../../../schemas/interview";
import type { Progress } from "../../../../schemas/progress";
import { createSqliteD1 } from "../../../../test/sqlite-d1";

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

// Two small courses: Agent setup (its own interview, models, instructions)
// and Workers (the default interview, deploy-a-worker).
vi.mock("astro:content", async () => (await import("../../../../test/fake-content")).fakeAstroContent);

const STUDENT = "curious-hacker-2019";

beforeEach(async () => {
  state.db = createSqliteD1();
  state.broadcasts.length = 0;
  await state.db
    .prepare("INSERT INTO students (id, created_at) VALUES (?, ?)")
    .bind(STUDENT, "2026-09-10T12:00:00.000Z")
    .run();
});

function context(id: string, body?: unknown): APIContext {
  return {
    params: { id },
    request: new Request("http://localhost/api/interviews", { method: "PUT", body: JSON.stringify(body) }),
  } as unknown as APIContext;
}

async function get(id: string): Promise<{ status: number; body: Interviews }> {
  const { GET } = await import("./interviews");
  const response = await GET(context(id));
  return { status: response.status, body: (await response.json()) as Interviews };
}

async function put(id: string, body: unknown): Promise<{ status: number; body: Interviews }> {
  const { PUT } = await import("./interviews");
  const response = await PUT(context(id, body));
  return { status: response.status, body: (await response.json()) as Interviews };
}

const agentSetup = {
  course: "agent-setup",
  responses: [
    { question: "How much have you used AI coding agents like this one?", answer: "now and then" },
    { question: "Where have you deployed apps before? (pick any)", answer: ["Vercel or Netlify"] },
    { question: "Want a short quiz at the end of each exercise? (recommended, skippable anytime)", answer: "yes" },
    { question: "Which operating system are you on?", answer: "macOS" },
  ],
  summary: "You use AI agents now and then, have deployed on Vercel, are on macOS, and opted into quizzes.",
};

const workersCourse = {
  course: "workers",
  responses: [{ question: "Have you written a serverless function before?", answer: "a few on Vercel" }],
  summary: "You've written a few serverless functions on Vercel.",
};

describe("GET /api/students/{id}/interviews", () => {
  it("404s for an unknown student", async () => {
    expect((await get("no-such-student-0000")).status).toBe(404);
  });

  it("returns an empty list before the first interview", async () => {
    expect(await get(STUDENT)).toEqual({ status: 200, body: { studentId: STUDENT, interviews: [] } });
  });
});

describe("PUT /api/students/{id}/interviews", () => {
  it("404s for an unknown student", async () => {
    expect((await put("no-such-student-0000", agentSetup)).status).toBe(404);
  });

  it("400s for an unknown course, a missing summary, and the old field-per-answer shape", async () => {
    expect((await put(STUDENT, { ...agentSetup, course: "nope" })).status).toBe(400);
    expect((await put(STUDENT, { course: "agent-setup", responses: [] })).status).toBe(400);
    expect((await put(STUDENT, { agentExperience: "occasional", quizOptIn: true })).status).toBe(400);
    expect(state.broadcasts).toHaveLength(0);
  });

  it("stores interviews for an authored and a generated interview, and GET returns both in catalog order", async () => {
    await put(STUDENT, workersCourse);
    const { status, body } = await put(STUDENT, agentSetup);

    expect(status).toBe(200);
    expect(body.interviews).toEqual([
      { ...agentSetup, updatedAt: expect.stringMatching(/^\d{4}-/) },
      { ...workersCourse, updatedAt: expect.stringMatching(/^\d{4}-/) },
    ]);
    expect((await get(STUDENT)).body).toEqual(body);
  });

  it("replaces a course's whole interview without touching the others", async () => {
    await put(STUDENT, agentSetup);
    await put(STUDENT, workersCourse);
    const changed = {
      ...agentSetup,
      responses: [{ question: "Want a short quiz at the end of each exercise? (recommended, skippable anytime)", answer: "no" }],
      summary: "You opted out of quizzes.",
    };
    const { body } = await put(STUDENT, changed);

    expect(body.interviews).toEqual([
      { ...changed, updatedAt: expect.any(String) },
      { ...workersCourse, updatedAt: expect.any(String) },
    ]);
  });

  it("stores a reported course's interview under its normalized URL, after the built-in ones", async () => {
    const repo = "https://github.com/acme/durable-objects";
    const external = { course: `${repo}.git`, responses: [], summary: "You skipped every question." };
    expect((await put(STUDENT, external)).status).toBe(400);

    await state.db
      .prepare(
        "INSERT INTO external_courses (student_id, course_id, title, exercises, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(STUDENT, repo, "Durable Objects", "[]", "2026-10-01T12:00:00.000Z", "2026-10-01T12:00:00.000Z")
      .run();
    await put(STUDENT, external);
    const { body } = await put(STUDENT, agentSetup);

    expect(body.interviews.map((interview) => interview.course)).toEqual(["agent-setup", repo]);
    expect(state.broadcasts.at(-1)?.progress.externalCourses[0].interviewSummary).toBe("You skipped every question.");
  });

  it("broadcasts progress with the course's new interview summary", async () => {
    await put(STUDENT, agentSetup);
    await put(STUDENT, { ...agentSetup, summary: "Quizzes off." });

    expect(state.broadcasts).toHaveLength(2);
    expect(state.broadcasts[1].hub).toBe(STUDENT);
    const courses = state.broadcasts[1].progress.courses;
    expect(courses.find((course) => course.name === "agent-setup")?.interviewSummary).toBe("Quizzes off.");
    expect(courses.find((course) => course.name === "workers")?.interviewSummary).toBeUndefined();
  });
});

describe("web form conditional saves", () => {
  async function conditional(body: unknown, headers: Record<string, string>): Promise<Response> {
    const { PUT } = await import("./interviews");
    const ctx = context(STUDENT);
    ctx.request = new Request("http://localhost/api/interviews", { method: "PUT", headers, body: JSON.stringify(body) });
    return PUT(ctx);
  }

  it("creates once, rejects repeated creation, and never marks an exercise complete", async () => {
    const partial = { ...agentSetup, responses: [...agentSetup.responses, { question: "Goal", answer: [], pending: true }] };
    const first = await conditional(partial, { "If-None-Match": "*" });
    expect((await get(STUDENT)).body.interviews[0].responses.at(-1)).toEqual({ question: "Goal", answer: [], pending: true });
    expect(first.status).toBe(200);
    expect(first.headers.get("Cache-Control")).toBe("no-store");
    expect((await conditional({ ...agentSetup, summary: "stale" }, { "If-None-Match": "*" })).status).toBe(412);
    expect((await get(STUDENT)).body.interviews[0].summary).toBe(agentSetup.summary);
    expect(await state.db.prepare("SELECT COUNT(*) AS n FROM course_exercise_completions").first()).toEqual({ n: 0 });
    expect(state.broadcasts).toHaveLength(1);
  });

  it("preserves explicit skips and detected context, rejects stale edits after agent saves", async () => {
    const first = await put(STUDENT, agentSetup);
    const timestamp = first.body.interviews[0].updatedAt;
    const changed = { ...agentSetup, responses: [...agentSetup.responses, { question: "Goal", answer: [] }] };
    const response = await conditional(changed, { "If-Match": `"${timestamp}"` });
    expect(response.status).toBe(200);
    const data = await response.json() as Interviews;
    const saved = data.interviews[0];
    expect(saved.responses.at(-1)).toEqual({ question: "Goal", answer: [] });
    expect(saved.responses).toContainEqual({ question: "Which operating system are you on?", answer: "macOS" });
    expect(saved.updatedAt > timestamp).toBe(true);
    await put(STUDENT, { ...agentSetup, summary: "Changed by your agent" });
    expect((await conditional(changed, { "If-Match": `"${saved.updatedAt}"` })).status).toBe(412);
    expect((await get(STUDENT)).body.interviews[0].summary).toBe("Changed by your agent");
  });

  it("rejects an update to a missing interview and leaves other students untouched", async () => {
    expect((await conditional(agentSetup, { "If-Match": '"2026-10-01T00:00:00.000Z"' })).status).toBe(412);
    await state.db.prepare("INSERT INTO students (id, created_at) VALUES (?, ?)").bind("other-student-1111", "2026-10-01T00:00:00.000Z").run();
    await put("other-student-1111", agentSetup);
    await conditional({ ...agentSetup, responses: [] }, { "If-None-Match": "*" });
    expect((await get("other-student-1111")).body.interviews[0].responses).toEqual(agentSetup.responses);
    const { GET } = await import("./interviews");
    expect((await GET(context(STUDENT))).headers.get("Cache-Control")).toBe("no-store");
  });
});
