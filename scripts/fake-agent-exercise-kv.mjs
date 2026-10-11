#!/usr/bin/env node
// Scripted "fake agent" that exercises the add-a-binding exercise +
// progress HTTP contract documented in /llms.txt against a real running
// Worker. Sibling to fake-agent-exercise.mjs (kept separate rather than
// generalizing that script, to keep this addition a small, low-risk diff).
// This is not a simulation of an LLM conversation and does not provision a
// real KV namespace or deploy a real Worker — that verification stays
// agent-side; this script only checks the Dev School API contract.
//
// Usage:
//   node scripts/fake-agent-exercise-kv.mjs
//   BASE_URL=https://cloudflare-dev-school-pr-123.ziki.workers.dev node scripts/fake-agent-exercise-kv.mjs

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
  const course = courses.find((c) => c.name === "workers");
  assert(course, "workers missing from /api/courses");
  assert(course.exercises[0]?.slug === "interview", "a course's first exercise should be its interview");
  const exercise = course.exercises.find((e) => e.slug === "add-a-binding");
  assert(exercise, "add-a-binding missing from workers");
  log(`Listed ${courses.length} course(s); workers has ${course.exercises.length} exercise(s)`);

  const markdown = await fetchText(new URL(exercise.markdownUrl).pathname);
  assert(/^---\n[\s\S]*agent-instructions:/.test(markdown), "exercise Markdown should have agent-instructions frontmatter");
  assert(markdown.includes("PUT /api/progress/{studentId}"), "agent-instructions should mention marking complete via PUT");
  log("Fetched add-a-binding's raw Markdown");

  const workersCourse = (progress) => progress.courses.find((c) => c.name === "workers");
  const completionsOf = (progress, slug) => workersCourse(progress)?.exercises.find((e) => e.slug === slug)?.completions;

  const emptyProgress = await request("GET", `/api/progress/${student.id}`);
  assert(emptyProgress.studentId === student.id, "progress studentId mismatch");
  assert(completionsOf(emptyProgress, "add-a-binding")?.length === 0, "expected no completions yet");
  log("GET progress listed add-a-binding with no completions");

  const mark = { course: "workers", exercise: "add-a-binding", harness: "generic", model: "fake-agent/test" };
  const afterComplete = await request("PUT", `/api/progress/${student.id}`, mark);
  assert(completionsOf(afterComplete, "add-a-binding").length === 1, "expected one completion");
  assert(!workersCourse(afterComplete).completedAt, "the course shouldn't be complete yet");
  log("Marked add-a-binding complete");

  const withCodex = await request("PUT", `/api/progress/${student.id}`, { ...mark, harness: "codex" });
  assert(completionsOf(withCodex, "add-a-binding").length === 2, "expected one completion per harness");
  log("Completing it with a second harness added a second completion");

  // Completing the rest of Workers (its default interview and
  // deploy-a-worker) completes the course.
  await request("PUT", `/api/progress/${student.id}`, { ...mark, exercise: "interview" });
  const withAll = await request("PUT", `/api/progress/${student.id}`, { ...mark, exercise: "deploy-a-worker" });
  assert(
    workersCourse(withAll).exercises.every((e) => e.completions.length > 0),
    "expected every Workers exercise to be complete",
  );
  assert(workersCourse(withAll).completedAt, "Workers should be marked complete");
  log("Completing every Workers exercise marked the course complete");

  log("✅ Fake-agent exercise-kv run passed");
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
  console.log(`[fake-agent-kv] ${message}`);
}

main().catch((error) => {
  console.error(`[fake-agent-kv] ❌ ${error.message}`);
  process.exit(1);
});
