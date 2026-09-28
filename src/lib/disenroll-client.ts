import { readCachedStudent } from "./enroll-client";

const STUDENT_STORAGE_KEY = "cfDevSchool.student";

/**
 * /disenroll page. Mirrors OpenCode School's disenroll page (see AGENTS.md's
 * "Disenroll" section): "Reset progress" deletes the student's D1 completions
 * via DELETE /api/progress/{id} but keeps their student ID; "Disenroll
 * completely" only clears this browser's localStorage, it never touches the
 * server, matching this app's no-accounts model.
 */
export function initDisenrollPage(): void {
  const nudge = document.getElementById("disenroll-enroll-nudge");
  const sections = document.getElementById("disenroll-sections");
  const resetBtn = document.getElementById("reset-progress-btn") as HTMLButtonElement | null;
  const resetStatus = document.getElementById("reset-progress-status");
  const disenrollBtn = document.getElementById("disenroll-btn") as HTMLButtonElement | null;

  const student = readCachedStudent();
  if (!student) {
    if (nudge) nudge.hidden = false;
    if (sections) sections.hidden = true;
    return;
  }

  resetBtn?.addEventListener("click", async () => {
    if (!window.confirm("Reset all your lesson and exercise progress? This can't be undone.")) return;

    resetBtn.disabled = true;
    const originalLabel = resetBtn.textContent;
    resetBtn.textContent = "Resetting...";
    if (resetStatus) resetStatus.hidden = true;

    try {
      const response = await fetch(`/api/progress/${student.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Reset failed: ${response.status}`);
      if (resetStatus) {
        resetStatus.textContent = "Your progress has been reset.";
        resetStatus.hidden = false;
      }
    } catch (error) {
      console.error("Failed to reset progress", error);
      if (resetStatus) {
        resetStatus.textContent = "Something went wrong. Please try again.";
        resetStatus.hidden = false;
      }
    } finally {
      resetBtn.disabled = false;
      resetBtn.textContent = originalLabel;
    }
  });

  disenrollBtn?.addEventListener("click", () => {
    if (!window.confirm("Disenroll from Cloudflare Dev School on this browser?")) return;

    try {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
    } catch {
      // Some browsers/extensions block localStorage; nothing more to clear.
    }
    window.location.href = "/";
  });
}
