import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { buildPrompt } from "./agent-prompt";
import { exerciseCompletions } from "./course-progress";
import { subscribeToProgress } from "./progress-client";
import { setVisible } from "./reveal";
import type { ExerciseCompletion, Progress } from "../schemas/progress";

/**
 * "You completed this exercise on October 1, 2026 using Claude Code and on
 * November 1, 2026 using OpenAI Codex." One clause per completion (they're
 * per agent, see #52), oldest first. `harnessNames` maps harness IDs to how
 * the sentence should name them.
 */
export function formatCompletedBanner(
  completions: readonly Pick<ExerciseCompletion, "harness" | "completedAt">[],
  harnessNames: Readonly<Record<string, string>>,
): string {
  const clauses = [...completions]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .map((completion) => {
      const date = new Date(completion.completedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      return `on ${date} using ${harnessNames[completion.harness] ?? completion.harness}`;
    });
  return `You completed this exercise ${new Intl.ListFormat("en-US", { type: "conjunction" }).format(clauses)}.`;
}

/**
 * Exercise page (/courses/{course}/{exercise}). Enrolled students get a
 * prompt to paste into their agent; the agent marks the exercise complete via
 * PUT /api/progress, and the live progress subscription flips this page to
 * its completed state (banner naming each agent that completed it + next
 * button, with the prompt tucked behind a "Redo this exercise" button),
 * animated, without a reload. There's no manual mark-complete button:
 * completion is the agent's call.
 */
export function initExercisePage(): void {
  const page = document.querySelector<HTMLElement>("[data-exercise-page]");
  const enrollNudge = document.getElementById("exercise-enroll-nudge");
  const promptSection = document.getElementById("agent-prompt");
  const promptText = document.getElementById("agent-prompt-text");
  const copyButton = document.getElementById("agent-prompt-copy");
  const copyConfirm = document.getElementById("agent-prompt-confirm");
  const banner = document.getElementById("exercise-completed-banner");
  const bannerText = document.getElementById("exercise-completed-text");
  const redoButton = document.getElementById("exercise-redo");
  const next = document.getElementById("exercise-next");
  const nextPending = document.getElementById("exercise-next-pending");
  const nextLink = document.getElementById("exercise-next-link");
  if (
    !page ||
    !promptSection ||
    !promptText ||
    !copyButton ||
    !copyConfirm ||
    !banner ||
    !bannerText ||
    !redoButton ||
    !next ||
    !nextPending ||
    !nextLink
  ) {
    return;
  }

  const { courseName, courseTitle, exerciseSlug, exerciseTitle } = page.dataset as Record<string, string>;
  const harnessNames = JSON.parse(banner.dataset.harnessNames ?? "{}") as Record<string, string>;
  let student: CachedStudent | null = null;
  let progressReceived = false;
  // A completed exercise hides its prompt until the student asks to redo it
  // (e.g. to set up a second agent); after that it stays open.
  let redoRequested = false;

  function renderProgress(progress: Progress): void {
    progressReceived = true;
    const completions = exerciseCompletions(progress, courseName, exerciseSlug);
    const complete = completions.length > 0;
    if (complete) bannerText!.textContent = formatCompletedBanner(completions, harnessNames);
    // Once complete, the prompt asks the agent to redo the exercise.
    promptText!.textContent = buildPrompt(student!, { courseTitle, exerciseTitle, redo: complete });
    setVisible(promptSection!, !complete || redoRequested);
    setVisible(redoButton!, !redoRequested);
    setVisible(banner!, complete);
    setVisible(nextPending!, !complete);
    setVisible(nextLink!, complete);
  }

  function onEnrolled(enrolled: CachedStudent): void {
    student = enrolled;
    if (enrollNudge) enrollNudge.hidden = true;
    promptText!.textContent = buildPrompt(enrolled, { courseTitle, exerciseTitle });
    copyConfirm!.hidden = true;
    next!.hidden = false;
    subscribeToProgress(enrolled.id, renderProgress);
    // If progress can't load (e.g. a cached ID the server doesn't know),
    // fall back to showing the prompt rather than nothing.
    setTimeout(() => {
      if (!progressReceived) setVisible(promptSection!, true);
    }, 1500);
  }

  redoButton.addEventListener("click", () => {
    redoRequested = true;
    setVisible(redoButton, false);
    setVisible(promptSection, true);
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptText.textContent ?? "");
      copyConfirm.hidden = false;
    } catch (error) {
      console.error("Copy failed", error);
    }
  });

  // initEnrollment() may dispatch ENROLLED_EVENT before this listener
  // attaches, so check the cached student directly too.
  document.addEventListener(ENROLLED_EVENT, ((event: CustomEvent<CachedStudent>) => {
    onEnrolled(event.detail);
  }) as EventListener);

  const existing = readCachedStudent();
  if (existing) {
    onEnrolled(existing);
  } else if (enrollNudge) {
    enrollNudge.hidden = false;
  }
}
