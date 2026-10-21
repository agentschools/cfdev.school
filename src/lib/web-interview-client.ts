import { readCachedStudent } from "./enroll-client";
import { type Interview, type InterviewResponse, interviewsSchema } from "../schemas/interview";

/** Preserve detected context and other questions when editing one answer. [] is an explicit skip. */
export function replaceInterviewAnswer(responses: InterviewResponse[], question: string, answer: string | string[]): InterviewResponse[] {
  return [...responses.filter((item) => item.question !== question), { question, answer }];
}

export function webInterviewSummary(title: string, responses: InterviewResponse[], questions: string[]): string {
  const known = responses.filter((item) => questions.includes(item.question) && !item.pending);
  const skipped = known.filter((item) => Array.isArray(item.answer) && item.answer.length === 0).length;
  return `You've shared ${known.length - skipped} ${known.length - skipped === 1 ? "answer" : "answers"} for ${title}; ${skipped} ${skipped === 1 ? "question" : "questions"} skipped. You can change these anytime.`;
}

export function initWebInterview(): void {
  const root = document.querySelector<HTMLElement>("[data-web-interview]");
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>("form")!;
  const open = root.querySelector<HTMLButtonElement>("[data-interview-open]")!;
  const status = root.querySelector<HTMLElement>("[data-interview-status]")!;
  const steps = [...root.querySelectorAll<HTMLFieldSetElement>("[data-step]")];
  const back = root.querySelector<HTMLButtonElement>("[data-interview-back]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-interview-next]")!;
  const count = root.querySelector<HTMLElement>("[data-interview-count]")!;
  const meter = root.querySelector<HTMLProgressElement>("progress")!;
  const useProject = root.querySelector<HTMLButtonElement>("[data-use-project]");
  const course = root.dataset.course!;
  const questions = steps.map((step) => step.dataset.question!);
  let interview: Interview | undefined;
  let studentId = "";
  let index = 0;
  let busy = false;
  let projectIdea = "";

  function setBusy(value: boolean): void {
    busy = value;
    root!.querySelectorAll<HTMLButtonElement>("button").forEach((button) => { button.disabled = value; });
    steps.forEach((step) => { step.disabled = value; });
    back.disabled = value || index === 0;
  }

  function showStep(): void {
    steps.forEach((step, i) => { step.hidden = i !== index; });
    count.textContent = `Question ${index + 1} of ${steps.length}`;
    meter.value = index;
    back.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? "Save and continue in agent" : "Save and next";
    steps[index].querySelector<HTMLElement>("legend")!.focus();
  }

  function fillAnswers(): void {
    steps.forEach((step) => {
      const answer = interview?.responses.find((item) => item.question === step.dataset.question)?.answer;
      const values = typeof answer === "string" ? [answer] : answer ?? [];
      const choices = [...step.querySelectorAll<HTMLInputElement>("input")];
      choices.forEach((choice) => { choice.checked = values.includes(choice.value); });
      step.querySelector<HTMLTextAreaElement>("textarea")!.value = values.filter((value) => !choices.some((choice) => choice.value === value)).join("\n");
    });
  }

  open.addEventListener("click", async () => {
    if (busy) return;
    const student = readCachedStudent();
    if (!student) {
      status.textContent = "Enroll on the homepage first, then return here. You can also use the agent interview below.";
      return;
    }
    studentId = student.id;
    setBusy(true);
    status.textContent = "Loading your saved answers…";
    try {
      const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/interviews`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = interviewsSchema.parse(await response.json());
      interview = data.interviews.find((item) => item.course === course);
      projectIdea = String(data.interviews.find((item) => item.course === "agent-setup")?.responses.find((item) => item.question === "What do you want to build or learn?")?.answer ?? "");
      if (useProject) useProject.hidden = !projectIdea;
      fillAnswers();
      index = steps.findIndex((step) => interview?.responses.some((item) => item.question === step.dataset.question && item.pending));
      if (index < 0) index = 0;
      form.hidden = false;
      open.hidden = true;
      status.textContent = interview ? "Your saved answers are here. Pick up where you left off, or go back to change one." : "Let's start with you. Every question is optional.";
    } catch {
      status.textContent = "Your answers couldn't load. Try again before editing, so we keep what's already saved.";
    } finally {
      setBusy(false);
      if (!form.hidden) showStep();
    }
  });

  useProject?.addEventListener("click", () => {
    steps[0].querySelector<HTMLTextAreaElement>("textarea")!.value = projectIdea;
  });
  back.addEventListener("click", () => {
    if (index > 0) { index--; status.textContent = "Changes save when you continue."; showStep(); }
  });
  root.querySelector<HTMLButtonElement>("[data-interview-cancel]")!.addEventListener("click", () => {
    form.hidden = true;
    open.hidden = false;
    open.textContent = "Resume or change answers";
    status.textContent = "Saved steps are ready for you and your agent. This step's unsaved edits were left behind.";
    open.focus();
  });

  async function save(skip: boolean): Promise<void> {
    if (busy) return;
    const step = steps[index];
    const selected = [...step.querySelectorAll<HTMLInputElement>("input:checked")].map((input) => input.value);
    const text = step.querySelector<HTMLTextAreaElement>("textarea")!.value.trim();
    if (text) selected.push(text);
    if (!skip && selected.length === 0) {
      status.textContent = "Choose or write an answer, or use Skip this question.";
      return;
    }
    const answer = skip ? [] : step.dataset.type === "multiple" || selected.length > 1 ? selected : selected[0];
    // A legacy agent interview omitted intentional skips. Only new forms seed
    // pending questions; preserve the meaning of existing omitted answers.
    const existing = interview?.responses ?? questions.map((question) => ({ question, answer: [], pending: true as const }));
    const responses = replaceInterviewAnswer(existing, step.dataset.question!, answer);
    setBusy(true);
    status.textContent = "Saving…";
    try {
      const response = await fetch(`/api/students/${encodeURIComponent(studentId)}/interviews`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(interview ? { "If-Match": `"${interview.updatedAt}"` } : { "If-None-Match": "*" }),
        },
        body: JSON.stringify({ course, responses, summary: webInterviewSummary(root!.dataset.title!, responses, questions) }),
      });
      if (response.status === 412) {
        form.hidden = true;
        open.hidden = false;
        open.textContent = "Reload saved answers";
        status.textContent = "Your answers changed in another tab or your agent. Reload them before making changes. This edit wasn't saved.";
        return;
      }
      if (!response.ok) throw new Error();
      interview = interviewsSchema.parse(await response.json()).interviews.find((item) => item.course === course);
      if (index < steps.length - 1) {
        index++;
        status.textContent = "Saved. You can change this later.";
      } else {
        form.hidden = true;
        open.hidden = false;
        open.textContent = "Review or change answers";
        status.textContent = "Answers saved. Copy the agent prompt above to continue. Your agent will use these answers and finish any setup checks before marking the interview complete.";
        open.focus();
      }
    } catch {
      status.textContent = "Couldn't confirm the save. Your answer is still here. Try again; if it already saved, reload your saved answers.";
    } finally {
      setBusy(false);
      if (!form.hidden) showStep();
      if (form.hidden || status.textContent?.startsWith("Couldn")) status.focus();
    }
  }
  form.addEventListener("submit", (event) => { event.preventDefault(); void save(false); });
  root.querySelector<HTMLButtonElement>("[data-interview-skip]")!.addEventListener("click", () => { void save(true); });
}
