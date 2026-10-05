#!/usr/bin/env node
// Scripted "fake agent" that exercises the use-worker-previews exercise +
// progress HTTP contract documented in /llms.txt against a real running
// Worker. Sibling to fake-agent-exercise.mjs (kept separate rather than
// generalizing that script, to keep this addition a small, low-risk diff).
// This is not a simulation of an LLM conversation and does not provision
// real KV namespaces or deploy a real Worker or Preview. That verification stays
// agent-side; this script only checks the Dev School API contract.
//
// Usage:
//   node scripts/fake-agent-exercise-previews.mjs
//   BASE_URL=https://cloudflare-dev-school-pr-123.ziki.workers.dev node scripts/fake-agent-exercise-previews.mjs

const baseUrl = process.env.BASE_URL || "http://localhost:8788";

async function main() {
  log(`Base URL: ${baseUrl}`);

  const student = await request("POST", "/api/students");
  assert(/^[a-z]+-[a-z]+-\d{4}$/.test(student.id), `student id looks wrong: ${student.id}`);
  log(`Enrolled as ${student.id}`);

  const llmsTxt = await fetchText("/llms.txt");
  assert(llmsTxt.includes("GET /api/exercises"), "llms.txt doesn't document GET /api/exercises");
  assert(llmsTxt.includes("PUT /api/progress/{studentId}"), "llms.txt doesn't document PUT progress");
  assert(llmsTxt.includes("use-worker-previews"), "llms.txt doesn't mention use-worker-previews");
  log("Fetched /llms.txt and confirmed it documents the Previews exercise");

  const exercises = await request("GET", "/api/exercises");
  assert(Array.isArray(exercises) && exercises.length >= 3, "expected at least three exercises");
  assert(
    exercises.some((e) => e.slug === "use-worker-previews"),
    "use-worker-previews missing from list",
  );
  log(`Listed ${exercises.length} exercise(s)`);

  const exercise = await request("GET", "/api/exercises/use-worker-previews");
  assert(exercise.slug === "use-worker-previews", "slug mismatch on detail");
  assert(typeof exercise.content === "string" && exercise.content.length > 0, "content missing");
  assert(
    typeof exercise.agentInstructions === "string" && exercise.agentInstructions.includes("PUT"),
    "agentInstructions should mention marking complete via PUT",
  );
  log("Fetched use-worker-previews content + agentInstructions");

  const emptyProgress = await request("GET", `/api/progress/${student.id}`);
  assert(emptyProgress.studentId === student.id, "progress studentId mismatch");
  assert(
    Array.isArray(emptyProgress.completedExercises) && emptyProgress.completedExercises.length === 0,
    "expected no completions yet",
  );
  log("GET progress returned empty completedExercises");

  const afterComplete = await request("PUT", `/api/progress/${student.id}`, {
    exerciseSlug: "use-worker-previews",
  });
  assert(afterComplete.completedExercises.length === 1, "expected one completion");
  assert(afterComplete.completedExercises[0].slug === "use-worker-previews", "wrong slug completed");
  assert(!afterComplete.completedExercises[0].deployedUrl, "deployedUrl should be absent when omitted");
  log("Marked use-worker-previews complete without deployedUrl");

  const withUrl = await request("PUT", `/api/progress/${student.id}`, {
    exerciseSlug: "use-worker-previews",
    deployedUrl: "https://try-previews-hello-from-cds.example.workers.dev",
    model: "fake-agent/test",
  });
  assert(withUrl.completedExercises.length === 1, "upsert should not duplicate completions");
  assert(
    withUrl.completedExercises[0].deployedUrl === "https://try-previews-hello-from-cds.example.workers.dev",
    "deployedUrl not stored",
  );
  assert(withUrl.completedExercises[0].model === "fake-agent/test", "model not stored");
  log("Upserted completion with optional deployedUrl and model");

  const fetched = await request("GET", `/api/progress/${student.id}`);
  assert(
    fetched.completedExercises[0].deployedUrl === "https://try-previews-hello-from-cds.example.workers.dev",
    "GET progress lost deployedUrl",
  );
  log("GET progress returned the updated completion");

  // Completing deploy-first-worker too should result in both completions
  // coexisting for the same student, proving the two exercises don't clobber
  // each other in exercise_completions.
  const withBoth = await request("PUT", `/api/progress/${student.id}`, {
    exerciseSlug: "deploy-first-worker",
  });
  assert(withBoth.completedExercises.length === 2, "expected both exercises completed");
  log("Completing deploy-first-worker alongside use-worker-previews keeps both completions");

  log("✅ Fake-agent exercise-previews run passed");
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
  console.log(`[fake-agent-previews] ${message}`);
}

main().catch((error) => {
  console.error(`[fake-agent-previews] ❌ ${error.message}`);
  process.exit(1);
});
