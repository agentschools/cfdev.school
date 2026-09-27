import { computePosition, flip, offset, shift } from "@floating-ui/dom";

/**
 * Wires up a single shared tooltip element for every [data-tooltip] node
 * (the homepage's harness logo row). Centered above the trigger via
 * Floating UI, shown on hover and keyboard focus.
 */
export function initHarnessTooltips(): void {
  const triggers = document.querySelectorAll<HTMLElement>("[data-tooltip]");
  if (triggers.length === 0) return;

  const tooltip = document.createElement("div");
  tooltip.className = "harness-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  let activeTrigger: HTMLElement | null = null;

  function showTooltip(trigger: HTMLElement): void {
    const label = trigger.dataset.tooltip;
    if (!label) return;
    activeTrigger = trigger;
    tooltip.textContent = label;
    tooltip.classList.add("is-visible");

    computePosition(trigger, tooltip, {
      placement: "top",
      middleware: [offset(8), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });
  }

  function hideTooltip(trigger: HTMLElement): void {
    if (activeTrigger !== trigger) return;
    activeTrigger = null;
    tooltip.classList.remove("is-visible");
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", () => showTooltip(trigger));
    trigger.addEventListener("mouseleave", () => hideTooltip(trigger));
    trigger.addEventListener("focus", () => showTooltip(trigger));
    trigger.addEventListener("blur", () => hideTooltip(trigger));
  });
}
