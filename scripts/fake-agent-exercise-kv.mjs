#!/usr/bin/env node
// Scripted "fake agent" that exercises the add-first-binding-kv exercise +
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
  const course = courses.find((c) => c.name === "workers-basics");
  assert(course, "workers-basics missing from /api/courses");
  assert(course.exercises[0]?.slug === "interview", "a course's first exercise should be its interview");
  const exercise = course.exercises.find((e) => e.slug === "add-first-binding-kv");
  assert(exercise, "add-first-binding-kv missing from workers-basics");
  log(`Listed ${courses.length} course(s); workers-basics has ${course.exercises.length} exercise(s)`);

  const markdown = await fetchText(new URL(exercise.markdownUrl).pathname);
  assert(/^---\n[\s\S]*agent-instructions:/.test(markdown), "exercise Markdown should have agent-instructions frontmatter");
  assert(markdown.includes("PUT /api/progress/{studentId}"), "agent-instructions should mention marking complete via PUT");
  log("Fetched add-first-binding-kv's raw Markdown");

  const workersBasics = (progress) => progress.courses.find((c) => c.name === "workers-basics");
  const completionsOf = (progress, slug) => workersBasics(progress)?.exercises.find((e) => e.slug === slug)?.completions;

  const emptyProgress = await request("GET", `/api/progress/${student.id}`);
  assert(emptyProgress.studentId === student.id, "progress studentId mismatch");
  assert(completionsOf(emptyProgress, "add-first-binding-kv")?.length === 0, "expected no completions yet");
  log("GET progress listed add-first-binding-kv with no completions");

  const mark = { course: "workers-basics", exercise: "add-first-binding-kv", harness: "generic", model: "fake-agent/test" };
  const afterComplete = await request("PUT", `/api/progress/${student.id}`, mark);
  assert(completionsOf(afterComplete, "add-first-binding-kv").length === 1, "expected one completion");
  assert(!workersBasics(afterComplete).completedAt, "the course shouldn't be complete yet");
  log("Marked add-first-binding-kv complete");

  const withCodex = await request("PUT", `/api/progress/${student.id}`, { ...mark, harness: "codex" });
  assert(completionsOf(withCodex, "add-first-binding-kv").length === 2, "expected one completion per harness");
  log("Completing it with a second harness added a second completion");

  // Completing the rest of Workers basics (its default interview and
  // deploy-first-worker) completes the course.
  await request("PUT", `/api/progress/${student.id}`, { ...mark, exercise: "interview" });
  const withAll = await request("PUT", `/api/progress/${student.id}`, { ...mark, exercise: "deploy-first-worker" });
  assert(
    workersBasics(withAll).exercises.every((e) => e.completions.length > 0),
    "expected every Workers basics exercise to be complete",
  );
  assert(workersBasics(withAll).completedAt, "Workers basics should be marked complete");
  log("Completing every Workers basics exercise marked the course complete");

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
