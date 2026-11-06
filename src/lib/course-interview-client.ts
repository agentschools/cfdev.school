import { courseInterview, interviewBody, interviewPrompt, matchingOption, savedSingleAnswer, SAVED_ANSWER, type InterviewDefinition } from "./course-interview";
import { ENROLLED_EVENT, enrollStudent, readCachedStudent, type CachedStudent } from "./enroll-client";
import { initPromptCopy } from "./agent-prompt-copy";
import { buildPrompt } from "./agent-prompt";
import { interviewsSchema, type Interview } from "../schemas/interview";

/** Separate save and completion stages make partial success retryable without resaving stale answers. */
export async function completeWebInterview(student: CachedStudent, interview: Interview, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`/api/progress/${student.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({ course: interview.course, exercise: "interview", harness: "website", source: "website", interviewVersion: interview.updatedAt }),
  });
  if (!response.ok) throw new Error(response.status === 409 ? "Your saved answers changed in another session. Reload them before continuing." : "Your answers are saved, but recording completion failed. Retry to finish without resaving your answers.");
}

export function initCourseInterview(): void {
  const root = document.querySelector<HTMLElement>("[data-course-interview]");
  if (!root) return;
  const definition = courseInterview(JSON.parse(root.dataset.definition ?? "{}").course);
  if (!definition) return;
  initForm(root, definition);
}

function initForm(root: HTMLElement, definition: InterviewDefinition): void {
  const form = root.querySelector<HTMLFormElement>("form")!;
  const fields = root.querySelector<HTMLFieldSetElement>("[data-interview-fields]")!;
  const status = root.querySelector<HTMLElement>("[data-interview-status]")!;
  const reload = root.querySelector<HTMLButtonElement>("[data-interview-reload]")!;
  const fallback = root.querySelector<HTMLButtonElement>("[data-interview-agent]")!;
  const submit = root.querySelector<HTMLButtonElement>("[type=submit]")!;
  const result = root.querySelector<HTMLElement>("[data-interview-result]")!;
  const message = root.querySelector<HTMLElement>("[data-interview-result-message]")!;
  const promptSection = root.querySelector<HTMLElement>("#agent-prompt")!;
  const prompt = root.querySelector<HTMLElement>("#agent-prompt-text")!;
  const confirm = root.querySelector<HTMLElement>("#agent-prompt-confirm")!;
  const copy = root.querySelector<HTMLButtonElement>("#agent-prompt-copy")!;
  let student = readCachedStudent();
  let cachedId = student?.id;
  let saved: Interview | undefined;
  let busy = false;
  let ready = false;
  let generation = 0;
  let controller = new AbortController();
  const draftKey = () => `cfDevSchool.interview.${definition.course}.${student?.id ?? "visitor"}`;
  const version = () => saved?.updatedAt ?? "none";
  function formData(): FormData {
    const disabled = fields.disabled;
    fields.disabled = false;
    const data = new FormData(form);
    fields.disabled = disabled;
    return data;
  }
  const values = () => [...formData().entries()];
  const signal = () => AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
  function hidePrompt(): void { result.hidden = true; prompt.textContent = ""; confirm.hidden = true; }
  function saveDraft(): void {
    try { sessionStorage.setItem(draftKey(), JSON.stringify({ version: version(), values: values() })); } catch { /* Optional storage. */ }
  }
  function populate(entries: [string, string][]): void {
    form.reset();
    for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")) {
      const answers = entries.filter(([name]) => name === input.name).map(([, value]) => value);
      if (input instanceof HTMLInputElement && ["radio", "checkbox"].includes(input.type)) input.checked = answers.includes(input.value) || (!answers.length && input.type === "radio" && input.value === definition.questions.find(question => question.id === input.name)?.default);
      else input.value = answers[0] ?? "";
    }
  }
  function savedEntries(): [string, string][] {
    return definition.questions.flatMap(question => {
      const previous = savedSingleAnswer(question, saved?.responses ?? []);
      const choice = form.querySelector<HTMLElement>(`[data-saved-choice="${question.id}"]`);
      if (choice) {
        choice.hidden = !previous;
        choice.querySelector("span")!.textContent = previous ? `Your saved answer: ${Array.isArray(previous.answer) ? previous.answer.join("; ") : previous.answer}` : "";
      }
      if (previous) return [[question.id, SAVED_ANSWER]] as [string, string][];
      const answer = saved?.responses.find(response => response.question === question.question)?.answer;
      const answers = (Array.isArray(answer) ? answer : answer ? [answer] : []).map(value => matchingOption(question, value) ?? value);
      const custom = question.other ? answers.filter(value => !question.options?.includes(value)) : [];
      const entries: [string, string][] = answers.filter(value => !custom.includes(value)).map(value => [question.id, value]);
      if (custom.length) entries.push([`${question.id}-other`, custom.map(value => value.replace(/^Other: /, "")).join("; ")]);
      return entries;
    });
  }
  function restoreDraft(): string {
    try {
      const raw = sessionStorage.getItem(draftKey());
      if (!raw) return "";
      const draft = JSON.parse(raw);
      if (draft.version !== version()) return "Saved answers changed since your unfinished draft. The latest saved answers are shown; review before submitting.";
      populate(draft.values);
      return "";
    } catch { return ""; }
  }
  async function load(restore = true): Promise<void> {
    controller.abort(); controller = new AbortController();
    const current = ++generation;
    ready = false; fields.disabled = true; reload.hidden = true; hidePrompt();
    status.textContent = "Loading your saved answers…";
    try {
      let interview: Interview | undefined;
      if (student) {
        const response = await fetch(`/api/students/${student.id}/interviews`, { cache: "no-store", signal: signal() });
        if (!response.ok) throw new Error(response.status === 404 ? "Your student ID was not found. Enroll again from the homepage, then return here." : "Could not load saved answers. Please retry.");
        interview = interviewsSchema.parse(await response.json()).interviews.find(item => item.course === definition.course);
      }
      if (current !== generation) return;
      saved = interview; populate(savedEntries());
      status.textContent = (restore && restoreDraft()) || (saved ? "Review your saved answers, then start the course. If completion was interrupted, submit to finish it." : "");
      ready = true; submit.textContent = "Start the course";
    } catch (error) {
      if (current !== generation) return;
      status.textContent = error instanceof Error ? error.message : "Could not load saved answers.";
      reload.hidden = false;
    } finally { if (current === generation) fields.disabled = !ready; }
  }
  form.addEventListener("input", () => {
    hidePrompt(); submit.textContent = "Start the course"; saveDraft();
  });
  reload.addEventListener("click", () => {
    if (!busy) { try { sessionStorage.removeItem(draftKey()); } catch { /* Optional storage. */ } void load(false); }
  });
  initPromptCopy(copy, prompt, confirm);
  function identityChanged(next: CachedStudent | null): void {
    if (next?.id === student?.id) return;
    if (ready) saveDraft();
    student = next; cachedId = next?.id;
    void load();
  }
  document.addEventListener(ENROLLED_EVENT, ((event: CustomEvent<CachedStudent>) => identityChanged(event.detail)) as EventListener);
  window.addEventListener("storage", event => { if (event.key === "cfDevSchool.student") identityChanged(readCachedStudent()); });
  window.addEventListener("pageshow", event => { if (event.persisted) { student = readCachedStudent(); cachedId = student?.id; void load(); } });
  async function ensureStudent(): Promise<CachedStudent> {
    if (student) return student;
    const enrolled = await enrollStudent();
    if (readCachedStudent()?.id && readCachedStudent()?.id !== enrolled.id) throw new Error("Your student ID changed. Reload before continuing.");
    student = enrolled; cachedId = readCachedStudent()?.id;
    saveDraft();
    document.dispatchEvent(new CustomEvent(ENROLLED_EVENT, { detail: { ...student, fresh: true } }));
    return enrolled;
  }
  function showPrompt(text: string, description: string): void {
    prompt.textContent = text; message.textContent = description;
    promptSection.hidden = false; result.hidden = false; result.focus();
  }
  fallback.addEventListener("click", async () => {
    if (busy) return;
    busy = true; fallback.disabled = true; fields.disabled = true;
    const current = generation;
    try {
      const enrolled = await ensureStudent();
      if (current !== generation) return;
      showPrompt(buildPrompt(enrolled, { courseTitle: definition.title }), "Copy this into your agent to take the interview in conversation. This does not submit the form or mark the interview complete.");
      status.textContent = "Your agent interview prompt is ready.";
    } catch { if (current === generation) status.textContent = "Could not prepare your agent prompt. Please retry."; }
    finally { busy = false; fallback.disabled = false; if (current === generation) fields.disabled = !ready; }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !ready) return;
    if (readCachedStudent()?.id !== cachedId) { identityChanged(readCachedStudent()); return; }
    let body;
    try { body = interviewBody(definition, formData(), saved?.responses); }
    catch (error) { status.textContent = (error as Error).message; return; }
    saveDraft(); hidePrompt(); busy = true; fields.disabled = true; fallback.disabled = true;
    const current = generation;
    let stage: "save" | "complete" = "save";
    status.textContent = "Saving your answers…";
    try {
      const enrolled = await ensureStudent();
      if (current !== generation) return;
      if (!saved || JSON.stringify(saved.responses) !== JSON.stringify(body.responses)) {
        const response = await fetch(`/api/students/${enrolled.id}/interviews`, {
          method: "PUT", headers: { "Content-Type": "application/json", "X-Interview-Version": version() },
          body: JSON.stringify(body), signal: signal(),
        });
        if (current !== generation) return;
        if (response.status === 409) throw new Error("Your interview changed in another session. Reload saved answers before submitting.");
        if (!response.ok) throw new Error("Could not save your answers. Reload saved answers to check the result before retrying. Your draft is kept in this tab.");
        saved = interviewsSchema.parse(await response.json()).interviews.find(item => item.course === definition.course);
        if (!saved || JSON.stringify(saved.responses) !== JSON.stringify(body.responses)) throw new Error("The saved interview changed. Reload saved answers before continuing.");
        populate(savedEntries());
        // Keep the draft tied to the confirmed version for partial-save/reload recovery.
        saveDraft();
      }
      if (current !== generation) return;
      stage = "complete";
      status.textContent = "Answers saved. Recording interview completion…";
      await completeWebInterview(enrolled, saved!, signal());
      if (current !== generation) return;
      try { sessionStorage.removeItem(draftKey()); sessionStorage.removeItem(`cfDevSchool.interview.${definition.course}.visitor`); } catch { /* Optional storage. */ }
      showPrompt(interviewPrompt(definition, enrolled, saved!), "Your answers are saved and the interview is complete. Copy this personalized prompt into your agent to begin. Your agent will check your setup and guide you through the remaining exercises.");
      status.textContent = `Interview complete for ${enrolled.id}. Your personalized prompt is ready.`;
    } catch (error) {
      if (current !== generation) return;
      status.textContent = stage === "complete" && !(error as Error).message.includes("changed") ? "Your answers are saved, but completion could not be confirmed. Retry to finish without resaving your answers." : (error as Error).message;
      if (stage === "save" || (error as Error).message.includes("changed")) { ready = false; reload.hidden = false; }
      else submit.textContent = "Retry completion";
    } finally {
      busy = false; fallback.disabled = false;
      if (current === generation) fields.disabled = !ready;
    }
  });
  void load();
}
