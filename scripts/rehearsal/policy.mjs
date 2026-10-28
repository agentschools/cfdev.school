export const COURSE = "build-a-drawing-game";
export const MODEL = "claude-sonnet-5-5";
export const MAX_REQUESTS = 12;
export const RESERVATION_USD = 0.25;
export const MAX_PAYLOAD_BYTES = 50_000;
export const MAX_OUTPUT_TOKENS = 2048;

export function localOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname) || url.username || url.password) {
    throw new Error("This prototype accepts loopback HTTP origins only");
  }
  return url.origin;
}

export function checkSchoolRequest(studentId, method, path, body) {
  if (!/^[a-z]+-[a-z]+-\d{4}$/.test(studentId)) throw new Error("Invalid student ID");
  const reads = ["/llms.txt", "/api/courses", "/api/openapi.json", "/api/harnesses/pi",
    `/api/progress/${studentId}`, `/api/students/${studentId}/interviews`,
    `/courses/${COURSE}/COURSE.md`, `/courses/${COURSE}/exercises/00-interview.md`];
  if (method === "GET" && reads.includes(path) && body === undefined) return;
  if (method === "PUT" && body?.course === COURSE) {
    if (path === `/api/students/${studentId}/interviews`) return;
    if (path === `/api/progress/${studentId}` && body.exercise === "interview" && body.harness === "pi" && body.model === MODEL) return;
  }
  throw new Error("Outside this student's interview milestone");
}

export function checkModelRequest(url, payload, account, gateway, calls) {
  if (url !== `https://gateway.ai.cloudflare.com/v1/${account}/${gateway}/anthropic/v1/messages`) throw new Error("Unexpected inference destination");
  if (calls >= MAX_REQUESTS) throw new Error("Spike request budget exhausted; no automatic reset");
  if (new TextEncoder().encode(JSON.stringify(payload)).length > MAX_PAYLOAD_BYTES) throw new Error("Model input too large");
  if (payload.model !== MODEL || payload.max_tokens !== MAX_OUTPUT_TOKENS) throw new Error("Unexpected model or output bound");
  // Images, external resources and alternate service tiers are outside the cost envelope.
  if (payload.service_tier && payload.service_tier !== "standard") throw new Error("Unexpected service tier");
  for (const message of payload.messages ?? []) {
    for (const block of Array.isArray(message.content) ? message.content : []) {
      if (!["text", "tool_use", "tool_result", "thinking", "redacted_thinking"].includes(block.type)) throw new Error("Non-text model input");
      if (block.type === "tool_result" && typeof block.content !== "string" && block.content?.some(x => x.type !== "text")) throw new Error("Non-text tool result");
    }
  }
}

export const QUESTIONS = ["Who is your game for?", "What should players draw?", "How much have you built for the browser before?", "Where will people mostly play it?"];
export const ANSWERS = ["My kids", "Simple shapes and familiar objects", "some HTML, CSS, or JavaScript", "both"];
export function studentReply(text, state) {
  if (QUESTIONS.every(q => text.toLowerCase().includes(q.toLowerCase()))) {
    if (state.answered) throw new Error("Agent repeated the interview");
    return { answered: true, prerequisite: state.prerequisite, text: ANSWERS.map((a, i) => `${i + 1}. ${a}`).join("\n") };
  }
  if (!state.prerequisite && /agent setup/i.test(text)) {
    return { ...state, prerequisite: true, text: "I want to start Build a drawing game now, even though Agent setup is unfinished. Please proceed with its interview." };
  }
  throw new Error("Unexpected student question; inspect the transcript instead of inventing an answer");
}

export function assertInterview(progress, interviews) {
  const course = progress.courses.find(c => c.name === COURSE);
  const interview = interviews.interviews.find(i => i.course === COURSE);
  if (!interview || !QUESTIONS.every((q, i) => interview.responses.some(r => r.question === q && r.answer === ANSWERS[i]))) throw new Error("Interview differs from the actual questions/answers");
  if (!interview.summary || interview.summary.length > 280 || course.interviewSummary !== interview.summary) throw new Error("Interview summary inconsistent");
  const completions = course.exercises.find(e => e.slug === "interview").completions;
  if (completions.length !== 1 || completions[0].harness !== "pi" || completions[0].model !== MODEL) throw new Error("Incorrect interview attribution");
  if (course.completedAt || progress.courses.some(c => c.exercises.some(e => (c.name !== COURSE || e.slug !== "interview") && e.completions.length))) throw new Error("Unverified exercise marked complete");
}
