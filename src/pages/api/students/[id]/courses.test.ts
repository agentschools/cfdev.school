import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExternalCourse } from "../../../../schemas/course";
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

async function report(
  id: string,
  body: unknown,
  origin = "https://school.example",
): Promise<{ status: number; body: ExternalCourse }> {
  const { PUT } = await import("./courses");
  const response = await PUT({
    params: { id },
    url: new URL(`/api/students/${id}/courses`, origin),
    request: { json: async () => body } as unknown as Request,
  } as unknown as APIContext);
  return { status: response.status, body: (await response.json()) as ExternalCourse };
}

const repo = "https://github.com/acme/durable-objects";
const firstObject = { slug: "first-object", title: "Your first object", url: `${repo}/blob/main/exercises/01-first-object.md` };
const websockets = { slug: "websockets", title: "WebSockets", url: `${repo}/blob/main/exercises/02-websockets.md` };
const manifest = { url: `${repo}.git`, title: "Durable Objects", exercises: [firstObject, websockets] };

describe("PUT /api/students/{id}/courses", () => {
  it("404s for an unknown student", async () => {
    expect((await report("no-such-student-0000", manifest)).status).toBe(404);
  });

  it("400s for a URL that isn't https and for duplicate slugs", async () => {
    expect((await report(STUDENT, { ...manifest, url: "http://github.com/acme/durable-objects" })).status).toBe(400);
    expect((await report(STUDENT, { ...manifest, exercises: [firstObject, firstObject] })).status).toBe(400);
    expect(state.broadcasts).toHaveLength(0);
  });

  it("normalizes the URL and adds the default interview first when the course has none", async () => {
    const { status, body } = await report(STUDENT, manifest);
    expect(status).toBe(200);
    expect(body).toEqual({
      url: repo,
      title: "Durable Objects",
      exercises: [
        { slug: "interview", title: "Interview", url: "https://school.example/default-interview.md" },
        firstObject,
        websockets,
      ],
      updatedAt: expect.stringMatching(/^\d{4}-/),
    });
  });

  it("points the default interview at this site even when it's served over http, as in local dev", async () => {
    const { status, body } = await report(STUDENT, manifest, "http://localhost:8788");
    expect(status).toBe(200);
    expect(body.exercises[0].url).toBe("http://localhost:8788/default-interview.md");
    expect(state.broadcasts[0].progress.externalCourses[0].exercises[0].url).toBe("http://localhost:8788/default-interview.md");
  });

  it("moves the course's own interview first", async () => {
    const interview = { slug: "interview", title: "Before we start", url: `${repo}/blob/main/exercises/interview.md` };
    const { body } = await report(STUDENT, { ...manifest, exercises: [firstObject, interview, websockets] });
    expect(body.exercises.map((exercise) => exercise.slug)).toEqual(["interview", "first-object", "websockets"]);
    expect(body.exercises[0]).toEqual(interview);
  });

  it("treats other forms of the same URL as the same course, replacing its manifest", async () => {
    await report(STUDENT, manifest);
    await report(STUDENT, { ...manifest, url: `${repo}/?tab=readme`, title: "Durable Objects, revised", exercises: [websockets] });

    const progress = state.broadcasts.at(-1)!.progress;
    expect(progress.externalCourses).toHaveLength(1);
    expect(progress.externalCourses[0]).toMatchObject({ url: repo, title: "Durable Objects, revised" });
    expect(progress.externalCourses[0].exercises.map((exercise) => exercise.slug)).toEqual(["interview", "websockets"]);
  });

  it("broadcasts progress with the course in it", async () => {
    await report(STUDENT, { ...manifest, author: "Acme" });
    expect(state.broadcasts).toHaveLength(1);
    expect(state.broadcasts[0].hub).toBe(STUDENT);
    expect(state.broadcasts[0].progress.externalCourses).toEqual([
      expect.objectContaining({ url: repo, author: "Acme", exercises: expect.arrayContaining([{ ...firstObject, completions: [] }]) }),
    ]);
  });
});
