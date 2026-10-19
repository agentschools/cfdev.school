import { DEFAULT_THEME, resolveTheme, THEME_STORAGE_KEY } from "./theme";

export function initColorSelectors(): void {
  const selectors = document.querySelectorAll<HTMLElement>("[data-color-selector]");

  function apply(value: string | null | undefined): void {
    const theme = resolveTheme(value);
    document.documentElement.dataset.themeColor = theme.name;
    selectors.forEach((selector) => {
      selector.querySelectorAll<HTMLInputElement>('input[name="student-color"]').forEach((radio) => {
        radio.checked = radio.value === theme.name;
      });
      const label = selector.querySelector<HTMLElement>("[data-color-label]");
      if (label) label.textContent = theme.name === DEFAULT_THEME ? "School orange (default)" : theme.label;
      selector.querySelector("[data-default-color]")?.setAttribute("aria-pressed", String(theme.name === DEFAULT_THEME));
    });
  }

  function save(value: string): void {
    const theme = resolveTheme(value);
    apply(theme.name);
    try {
      if (theme.name === DEFAULT_THEME) localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, theme.name);
    } catch {
      // The selected palette still applies for this page when storage is blocked.
    }
  }

  apply(document.documentElement.dataset.themeColor);
  selectors.forEach((selector) => {
    selector.addEventListener("change", (event) => {
      const radio = event.target;
      if (radio instanceof HTMLInputElement && radio.checked) save(radio.value);
    });
    selector.querySelector("[data-default-color]")?.addEventListener("click", () => save(DEFAULT_THEME));
  });
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) apply(event.newValue);
  });
  window.addEventListener("pageshow", () => {
    try {
      apply(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      // Keep the current palette.
    }
  });
}
