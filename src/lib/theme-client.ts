import { resolveTheme, THEME_STORAGE_KEY } from "./theme";

export function initColorSelector(): void {
  const selector = document.querySelector<HTMLDetailsElement>("[data-color-selector]");
  if (!selector) return;
  const radios = selector.querySelectorAll<HTMLInputElement>('input[name="student-color"]');
  const label = selector.querySelector<HTMLElement>("[data-color-label]");

  function apply(value: string | null | undefined): void {
    const theme = resolveTheme(value);
    document.documentElement.dataset.themeColor = theme.name;
    radios.forEach((radio) => {
      radio.checked = radio.value === theme.name;
    });
    if (label) label.textContent = `: ${theme.label}`;
  }

  apply(document.documentElement.dataset.themeColor);
  selector.addEventListener("change", (event) => {
    const radio = event.target;
    if (!(radio instanceof HTMLInputElement) || !radio.checked) return;
    apply(radio.value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolveTheme(radio.value).name);
    } catch {
      // The selected palette still applies for this page when storage is blocked.
    }
  });
  selector.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !selector.open) return;
    selector.open = false;
    selector.querySelector("summary")?.focus();
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !selector.contains(event.target)) selector.open = false;
  });
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) apply(event.newValue);
  });
  // Restore controls after a browser back/forward cache navigation too.
  window.addEventListener("pageshow", () => {
    try {
      apply(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      // Keep the current palette.
    }
  });
}
