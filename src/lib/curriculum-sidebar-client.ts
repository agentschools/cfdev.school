import { ENROLLED_EVENT } from "./enroll-client";

const STUDENT_STORAGE_KEY = "cfDevSchool.student";

interface CachedStudent {
  id: string;
}

function readCachedStudentId(): string | null {
  try {
    const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CachedStudent).id : null;
  } catch {
    return null;
  }
}

interface Progress {
  completedLessons: Array<{ slug: string }>;
  completedExercises: Array<{ slug: string }>;
}

export function initCurriculumSidebar(): void {
  const accountSection = document.getElementById("account-section");
  // Listen before checking the cached value: a fresh enrollment click on the
  // current page dispatches this event later, not on initial load.
  document.addEventListener(ENROLLED_EVENT, () => {
    if (accountSection) accountSection.hidden = false;
  });

  const studentId = readCachedStudentId();
  if (accountSection) accountSection.hidden = !studentId;
  if (!studentId) return;

  fetch(`/api/progress/${studentId}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((progress: Progress | null) => {
      if (!progress) return;

      for (const lesson of progress.completedLessons) {
        const item = document.querySelector(`[data-lesson-slug="${lesson.slug}"] .check`);
        if (item) (item as HTMLElement).hidden = false;
      }
      for (const exercise of progress.completedExercises) {
        const item = document.querySelector(`[data-exercise-slug="${exercise.slug}"] .check`);
        if (item) (item as HTMLElement).hidden = false;
      }
    })
    .catch((error) => console.error("Failed to fetch progress for sidebar", error));
}
