const DURATION_MS = 380;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Shows or hides `el` (via its `hidden` attribute) with a height + fade +
 * slide animation, so content that appears on an already-open page (e.g. when
 * the student's agent marks an exercise complete over the live progress socket)
 * eases in instead of popping. No-op when `el` is already in the requested
 * state, so it's safe to call on every progress update. Skips the animation
 * for prefers-reduced-motion.
 */
export function setVisible(el: HTMLElement, visible: boolean): void {
  // Compare against the target state, not `hidden`: mid-hide, `hidden` is
  // still false until the animation finishes.
  const target = visible ? "shown" : "hidden";
  if ((el.dataset.revealTarget ?? (el.hidden ? "hidden" : "shown")) === target) return;
  el.dataset.revealTarget = target;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof el.animate !== "function") {
    el.hidden = !visible;
    return;
  }

  el.getAnimations().forEach((animation) => animation.cancel());
  el.style.overflow = "";
  el.hidden = false;
  const style = getComputedStyle(el);
  const open: Keyframe = {
    height: `${el.offsetHeight}px`,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    opacity: 1,
    transform: "translateY(0)",
  };
  const closed: Keyframe = { height: "0px", marginTop: "0px", marginBottom: "0px", opacity: 0, transform: "translateY(-6px)" };

  el.style.overflow = "hidden";
  const animation = el.animate(visible ? [closed, open] : [open, closed], { duration: DURATION_MS, easing: EASING });
  animation.addEventListener("finish", () => {
    el.style.overflow = "";
    if (!visible) el.hidden = true;
  });
}
