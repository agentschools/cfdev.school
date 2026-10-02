import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { subscribeToProgress } from "./progress-client";
import type { Progress } from "../schemas/progress";

function renderChecks(progress: Progress): void {
  const completedLessons = new Set(progress.completedLessons.map((lesson) => lesson.slug as string));
  const completedExercises = new Set(progress.completedExercises.map((exercise) => exercise.slug as string));

  for (const check of document.querySelectorAll<HTMLElement>("[data-lesson-slug] .check")) {
    const slug = check.closest<HTMLElement>("[data-lesson-slug]")?.dataset.lessonSlug ?? "";
    check.hidden = !completedLessons.has(slug);
  }
  for (const check of document.querySelectorAll<HTMLElement>("[data-exercise-slug] .check")) {
    const slug = check.closest<HTMLElement>("[data-exercise-slug]")?.dataset.exerciseSlug ?? "";
    check.hidden = !completedExercises.has(slug);
  }
}

export function initCurriculumSidebar(): void {
  const accountSection = document.getElementById("account-section");

  function onEnrolled(student: CachedStudent): void {
    if (accountSection) accountSection.hidden = false;
    subscribeToProgress(student.id, renderChecks);
  }

  // Listen before checking the cached value: a fresh enrollment click on the
  // current page dispatches this event later, not on initial load.
  document.addEventListener(ENROLLED_EVENT, ((event: CustomEvent<CachedStudent>) => {
    onEnrolled(event.detail);
  }) as EventListener);

  const student = readCachedStudent();
  if (accountSection) accountSection.hidden = !student;
  if (student) onEnrolled(student);
}
