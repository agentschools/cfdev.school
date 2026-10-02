import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { buildPrompt } from "./agent-prompt";
import { subscribeToProgress } from "./progress-client";
import type { Progress } from "../schemas/progress";

function formatCompletedBanner(completedAt: string): string {
  const date = new Date(completedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `You completed this lesson on ${date}.`;
}

/**
 * Lesson page (/lessons/{slug}). Enrolled students get a prompt to paste into
 * their agent; the agent marks the lesson complete via PUT /api/progress, and
 * the live progress subscription flips this page to its completed state
 * (banner + next-lesson button) without a reload. There's no manual
 * mark-complete button: completion is the agent's call.
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
    !next ||
    !nextPending ||
    !nextLink
  ) {
    return;
  }

  function renderProgress(progress: Progress): void {
    const completion = progress.completedLessons.find((lesson) => lesson.slug === slug);
    banner!.hidden = !completion;
    if (completion) bannerText!.textContent = formatCompletedBanner(completion.completedAt);
    nextPending!.hidden = Boolean(completion);
    nextLink!.hidden = !completion;
  }

  function onEnrolled(student: CachedStudent): void {
    if (enrollNudge) enrollNudge.hidden = true;
    promptText!.textContent = buildPrompt(student, { kind: "lesson", title: title! });
    promptSection!.hidden = false;
    copyConfirm!.hidden = true;
    next!.hidden = false;
    subscribeToProgress(student.id, renderProgress);
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
