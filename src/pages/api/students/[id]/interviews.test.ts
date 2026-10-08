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
// and Workers basics (the default interview, deploy-a-worker).
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
    request: { json: async () => body } as unknown as Request,
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

const workersBasics = {
  course: "workers-basics",
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
    await put(STUDENT, workersBasics);
    const { status, body } = await put(STUDENT, agentSetup);

    expect(status).toBe(200);
    expect(body.interviews).toEqual([
      { ...agentSetup, updatedAt: expect.stringMatching(/^\d{4}-/) },
      { ...workersBasics, updatedAt: expect.stringMatching(/^\d{4}-/) },
    ]);
    expect((await get(STUDENT)).body).toEqual(body);
  });

  it("replaces a course's whole interview without touching the others", async () => {
    await put(STUDENT, agentSetup);
    await put(STUDENT, workersBasics);
    const changed = {
      ...agentSetup,
      responses: [{ question: "Want a short quiz at the end of each exercise? (recommended, skippable anytime)", answer: "no" }],
      summary: "You opted out of quizzes.",
    };
    const { body } = await put(STUDENT, changed);

    expect(body.interviews).toEqual([
      { ...changed, updatedAt: expect.any(String) },
      { ...workersBasics, updatedAt: expect.any(String) },
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
    expect(courses.find((course) => course.name === "workers-basics")?.interviewSummary).toBeUndefined();
  });
});
