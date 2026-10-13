#!/usr/bin/env node
// Scripted "fake agent" for courses hosted outside this site (#77): report a
// course's manifest the way llms.txt describes, take its interview, complete
// every exercise, and check the course completes. Like the other fake-agent
// scripts, it exercises the HTTP contract against a real running Worker and
// doesn't clone or fetch a real course.
//
// Usage:
//   node scripts/fake-agent-external-course.mjs
//   BASE_URL=https://cloudflare-dev-school-pr-123.ziki.workers.dev node scripts/fake-agent-external-course.mjs

const baseUrl = process.env.BASE_URL || "http://localhost:8788";

async function main() {
  log(`Base URL: ${baseUrl}`);

  const student = await request("POST", "/api/students");
  log(`Enrolled as ${student.id}`);

  const llmsTxt = await fetchText("/llms.txt");
  assert(llmsTxt.includes("/external-courses.md"), "llms.txt doesn't point at /external-courses.md");
  const procedure = await fetchText("/external-courses.md");
  assert(procedure.includes("PUT /api/students/{id}/courses"), "external-courses.md doesn't document PUT courses");
  assert(procedure.includes("git clone --depth 1"), "external-courses.md doesn't explain how to read a repo course");
  log("Fetched /llms.txt and /external-courses.md and confirmed they document courses hosted elsewhere");

  // Step 1: report the manifest of a repo course with no interview of its own,
  // using a URL with a trailing ".git" the way a student might paste it.
  const repo = "https://github.com/acme/durable-objects-course";
  const exercises = [
    { slug: "first-object", title: "Your first object", url: `${repo}/blob/main/exercises/01-first-object.md` },
    { slug: "websockets", title: "WebSockets", url: `${repo}/blob/main/exercises/02-websockets.md` },
  ];
  const reported = await request("PUT", `/api/students/${student.id}/courses`, {
    url: `${repo}.git`,
    title: "Durable Objects",
    author: "Acme",
    exercises,
  });
  assert(reported.url === repo, `expected the course URL normalized to ${repo}, got ${reported.url}`);
  assert(
    JSON.stringify(reported.exercises.map((e) => e.slug)) === '["interview","first-object","websockets"]',
    `expected the default interview first, got ${reported.exercises.map((e) => e.slug)}`,
  );
  const defaultInterview = await fetchText(new URL(reported.exercises[0].url).pathname);
  assert(defaultInterview.includes("doesn't include its own interview"), "the default interview URL doesn't serve it");
  log("Reported the course; its URL was normalized and the default interview added first");

  // Step 2: other forms of the same URL are the same course.
  await request("PUT", `/api/students/${student.id}/courses`, {
    url: `${repo}/?ref=main#readme`,
    title: "Durable Objects",
    author: "Acme",
    exercises,
  });
  let progress = await request("GET", `/api/progress/${student.id}`);
  assert(progress.externalCourses.length === 1, `expected one reported course, got ${progress.externalCourses.length}`);
  log("Re-reporting it with a trailing slash, query, and fragment kept one course");

  // Step 3: exercises missing from the manifest, and courses that weren't reported, are rejected.
  const mark = { course: repo, harness: "generic", model: "fake-agent/test" };
  const missing = await requestRaw("PUT", `/api/progress/${student.id}`, { ...mark, exercise: "alarms" });
  assert(missing.status === 400, `expected 400 for an exercise missing from the manifest, got ${missing.status}`);
  const unreported = await requestRaw("PUT", `/api/progress/${student.id}`, {
    ...mark,
    course: "https://github.com/acme/other-course",
    exercise: "interview",
  });
  assert(unreported.status === 400, `expected 400 for a course that wasn't reported, got ${unreported.status}`);
  log("An exercise missing from the manifest and an unreported course were rejected with 400");

  // Step 4: the interview, saved under the course's URL.
  await request("PUT", `/api/students/${student.id}/interviews`, {
    course: `${repo}.git`,
    responses: [{ question: "Have you used Durable Objects before?", answer: "no" }],
    summary: "You haven't used Durable Objects before.",
  });
  const interviews = await request("GET", `/api/students/${student.id}/interviews`);
  assert(interviews.interviews.some((i) => i.course === repo), "the interview wasn't stored under the course's URL");
  log("Saved the course's interview");

  // Step 5: complete every exercise; the course completes with the last one.
  for (const exercise of reported.exercises) {
    progress = await request("PUT", `/api/progress/${student.id}`, { ...mark, exercise: exercise.slug });
  }
  const course = progress.externalCourses[0];
  assert(course.completedAt, "the course wasn't marked complete");
  assert(course.interviewSummary === "You haven't used Durable Objects before.", "progress doesn't carry the interview summary");
  const completion = course.exercises.find((e) => e.slug === "websockets").completions[0];
  assert(completion.exerciseUrl === exercises[1].url, `expected the manifest's exercise URL, got ${completion.exerciseUrl}`);
  log("Completed every exercise; the course is complete");

  log("✅ Fake-agent external course run passed");
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
  console.log(`[fake-agent-external] ${message}`);
}

main().catch((error) => {
  console.error(`[fake-agent-external] ❌ ${error.message}`);
  process.exit(1);
});
