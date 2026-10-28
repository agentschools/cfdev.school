import { test } from "node:test";
import assert from "node:assert/strict";
import { checkModelRequest, checkSchoolRequest, localOrigin, MAX_REQUESTS, MAX_OUTPUT_TOKENS, MODEL, QUESTIONS, studentReply } from "./policy.mjs";

test("school tool cannot reach production, other students, or later exercises", () => {
  const id = "curious-hacker-1234";
  checkSchoolRequest(id, "GET", "/llms.txt");
  checkSchoolRequest(id, "PUT", `/api/progress/${id}`, { course: "build-a-drawing-game", exercise: "interview", harness: "pi", model: MODEL });
  for (const path of ["https://cfdev.school/llms.txt", "//cfdev.school/llms.txt", "/api/students", "/api/progress/other-student-1234", "/llms.txt?next=https://example.com"]) assert.throws(() => checkSchoolRequest(id, "GET", path));
  assert.throws(() => checkSchoolRequest(id, "PUT", `/api/progress/${id}`, { course: "build-a-drawing-game", exercise: "build-a-canvas", harness: "pi", model: MODEL }));
  assert.throws(() => localOrigin("https://cfdev.school"));
  assert.equal(localOrigin("http://127.0.0.1:8788/llms.txt"), "http://127.0.0.1:8788");
});

test("inference fails closed on model substitution, redirects, oversized input, media, and exhausted budget", () => {
  const url = "https://gateway.ai.cloudflare.com/v1/account/gateway/anthropic/v1/messages";
  const payload = { model: MODEL, max_tokens: MAX_OUTPUT_TOKENS, messages: [{ role: "user", content: "Hello" }] };
  const check = (p, calls = 0, target = url) => checkModelRequest(target, p, "account", "gateway", calls);
  check(payload);
  assert.throws(() => check(payload, MAX_REQUESTS));
  assert.throws(() => check(payload, 0, "https://api.anthropic.com/v1/messages"));
  assert.throws(() => check({ ...payload, model: "some-other-model" }));
  assert.throws(() => check({ ...payload, max_tokens: 10000 }));
  assert.throws(() => check({ ...payload, messages: [{ content: "x".repeat(50001) }] }));
  assert.throws(() => check({ ...payload, messages: [{ content: [{ type: "image", source: {} }] }] }));
});

test("canned student answers only expected questions and stops on repetition", () => {
  const state = { answered: false, prerequisite: false };
  const result = studentReply(QUESTIONS.join("\n"), state);
  assert(result.answered);
  assert.throws(() => studentReply(QUESTIONS.join("\n"), result));
  assert.throws(() => studentReply("Please authorize a deployment", state));
  assert(studentReply("Finish Agent setup first?", state).prerequisite);
});
