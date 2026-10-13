import { type CatalogCourse, groupByTrack, type StartedCourse, startedCourses } from "./course-progress";
import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { subscribeToProgress } from "./progress-client";
import type { ExerciseCompletion, Progress } from "../schemas/progress";

function formatDate(iso: string, month: "long" | "short"): string {
  return new Date(iso).toLocaleDateString("en-US", { month, day: "numeric", year: "numeric" });
}

/** "Completed October 1, 2026 · 1 new exercise since you finished", or "2 of 6 exercises complete". */
export function courseStatus(course: Pick<StartedCourse, "completedAt" | "exercises" | "remaining">): string {
  if (!course.completedAt) {
    return `${course.exercises.length - course.remaining} of ${course.exercises.length} exercises complete`;
  }
  const completed = `Completed ${formatDate(course.completedAt, "long")}`;
  if (course.remaining === 0) return completed;
  return `${completed} · ${course.remaining} new exercise${course.remaining === 1 ? "" : "s"} since you finished`;
}

/** "Claude Code, Oct 1, 2026", one per agent that completed the exercise, oldest first. */
export function completionLabels(
  completions: readonly Pick<ExerciseCompletion, "harness" | "completedAt">[],
  harnessNames: Readonly<Record<string, string>>,
): string[] {
  return [...completions]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .map((completion) => `${harnessNames[completion.harness] ?? completion.harness}, ${formatDate(completion.completedAt, "short")}`);
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Titles and URLs of courses hosted elsewhere come from what the student's
// agent reported, so everything here goes through textContent, never HTML.
function renderCourse(course: StartedCourse, harnessNames: Record<string, string>): HTMLElement {
  const section = element("section", "profile-course");

  const heading = element("h3", "profile-course-title");
  const link = element("a", "", course.title);
  link.href = course.url;
  heading.appendChild(link);
  section.appendChild(heading);
  if (course.external) section.appendChild(element("p", "profile-course-host", `Hosted at ${new URL(course.url).host}`));
  section.appendChild(element("p", "profile-course-status", courseStatus(course)));

  const list = element("ol", "profile-exercises");
  for (const exercise of course.exercises) {
    const done = exercise.completions.length > 0;
    const item = element("li", done ? "profile-exercise is-done" : "profile-exercise");
    const exerciseLink = element("a", "profile-exercise-title", exercise.title);
    exerciseLink.href = exercise.url;
    item.appendChild(element("span", "profile-exercise-check", done ? "✓" : ""));
    item.appendChild(exerciseLink);
    if (done) {
      item.appendChild(
        element("span", "profile-exercise-completions", completionLabels(exercise.completions, harnessNames).join(" · ")),
      );
    } else if (course.completedAt) {
      item.appendChild(element("span", "profile-exercise-new", "New"));
    }
    list.appendChild(item);
  }
  section.appendChild(list);
  return section;
}

/**
 * /profile (#78): every course the student has started, built-in and hosted
 * elsewhere, with each exercise's per-agent completions. Live through the
 * same progress subscription as every other page. Logged-out visitors get
 * the enroll nudge.
 */
export function initProfilePage(): void {
  const page = document.getElementById("profile");
  const nudge = document.getElementById("profile-enroll-nudge");
  const empty = document.getElementById("profile-empty");
  const list = document.getElementById("profile-courses");
  if (!page || !nudge || !empty || !list) return;

  const catalog = JSON.parse(page.dataset.catalog ?? "[]") as CatalogCourse[];
  const harnessNames = JSON.parse(page.dataset.harnessNames ?? "{}") as Record<string, string>;

  function render(progress: Progress): void {
    const courses = startedCourses(progress, catalog);
    empty!.hidden = courses.length > 0;
    // Grouped like the sidebar: Agent setup, then each track, then courses hosted elsewhere.
    list!.replaceChildren(
      ...groupByTrack(courses).flatMap((group) => [
        ...(group.title ? [element("h2", "profile-group-title", group.title)] : []),
        ...group.courses.map((course) => renderCourse(course, harnessNames)),
      ]),
    );
  }

  function onEnrolled(student: CachedStudent): void {
    nudge!.hidden = true;
    subscribeToProgress(student.id, render);
  }

  document.addEventListener(ENROLLED_EVENT, ((event: CustomEvent<CachedStudent>) => onEnrolled(event.detail)) as EventListener);
  const student = readCachedStudent();
  if (student) onEnrolled(student);
  else nudge.hidden = false;
}
