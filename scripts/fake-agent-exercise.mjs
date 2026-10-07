#!/usr/bin/env node
// Scripted "fake agent" that exercises the exercise + progress HTTP contract
// documented in /llms.txt against a real running Worker. This is not a
// simulation of an LLM conversation and does not deploy a real Worker —
// URL verification stays agent-side; this script only checks the API.
//
// Usage:
//   node scripts/fake-agent-exercise.mjs
//   BASE_URL=https://cloudflare-dev-school-pr-123.ziki.workers.dev node scripts/fake-agent-exercise.mjs

const baseUrl = process.env.BASE_URL || "http://localhost:8788";

async function main() {
  log(`Base URL: ${baseUrl}`);

  const student = await request("POST", "/api/students");
  assert(/^[a-z]+-[a-z]+-\d{4}$/.test(student.id), `student id looks wrong: ${student.id}`);
  log(`Enrolled as ${student.id}`);

  const llmsTxt = await fetchText("/llms.txt");
  assert(llmsTxt.includes("GET /api/courses"), "llms.txt doesn't document GET /api/courses");
  assert(llmsTxt.includes("PUT /api/progress/{studentId}"), "llms.txt doesn't document PUT progress");
  log("Fetched /llms.txt and confirmed it documents the course and progress endpoints");

  const courses = await request("GET", "/api/courses");
  assert(courses[0]?.name === "agent-setup", "Agent setup should be the first course");
  const course = courses.find((c) => c.name === "workers-basics");
  assert(course, "workers-basics missing from /api/courses");
  assert(course.exercises[0]?.slug === "interview", "a course's first exercise should be its interview");
  const exercise = course.exercises.find((e) => e.slug === "deploy-first-worker");
  assert(exercise, "deploy-first-worker missing from workers-basics");
  log(`Listed ${courses.length} course(s); workers-basics has ${course.exercises.length} exercise(s)`);

  const markdown = await fetchText(new URL(exercise.markdownUrl).pathname);
  assert(/^---\n[\s\S]*agent-instructions:/.test(markdown), "exercise Markdown should have agent-instructions frontmatter");
  assert(markdown.includes("PUT /api/progress/{studentId}"), "agent-instructions should mention marking complete via PUT");
  log("Fetched deploy-first-worker's raw Markdown");

  const completionsOf = (progress, slug) =>
    progress.courses.find((c) => c.name === "workers-basics")?.exercises.find((e) => e.slug === slug)?.completions;

  const emptyProgress = await request("GET", `/api/progress/${student.id}`);
  assert(emptyProgress.studentId === student.id, "progress studentId mismatch");
  assert(completionsOf(emptyProgress, "deploy-first-worker")?.length === 0, "expected no completions yet");
  log("GET progress listed deploy-first-worker with no completions");

  const mark = { course: "workers-basics", exercise: "deploy-first-worker", harness: "generic", model: "fake-agent/test" };
  const afterComplete = await request("PUT", `/api/progress/${student.id}`, mark);
  const [completion] = completionsOf(afterComplete, "deploy-first-worker");
  assert(completion?.harness === "generic" && completion.model === "fake-agent/test", "completion lost its harness or model");
  const expectedUrl = new URL("/courses/workers-basics/deploy-first-worker", baseUrl).toString();
  assert(completion.exerciseUrl === expectedUrl, `unexpected exerciseUrl: ${completion.exerciseUrl}`);
  log("Marked deploy-first-worker complete, with its exercise URL");

  const again = await request("PUT", `/api/progress/${student.id}`, mark);
  assert(completionsOf(again, "deploy-first-worker").length === 1, "upsert should not duplicate completions");
  log("Completing it again with the same harness didn't add a completion");

  const fetched = await request("GET", `/api/progress/${student.id}`);
  assert(completionsOf(fetched, "deploy-first-worker").length === 1, "GET progress lost the completion");
  log("GET progress returned the completion");

  const badSlug = await requestRaw("PUT", `/api/progress/${student.id}`, { ...mark, exercise: "nope" });
  assert(badSlug.status === 400, `expected 400 for an unknown exercise, got ${badSlug.status}`);
  const oldShape = await requestRaw("PUT", `/api/progress/${student.id}`, { exerciseSlug: "deploy-first-worker" });
  assert(oldShape.status === 400, `expected 400 for the old request shape, got ${oldShape.status}`);
  log("Unknown exercises and the old request shape were rejected with 400");

  log("✅ Fake-agent exercise run passed");
}

async function request(method, path, body) {
  const response = await requestRaw(method, path, body);
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function requestRaw(method, path, body) {
  // Astro's built-in CSRF protection rejects same-origin-looking non-GET
  // requests without a matching Origin header (see AGENTS.md).
  const headers = { Origin: baseUrl };
  if (body) headers["Content-Type"] = "application/json";

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return response.text();
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function log(message) {
  console.log(`[fake-agent] ${message}`);
}

main().catch((error) => {
  console.error(`[fake-agent] ❌ ${error.message}`);
  process.exit(1);
});
