const STUDENT_STORAGE_KEY = "cfDevSchool.student";
const HARNESS_STORAGE_KEY = "cfDevSchool.harnessId";

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

function readCachedHarnessId(): string | null {
  try {
    return localStorage.getItem(HARNESS_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function initLessonPage(): void {
  const variants = document.querySelectorAll<HTMLElement>(".lesson-variant");
  if (variants.length === 0) return;

  const harnessId = readCachedHarnessId();
  const match =
    (harnessId && document.querySelector<HTMLElement>(`.lesson-variant[data-harness-id="${harnessId}"]`)) ||
    document.querySelector<HTMLElement>('.lesson-variant[data-harness-id="generic"]') ||
    variants[0];
  match.hidden = false;

  const studentId = readCachedStudentId();
  const slug = window.location.pathname.split("/").filter(Boolean).pop();
  if (!studentId || !slug) return;

  fetch(`/api/progress/${studentId}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((progress: { completedLessons: Array<{ slug: string }> } | null) => {
      if (!progress) return;
      const completed = progress.completedLessons.some((lesson) => lesson.slug === slug);
      const badge = document.getElementById("lesson-complete-badge");
      if (badge) badge.hidden = !completed;
    })
    .catch((error) => console.error("Failed to fetch progress", error));
}
