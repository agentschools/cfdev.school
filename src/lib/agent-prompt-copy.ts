export const PROMPT_COPIED_STORAGE_KEY = "cfDevSchool.promptCopied";

/**
 * True the first time a prompt is copied in this browser, then false from then
 * on. Blocked storage can't remember, so it always counts as the first time.
 */
export function claimFirstPromptCopy(getStorage: () => Pick<Storage, "getItem" | "setItem"> = () => localStorage): boolean {
  try {
    const storage = getStorage();
    if (storage.getItem(PROMPT_COPIED_STORAGE_KEY)) return false;
    storage.setItem(PROMPT_COPIED_STORAGE_KEY, "1");
    return true;
  } catch {
    return true;
  }
}

/**
 * Copy button for AgentPrompt.astro. Shows the "Copied!" line on every copy,
 * plus the "Don't have an agent yet?" help only on the first one.
 */
export function initPromptCopy(copyButton: HTMLElement, promptText: HTMLElement, copyConfirm: HTMLElement): void {
  const help = copyConfirm.querySelector<HTMLElement>("#agent-prompt-help");
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptText.textContent ?? "");
      if (help) help.hidden = !claimFirstPromptCopy();
      copyConfirm.hidden = false;
    } catch (error) {
      console.error("Copy failed", error);
    }
  });
}
