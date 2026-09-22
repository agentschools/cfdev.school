import { type CachedStudent, ENROLLED_EVENT, readCachedStudent } from "./enroll-client";
import { getHarness, type HarnessProfile } from "../data/harnesses";

const STORAGE_KEY = "cfDevSchool.harnessId";

function readCachedHarnessId(): HarnessProfile["id"] | null {
  try {
    return localStorage.getItem(STORAGE_KEY) as HarnessProfile["id"] | null;
  } catch {
    return null;
  }
}

function writeCachedHarnessId(id: HarnessProfile["id"]): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Some browsers/extensions block localStorage. The picker still works for this session.
  }
}

export function buildPrompt(student: CachedStudent, harness: HarnessProfile): string {
  const origin = window.location.origin;
  return [
    `I'm enrolled in Cloudflare Dev School as ${student.id}.`,
    "",
    `My coding agent is ${harness.name}.`,
    "",
    `API base URL: ${origin}`,
    `Instructions: ${origin}/llms.txt`,
    "",
    "Fetch the instructions URL above and follow them to help me get started.",
  ].join("\n");
}

export function initHarnessPicker(): void {
  const picker = document.getElementById("harness-picker");
  const promptSection = document.getElementById("agent-prompt");
  const promptText = document.getElementById("agent-prompt-text");
  const copyButton = document.getElementById("agent-prompt-copy") as HTMLButtonElement | null;
  const copyConfirm = document.getElementById("agent-prompt-confirm");
  const options = document.querySelectorAll<HTMLButtonElement>(".harness-option");
  if (!picker || !promptSection || !promptText || !copyButton || !copyConfirm || options.length === 0) return;

  let currentStudent: CachedStudent | null = null;

  function selectHarness(harnessId: HarnessProfile["id"]): void {
    if (!currentStudent) return;

    let harness: HarnessProfile;
    try {
      harness = getHarness(harnessId);
    } catch {
      return; // Stale/invalid cached harness id; ignore rather than throw.
    }

    options.forEach((option) => {
      option.classList.toggle("selected", option.dataset.harnessId === harnessId);
    });

    writeCachedHarnessId(harnessId);
    promptText!.textContent = buildPrompt(currentStudent, harness);
    promptSection!.hidden = false;
    copyConfirm!.hidden = true;
  }

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const harnessId = option.dataset.harnessId as HarnessProfile["id"] | undefined;
      if (harnessId) selectHarness(harnessId);
    });
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptText!.textContent ?? "");
      copyConfirm!.hidden = false;
    } catch (error) {
      console.error("Copy failed", error);
    }
  });

  function onEnrolled(student: CachedStudent): void {
    currentStudent = student;
    picker!.hidden = false;

    const cachedHarnessId = readCachedHarnessId();
    if (cachedHarnessId) selectHarness(cachedHarnessId);
  }

  document.addEventListener(ENROLLED_EVENT, ((event: CustomEvent<CachedStudent>) => onEnrolled(event.detail)) as EventListener);

  // initEnrollment() runs globally from Layout.astro, and Astro doesn't
  // guarantee it executes after this page-level script (in practice it runs
  // before), so the ENROLLED_EVENT dispatch for an already-cached student can
  // fire before the listener above is attached. Check directly as a fallback.
  const existingStudent = readCachedStudent();
  if (existingStudent) onEnrolled(existingStudent);
}
