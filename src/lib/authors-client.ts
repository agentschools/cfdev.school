import { buildAuthorPrompt } from "./agent-prompt";
import { initPromptCopy } from "./agent-prompt-copy";

/** /authors: the course-creation prompt needs no enrollment, so it's shown right away. */
export function initAuthorsPage(): void {
  const promptSection = document.getElementById("agent-prompt");
  const promptText = document.getElementById("agent-prompt-text");
  const copyButton = document.getElementById("agent-prompt-copy");
  const copyConfirm = document.getElementById("agent-prompt-confirm");
  if (!promptSection || !promptText || !copyButton || !copyConfirm) return;

  promptText.textContent = buildAuthorPrompt();
  promptSection.hidden = false;

  initPromptCopy(copyButton, promptText, copyConfirm);
}
