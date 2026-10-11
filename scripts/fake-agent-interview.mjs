#!/usr/bin/env node
// Scripted "fake agent" that plays out what a real coding agent does after a
// student pastes the handoff prompt from #12: fetch llms.txt for
// instructions, then follow them against the real API. This is not a
// simulation of an LLM conversation, it exercises the exact HTTP contract
// llms.txt documents, end to end, against a real running Worker (local
// `npm run dev:worker` by default, or any deployed environment via BASE_URL).
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
  assert(llmsTxt.includes("PUT /api/students/{id}/interviews"), "llms.txt doesn't document PUT interviews endpoint");
  assert(llmsTxt.includes("GET /api/students/{id}/interviews"), "llms.txt doesn't document GET interviews endpoint");
  assert(llmsTxt.includes("GET /api/courses"), "llms.txt doesn't document GET /api/courses");
  log("Fetched /llms.txt and confirmed it documents the interview and course endpoints");

  // Step 2b: every course starts with an interview. Agent setup writes its
  // own; Workers gets the default one, which has the agent write its
  // own questions. Both should point at the interviews API.
  const courses = await request("GET", "/api/courses");
  for (const name of ["agent-setup", "workers"]) {
    const exercise = courses.find((c) => c.name === name)?.exercises[0];
    assert(exercise?.slug === "interview", `expected ${name}'s interview first, got ${exercise?.slug}`);
    const markdown = await fetchText(new URL(exercise.markdownUrl).pathname);
    assert(markdown.includes("/api/students/{id}/interviews"), `${name}'s interview doesn't point at the interviews API`);
  }
  log("Fetched both courses' interview Markdown");

  // Step 3: a fresh student has no interviews yet, and the old endpoint is gone.
  const empty = await request("GET", `/api/students/${student.id}/interviews`);
  assert(empty.interviews.length === 0, `expected no interviews yet, got ${empty.interviews.length}`);
  const old = await requestRaw("GET", `/api/students/${student.id}/interview`);
  assert(old.status === 404, `expected the old /interview endpoint to 404, got ${old.status}`);
  log("Confirmed a new student has no interviews, and GET /interview is gone");

  // Step 4: Agent setup's interview: its four questions plus the detected OS.
  const agentSetup = {
    course: "agent-setup",
    responses: [
      { question: "How much have you used AI coding agents like this one?", answer: "now and then" },
      { question: "Where have you deployed apps before? (pick any)", answer: ["Vercel or Netlify", "AWS, Google Cloud, or Azure"] },
      { question: "What do you want to build or learn?", answer: "Deploy my side project on Workers." },
      { question: "Want a short quiz at the end of each exercise? (recommended, skippable anytime)", answer: "yes" },
      { question: "Which operating system are you on?", answer: "macOS" },
    ],
    summary: "You use AI agents now and then, have deployed on Vercel and AWS, are on macOS, and opted into quizzes.",
  };
  await request("PUT", `/api/students/${student.id}/interviews`, agentSetup);
  log("Saved Agent setup's interview");

  // Step 5: Workers' interview, with questions the agent wrote itself.
  const workersCourse = {
    course: "workers",
    responses: [
      { question: "Have you written a serverless function before?", answer: "a few on Vercel" },
      { question: "What do you want your first Worker to do?", answer: "serve a JSON API" },
    ],
    summary: "You've written a few serverless functions on Vercel and want your first Worker to serve a JSON API.",
  };
  await request("PUT", `/api/students/${student.id}/interviews`, workersCourse);
  const both = await request("GET", `/api/students/${student.id}/interviews`);
  assert(
    JSON.stringify(both.interviews.map((i) => i.course)) === '["agent-setup","workers"]',
    `expected both interviews in catalog order, got ${both.interviews.map((i) => i.course)}`,
  );
  assert(JSON.stringify(both.interviews[0].responses) === JSON.stringify(agentSetup.responses), "Agent setup's responses changed");
  log("Saved Workers' interview; GET returned both in catalog order");

  // Step 6: mark Agent setup's interview complete, as its agent-instructions say.
  const progress = await request("PUT", `/api/progress/${student.id}`, {
    course: "agent-setup",
    exercise: "interview",
    harness: "generic",
    model: "fake-agent",
  });
  const setupProgress = progress.courses.find((c) => c.name === "agent-setup");
  assert(setupProgress?.exercises.find((e) => e.slug === "interview")?.completions.length === 1, "interview wasn't marked complete");
  assert(setupProgress.interviewSummary === agentSetup.summary, "progress doesn't carry the interview summary");
  log("Marked the interview exercise complete; progress carries its summary");

  // Step 7: the student turns off quizzes. The agent re-sends the whole
  // interview with that answer changed, and open tabs (the homepage's
  // "Interview complete" box) get the new summary over the progress socket.
  const live = await openProgressSocket(student.id);
  const changed = {
    ...agentSetup,
    responses: agentSetup.responses.map((r) => (r.question.startsWith("Want a short quiz") ? { ...r, answer: "no" } : r)),
    summary: "You use AI agents now and then, have deployed on Vercel and AWS, are on macOS, and opted out of quizzes.",
  };
  await request("PUT", `/api/students/${student.id}/interviews`, changed);
  const pushed = await live.next((p) => p.courses.find((c) => c.name === "agent-setup")?.interviewSummary === changed.summary);
  live.close();
  assert(pushed, "the new summary wasn't pushed over the progress socket");
  const after = await request("GET", `/api/students/${student.id}/interviews`);
  assert(after.interviews[0].responses[3].answer === "no", "the quiz answer didn't change");
  assert(after.interviews[1].summary === workersCourse.summary, "re-saving Agent setup's interview touched Workers'");
  log("Re-sent Agent setup's interview with quizzes off; the new summary was pushed live");

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

/**
 * Opens the browser-only progress WebSocket (/api/progress/{id}/live) and
 * resolves next(predicate) with the first pushed Progress matching it, or
 * null after a few seconds.
 */
async function openProgressSocket(studentId) {
  const socket = new WebSocket(`${baseUrl.replace(/^http/, "ws")}/api/progress/${studentId}/live`);
  const messages = [];
  socket.addEventListener("message", (event) => messages.push(JSON.parse(event.data)));
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("progress socket failed to open")), { once: true });
  });

  return {
    async next(predicate) {
      for (let waited = 0; waited < 5000; waited += 100) {
        const match = messages.find(predicate);
        if (match) return match;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return null;
    },
    close: () => socket.close(),
  };
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
