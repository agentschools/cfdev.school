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
  const studentId = readCachedStudentId();
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
