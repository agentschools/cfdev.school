#!/usr/bin/env node
// Scripted "fake agent" that plays out what a real coding agent does after a
// student pastes the handoff prompt from #12: fetch llms.txt for
// instructions, then follow them against the real API. This is not a
// simulation of an LLM conversation, it exercises the exact HTTP contract
// llms.txt documents, end to end, against a real running Worker (local
// wrangler dev by default, or any deployed environment via BASE_URL).
//
// Usage:
//   node scripts/fake-agent-interview.mjs
//   BASE_URL=https://cloudflare-dev-school-pr-123.ziki.workers.dev node scripts/fake-agent-interview.mjs

const baseUrl = process.env.BASE_URL || "http://localhost:8788";

async function main() {
  log(`Base URL: ${baseUrl}`);

  // Step 1: a student enrolls and picks a harness (#11, #12). Simulate that
  // by enrolling directly, a real agent would already have the ID from the
  // handoff prompt.
  const student = await request("POST", "/api/students");
  assert(/^[a-z]+-[a-z]+-\d{4}$/.test(student.id), `student id looks wrong: ${student.id}`);
  log(`Enrolled as ${student.id}`);

  // Step 2: fetch llms.txt, the same thing a real agent does before doing
  // anything else, and check it documents the endpoints this script uses.
  const llmsTxt = await fetchText("/llms.txt");
  assert(llmsTxt.includes("PUT /api/students/{id}/interview"), "llms.txt doesn't document PUT interview endpoint");
  assert(llmsTxt.includes("GET /api/students/{id}/interview"), "llms.txt doesn't document GET interview endpoint");
  assert(llmsTxt.includes('"interview"'), "llms.txt doesn't list the interview lesson");
  log("Fetched /llms.txt and confirmed it documents the interview endpoints and lesson");

  // Step 2b: the interview is a lesson; fetch its agentInstructions.
  const lesson = await request("GET", "/api/lessons/interview?harness=generic");
  assert(lesson.slug === "interview", `expected the interview lesson, got ${lesson.slug}`);
  assert(lesson.agentInstructions.includes("/api/students/{id}/interview"), "interview lesson doesn't point at the interview API");
  log("Fetched the interview lesson's agentInstructions");

  // Step 3: a fresh student has no interview yet.
  const notFound = await requestRaw("GET", `/api/students/${student.id}/interview`);
  assert(notFound.status === 404, `expected 404 before any interview answers, got ${notFound.status}`);
  log("Confirmed GET 404s before any answers exist");

  // Step 4: conduct the interview, one PUT per answer, as llms.txt allows.
  await request("PUT", `/api/students/${student.id}/interview`, { technicalBackground: "intermediate" });
  await request("PUT", `/api/students/${student.id}/interview`, { cloudflareFamiliarity: "some-experience" });
  await request("PUT", `/api/students/${student.id}/interview`, {
    learningGoals: "Deploy my side project on Workers.",
  });
  const afterOs = await request("PUT", `/api/students/${student.id}/interview`, { os: "macos" });
  assert(afterOs.quizOptIn === true, `quizOptIn should default to true, got ${afterOs.quizOptIn}`);
  log("Submitted background, familiarity, learning goals, and OS; quizOptIn defaulted to true");

  // Step 5: fetch it back and confirm nothing was clobbered along the way.
  const interview = await request("GET", `/api/students/${student.id}/interview`);
  assert(interview.technicalBackground === "intermediate", "technicalBackground was lost");
  assert(interview.cloudflareFamiliarity === "some-experience", "cloudflareFamiliarity was lost");
  assert(interview.learningGoals === "Deploy my side project on Workers.", "learningGoals was lost");
  assert(interview.os === "macos", "os was lost");
  log("GET returned all four answers intact");

  // Step 6: quizOptIn is a standalone preference, changeable later without
  // re-answering the rest of the interview.
  const optedOut = await request("PUT", `/api/students/${student.id}/interview`, { quizOptIn: false });
  assert(optedOut.quizOptIn === false, "quizOptIn didn't update");
  assert(optedOut.technicalBackground === "intermediate", "changing quizOptIn clobbered technicalBackground");
  log("Changed quizOptIn alone without disturbing the rest of the interview");

  // Step 7: mark the interview lesson complete, as its agentInstructions say.
  const progress = await request("PUT", `/api/progress/${student.id}`, { lessonSlug: "interview", model: "fake-agent" });
  assert(
    progress.completedLessons.some((item) => item.slug === "interview"),
    "interview lesson wasn't marked complete",
  );
  log("Marked the interview lesson complete");

  log("✅ Fake-agent interview run passed");
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
  // requests without a matching Origin header (see AGENTS.md). A real
  // browser fetch() sends this automatically; this script isn't a browser.
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
