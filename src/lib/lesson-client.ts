import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { buildPrompt } from "./agent-prompt";
import { subscribeToProgress } from "./progress-client";
import { setVisible } from "./reveal";
import type { CompletedLesson, Progress } from "../schemas/progress";

/**
 * "You completed this lesson on October 1, 2026 using Claude Code and on
 * November 1, 2026 using OpenAI Codex." One clause per harness (lesson
 * completions are per agent, see #52), oldest first. `harnessNames` maps
 * harness IDs to how the sentence should name them.
 */
export function formatCompletedBanner(
  completions: readonly CompletedLesson[],
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
  return `You completed this lesson ${new Intl.ListFormat("en-US", { type: "conjunction" }).format(clauses)}.`;
}

/**
 * Lesson page (/lessons/{slug}). Enrolled students get a prompt to paste into
 * their agent; the agent marks the lesson complete via PUT /api/progress, and
 * the live progress subscription flips this page to its completed state
 * (banner with the agent's one-sentence summary + next-lesson button),
 * animated, without a reload. There's no manual mark-complete button:
 * completion is the agent's call.
 */
export function initLessonPage(): void {
  const slug = window.location.pathname.split("/").filter(Boolean).pop();
  const title = document.querySelector("h1")?.textContent?.trim();
  const enrollNudge = document.getElementById("lesson-enroll-nudge");
  const promptSection = document.getElementById("agent-prompt");
  const promptText = document.getElementById("agent-prompt-text");
  const copyButton = document.getElementById("agent-prompt-copy");
  const copyConfirm = document.getElementById("agent-prompt-confirm");
  const banner = document.getElementById("lesson-completed-banner");
  const bannerText = document.getElementById("lesson-completed-text");
  const bannerSummary = document.getElementById("lesson-completed-summary");
  const next = document.getElementById("lesson-next");
  const nextPending = document.getElementById("lesson-next-pending");
  const nextLink = document.getElementById("lesson-next-link");
  if (
    !slug ||
    !title ||
    !promptSection ||
    !promptText ||
    !copyButton ||
    !copyConfirm ||
    !banner ||
    !bannerText ||
    !bannerSummary ||
    !next ||
    !nextPending ||
    !nextLink
  ) {
    return;
  }

  const harnessNames = JSON.parse(banner.dataset.harnessNames ?? "{}") as Record<string, string>;
  let student: CachedStudent | null = null;

  function renderProgress(progress: Progress): void {
    const completions = progress.completedLessons.filter((lesson) => lesson.slug === slug);
    const latest = completions.reduce<CompletedLesson | undefined>(
      (newest, item) => (!newest || item.completedAt > newest.completedAt ? item : newest),
      undefined,
    );
    if (latest) {
      bannerText!.textContent = formatCompletedBanner(completions, harnessNames);
      bannerSummary!.textContent = latest.summary ?? "";
      bannerSummary!.hidden = !latest.summary;
    }
    // Once complete, the prompt asks the agent to redo the lesson, e.g. to
    // set up a second agent the student is trying.
    promptText!.textContent = buildPrompt(student!, { kind: "lesson", title: title!, redo: Boolean(latest) });
    setVisible(banner!, Boolean(latest));
    setVisible(nextPending!, !latest);
    setVisible(nextLink!, Boolean(latest));
  }

  function onEnrolled(enrolled: CachedStudent): void {
    student = enrolled;
    if (enrollNudge) enrollNudge.hidden = true;
    promptText!.textContent = buildPrompt(enrolled, { kind: "lesson", title: title! });
    promptSection!.hidden = false;
    copyConfirm!.hidden = true;
    next!.hidden = false;
    subscribeToProgress(enrolled.id, renderProgress);
  }

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptText.textContent ?? "");
      copyConfirm.hidden = false;
    } catch (error) {
      console.error("Copy failed", error);
    }
  });

  // Same cached-student fallback as exercise-client.ts: initEnrollment() may
  // dispatch ENROLLED_EVENT before this listener attaches.
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
