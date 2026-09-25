import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { getExercise, listExercises } from "../data/exercises";
import { getHarness, type HarnessProfile } from "../data/harnesses";
import { buildPrompt } from "./harness-picker-client";

const HARNESS_STORAGE_KEY = "cfDevSchool.harnessId";

interface CompletedExercise {
  slug: string;
  completedAt: string;
}

interface Progress {
  completedExercises: CompletedExercise[];
}

function readCachedHarnessId(): HarnessProfile["id"] | null {
  try {
    return localStorage.getItem(HARNESS_STORAGE_KEY) as HarnessProfile["id"] | null;
  } catch {
    return null;
  }
}

function resolveHarness(): HarnessProfile {
  const cached = readCachedHarnessId();
  try {
    return getHarness(cached ?? "generic");
  } catch {
    return getHarness("generic"); // Stale/invalid cached id.
  }
}

function formatCompletedBanner(completedAt: string | undefined): string {
  if (!completedAt) return "You completed this exercise!";
  const date = new Date(completedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `You completed this exercise on ${date}.`;
}

/**
 * Exercise detail page (/exercises/{slug}). Mirrors lesson-client.ts: derives
 * the slug from the URL and looks the exercise up in the catalog, so no
 * define:vars handoff is needed. Requires the student to be enrolled to show
 * the prompt and the mark-complete action; unenrolled visitors get the nudge.
 */
export function initExercisePage(): void {
  const slug = window.location.pathname.split("/").filter(Boolean).pop();
  const exercise = slug ? getExercise(slug) : undefined;
  if (!exercise) return;

  const all = listExercises();
  const index = all.findIndex((item) => item.slug === exercise.slug);
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const nextUrl = next ? `/exercises/${next.slug}` : null;
  const nextTitle = next?.title ?? null;

  const enrollNudge = document.getElementById("exercise-enroll-nudge");
  const promptSection = document.getElementById("agent-prompt");
  const promptText = document.getElementById("agent-prompt-text");
  const copyButton = document.getElementById("agent-prompt-copy") as HTMLButtonElement | null;
  const copyConfirm = document.getElementById("agent-prompt-confirm");
  const banner = document.getElementById("exercise-completed-banner");
  const bannerText = document.getElementById("exercise-completed-text");
  const action = document.getElementById("exercise-action");
  const actionBtn = document.getElementById("exercise-action-btn") as HTMLButtonElement | null;
  const actionLabel = document.getElementById("exercise-action-label");

  if (!promptSection || !promptText || !copyButton || !copyConfirm || !action || !actionBtn || !actionLabel) {
    return;
  }

  let currentStudent: CachedStudent | null = null;
  let alreadyComplete = false;

  function fillPrompt(student: CachedStudent): void {
    promptText!.textContent = buildPrompt(student, resolveHarness(), {
      slug: exercise.slug,
      title: exercise.title,
    });
    promptSection!.hidden = false;
    copyConfirm!.hidden = true;
  }

  function showCompleted(completedAt?: string): void {
    alreadyComplete = true;
    if (banner && bannerText) {
      bannerText.textContent = formatCompletedBanner(completedAt);
      banner.hidden = false;
    }
    if (nextUrl && nextTitle) {
      actionLabel.textContent = `Next exercise: ${nextTitle} →`;
      actionBtn.disabled = false;
      actionBtn.onclick = () => {
        window.location.href = nextUrl;
      };
    } else {
      actionLabel.textContent = "Exercise complete!";
      actionBtn.disabled = true;
      actionBtn.onclick = null;
    }
  }

  async function markComplete(): Promise<void> {
    if (!currentStudent || alreadyComplete) return;
    actionBtn.disabled = true;
    const original = actionLabel.textContent;
    actionLabel.textContent = "Saving...";
    try {
      const response = await fetch(`/api/progress/${currentStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseSlug: exercise.slug }),
      });
      if (!response.ok) {
        actionBtn.disabled = false;
        actionLabel.textContent = original;
        return;
      }
      if (nextUrl) {
        window.location.href = nextUrl;
        return;
      }
      const progress = (await response.json()) as Progress;
      const completion = progress.completedExercises.find((item) => item.slug === exercise.slug);
      showCompleted(completion?.completedAt);
    } catch (error) {
      console.error("Failed to mark exercise complete", error);
      actionBtn.disabled = false;
      actionLabel.textContent = original;
    }
  }

  function onEnrolled(student: CachedStudent): void {
    currentStudent = student;
    if (enrollNudge) enrollNudge.hidden = true;
    fillPrompt(student);
    action.hidden = false;
    actionBtn.onclick = () => {
      void markComplete();
    };

    fetch(`/api/progress/${student.id}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((progress: Progress | null) => {
        if (!progress) return;
        const completion = progress.completedExercises.find((item) => item.slug === exercise.slug);
        if (completion) showCompleted(completion.completedAt);
      })
      .catch((error) => console.error("Failed to fetch progress for exercise page", error));
  }

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptText.textContent ?? "");
      copyConfirm.hidden = false;
    } catch (error) {
      console.error("Copy failed", error);
    }
  });

  // initEnrollment() runs globally from Layout.astro before page scripts in
  // practice, so an already-cached student's ENROLLED_EVENT may fire before
  // this listener attaches — check readCachedStudent() directly as a fallback
  // (same pattern as harness-picker-client.ts).
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

/** Exercises index (/exercises): reveals ✓ marks for completed exercises. */
export function initExercisesIndex(): void {
  const student = readCachedStudent();
  if (!student) return;

  fetch(`/api/progress/${student.id}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((progress: Progress | null) => {
      if (!progress) return;
      for (const exercise of progress.completedExercises) {
        // querySelectorAll: the sidebar carries the same [data-exercise-slug]
        // .check markup earlier in the DOM, so a single querySelector would
        // only ever un-hide the sidebar's.
        document
          .querySelectorAll(`[data-exercise-slug="${exercise.slug}"] .check`)
          .forEach((item) => ((item as HTMLElement).hidden = false));
      }
    })
    .catch((error) => console.error("Failed to fetch progress for exercises index", error));
}
