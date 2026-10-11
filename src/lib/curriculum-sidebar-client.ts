import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { exerciseCompletions } from "./course-progress";
import { subscribeToProgress } from "./progress-client";
import type { Progress } from "../schemas/progress";

/**
 * Shows the completion check on every `[data-course][data-exercise]` item on
 * the page: the sidebar's, and any exercise list in the page itself (e.g. a
 * course page), so those don't need their own progress subscription.
 */
function renderChecks(progress: Progress): void {
  for (const check of document.querySelectorAll<HTMLElement>("[data-course][data-exercise] .check")) {
    const item = check.closest<HTMLElement>("[data-course][data-exercise]")!;
    check.hidden = exerciseCompletions(progress, item.dataset.course!, item.dataset.exercise!).length === 0;
  }
}

/**
 * Collapses Agent setup's exercise list to its title once the course is
 * complete. The sidebar leaves out `data-collapse-when-complete` while you're
 * on one of the course's pages, so it stays open there. Not animated: it
 * happens as the page loads, not in response to anything the student did.
 */
function collapseCompleteCourses(progress: Progress): void {
  for (const list of document.querySelectorAll<HTMLElement>("[data-collapse-when-complete]")) {
    const course = progress.courses.find((item) => item.name === list.dataset.collapseWhenComplete);
    list.toggleAttribute("data-collapsed", Boolean(course?.completedAt));
  }
}

export function initCurriculumSidebar(): void {
  const accountSection = document.getElementById("account-section");

  function onEnrolled(student: CachedStudent): void {
    if (accountSection) accountSection.hidden = false;
    subscribeToProgress(student.id, (progress) => {
      renderChecks(progress);
      collapseCompleteCourses(progress);
    });
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
