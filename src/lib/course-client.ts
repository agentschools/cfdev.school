import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { buildPrompt } from "./agent-prompt";
import { hasCompletions } from "./course-progress";
import { subscribeToProgress } from "./progress-client";

/**
 * Course page (/courses/{name}). Enrolled students get a prompt for working
 * through the whole course; logged-out visitors get the enroll nudge. The
 * exercise list's completion checks are filled in by the sidebar's client
 * (curriculum-sidebar-client.ts), which marks every exercise on the page.
 */
export function initCoursePage(): void {
  const page = document.querySelector<HTMLElement>("[data-course-page]");
  const enrollNudge = document.getElementById("course-enroll-nudge");
  const promptSection = document.getElementById("agent-prompt");
  const promptText = document.getElementById("agent-prompt-text");
  const copyButton = document.getElementById("agent-prompt-copy");
  const copyConfirm = document.getElementById("agent-prompt-confirm");
  if (!page || !enrollNudge || !promptSection || !promptText || !copyButton || !copyConfirm) return;

  const { courseName = "", courseTitle = "" } = page.dataset;
  let studentId: string | undefined;

  function onEnrolled(student: CachedStudent): void {
    enrollNudge!.hidden = true;
    promptText!.textContent = buildPrompt(student, { courseTitle });
    copyConfirm!.hidden = true;
    promptSection!.hidden = false;
    if (student.id === studentId) return;
    studentId = student.id;
    // Once the student has completed some of the course, the prompt continues it.
    subscribeToProgress(student.id, (progress) => {
      promptText!.textContent = buildPrompt(student, { courseTitle, continuing: hasCompletions(progress, courseName) });
    });
  }

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
  if (existing) onEnrolled(existing);
  else enrollNudge.hidden = false;
}
