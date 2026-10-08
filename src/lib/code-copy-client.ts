const COPY_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

const RESET_MS = 2000;

/**
 * Wraps every <pre> inside `.prose` (course and exercise content, including
 * one-line commands) in a container with an icon-only copy button on the right.
 * After a click the button briefly shows a check and "Copied". Blocks fenced
 * as ```text (diagrams like file trees, nothing to paste) get no button.
 */
export function initCodeCopyButtons(root: ParentNode = document): void {
  for (const pre of root.querySelectorAll<HTMLPreElement>(".prose pre")) {
    if (pre.parentElement?.classList.contains("code-block")) continue;
    if (pre.querySelector(":scope > code.language-text")) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";
    pre.replaceWith(wrapper);
    wrapper.appendChild(pre);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.setAttribute("aria-label", "Copy to clipboard");
    button.innerHTML = `${COPY_ICON}<span class="code-copy-label" aria-live="polite"></span>`;
    wrapper.appendChild(button);

    const label = button.querySelector(".code-copy-label") as HTMLElement;
    let timer: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener("click", async () => {
      const text = (pre.textContent ?? "").replace(/\n$/, "");
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.error("Copy failed", error);
        return;
      }
      button.classList.add("copied");
      button.querySelector("svg")!.outerHTML = CHECK_ICON;
      label.textContent = "Copied";
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.classList.remove("copied");
        button.querySelector("svg")!.outerHTML = COPY_ICON;
        label.textContent = "";
      }, RESET_MS);
    });
  }
}
