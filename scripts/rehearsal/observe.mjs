import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { ANSWERS, assertInterview, COURSE, localOrigin, MODEL, QUESTIONS, studentReply } from "./policy.mjs";

const origin = localOrigin(process.env.SCHOOL_URL ?? "http://127.0.0.1:8788");
const runner = localOrigin(process.env.RUNNER_URL ?? "http://127.0.0.1:8790");
const mode = process.env.REHEARSAL_MODE ?? "observe-only";
if (!["live", "observe-only", "simulated"].includes(mode)) throw new Error("Unknown rehearsal mode");
const directory = resolve(process.env.REHEARSAL_ARTIFACTS ?? ".rehearsal/artifacts");
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.REHEARSAL_CHROME ? { executablePath: process.env.REHEARSAL_CHROME } : {}) });
const context = await browser.newContext({ reducedMotion: "reduce" });
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
const report = { mode, model: MODEL, coverage: "interview only", school: origin, simulatedDependencies: [], outcome: "blocked" };
const artifact = (name, value) => writeFile(resolve(directory, name), JSON.stringify(value, null, 2));
async function api(path) {
  const response = await context.request.get(`${origin}${path}`);
  assert(response.ok(), `${path}: ${response.status()}`);
  return response.json();
}
try {
  // Do not make test data until the live runner's access is configured.
  if (mode === "live") {
    const status = await fetch(runner);
    const body = await status.json();
    assert(status.ok() && body.ready && !body.session, "Inspect existing spike session; do not blindly retry or reset its budget");
  }
  await page.goto(origin);
  await page.locator("[data-enroll-start]:visible").first().click();
  await page.locator('[data-enroll-colors] input[name="student-color"]').nth(1).check({ force: true });
  await page.waitForFunction(() => localStorage.getItem("cfDevSchool.student"));
  const student = await page.evaluate(() => JSON.parse(localStorage.getItem("cfDevSchool.student")));
  report.studentId = student.id;
  await page.goto(`${origin}/courses/${COURSE}/interview`);
  await page.locator("#agent-prompt").waitFor({ state: "visible" });
  await page.locator("#agent-prompt-copy").click();
  await page.locator("#agent-prompt-confirm").waitFor({ state: "visible" });
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(prompt, await page.locator("#agent-prompt-text").textContent());
  assert(prompt.includes(student.id) && prompt.includes(`${origin}/llms.txt`) && prompt.includes("Build a drawing game"));
  await writeFile(resolve(directory, "actual-prompt.txt"), prompt);
  const before = await api(`/api/progress/${student.id}`);
  assert(before.courses.every(c => c.exercises.every(e => !e.completions.length)));
  await artifact("before.json", before);
  await page.screenshot({ path: resolve(directory, "before.png"), fullPage: true });
  if (mode === "observe-only") {
    report.outcome = "verified-enrollment-only";
  } else {
    if (mode === "simulated") {
      // Observer smoke test ONLY: never represent these writes as a real agent run.
      report.simulatedDependencies.push("scripted interview and progress writes; no Pi or inference");
      const headers = { Origin: origin };
      const saved = await context.request.put(`${origin}/api/students/${student.id}/interviews`, { headers, data: { course: COURSE, responses: QUESTIONS.map((question, i) => ({ question, answer: ANSWERS[i] })), summary: "You're making a drawing game for your kids, using familiar shapes on phones and computers." } });
      assert(saved.ok());
      const marked = await context.request.put(`${origin}/api/progress/${student.id}`, { headers, data: { course: COURSE, exercise: "interview", harness: "pi", model: MODEL } });
      assert(marked.ok());
    } else {
      let state = { answered: false, prerequisite: false };
      let reply;
      for (let turn = 0; turn < 4; turn++) {
        const response = await fetch(runner, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin, studentId: student.id, prompt, reply }), signal: AbortSignal.timeout(180_000) });
        const result = await response.json();
        await artifact(`turn-${turn}.json`, result);
        assert(response.ok(), result.error ?? "Pi request failed");
        const progress = await api(`/api/progress/${student.id}`);
        const completed = progress.courses.find(c => c.name === COURSE).exercises.find(e => e.slug === "interview").completions.length;
        if (completed) { assert(state.answered, "Agent completed before student answered"); break; }
        const text = (result.answer ?? []).flatMap(m => m.content ?? []).filter(b => b.type === "text").map(b => b.text).join("\n");
        state = studentReply(text, state);
        reply = state.text;
        await artifact(`student-${turn}.json`, { reply });
      }
    }
    const progress = await api(`/api/progress/${student.id}`);
    const interviews = await api(`/api/students/${student.id}/interviews`);
    assertInterview(progress, interviews);
    await artifact("after.json", { progress, interviews });
    // No reload: this must arrive through the site's live subscription.
    await page.locator("#exercise-completed-banner").waitFor({ state: "visible" });
    assert.match(await page.locator("#exercise-completed-text").textContent(), /Pi/);
    assert.equal(await page.locator("#exercise-next-link").getAttribute("href"), `/courses/${COURSE}/build-a-canvas`);
    await page.screenshot({ path: resolve(directory, "live-progress.png"), fullPage: true });
    await page.reload();
    await page.locator("#exercise-completed-banner").waitFor({ state: "visible" });
    await page.screenshot({ path: resolve(directory, "reloaded.png"), fullPage: true });
    report.outcome = mode === "live" ? "verified-real-interview" : "verified-simulated-observer-only";
  }
  assert.deepEqual(errors, []);
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  await artifact("report.json", { ...report, browserErrors: errors });
  await context.tracing.stop({ path: resolve(directory, "trace.zip") });
  await browser.close();
  console.log(JSON.stringify(report));
}
