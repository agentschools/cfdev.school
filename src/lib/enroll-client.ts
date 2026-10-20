// Cipher-reveal + confetti animation adapted from opencodeschool/opencode.school's
// src/pages/index.astro and src/styles/main.css
// (https://github.com/opencodeschool/opencode.school). This app copies
// OpenCode School's enrollment flow wholesale.
//
// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in LICENSES/Apache-2.0.txt or at:
//     https://opensource.org/licenses/Apache-2.0

// Also read by the inline script at the top of src/pages/index.astro, which can't import this module.
const STORAGE_KEY = "cfDevSchool.student";
const CHARS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const CELEBRATION_COLORS = ["var(--accent)", "var(--accent-hover)", "var(--accent-text)"];

/** Dispatched on `document` whenever the student's ID is shown, on fresh enrollment or a cached reload. */
export const ENROLLED_EVENT = "cfDevSchool:enrolled";

export interface CachedStudent {
  id: string;
  createdAt: string;
}

/** ENROLLED_EVENT's detail. */
export interface EnrolledDetail extends CachedStudent {
  /** Enrolled just now with a click, not a cached reload. */
  fresh: boolean;
}

// How long the confetti gets to play after a fresh reveal before the page
// switches over to the welcome. Particles last 0.8s to 1.5s; most are done by
// this point. Kept short so the whole reveal fits the CTA's "2 seconds".
const CELEBRATION_MS = 900;

function randomChar(real: string): string {
  if (real === "-") return "-";
  if (real >= "0" && real <= "9") return DIGITS[Math.floor(Math.random() * DIGITS.length)];
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function scramble(target: string): string {
  return target
    .split("")
    .map((c) => randomChar(c))
    .join("");
}

/** Returns a cancel function, so a reveal in flight (e.g. over the sample ID) can be replaced by another. */
function cipherReveal(display: HTMLElement, target: string, fast: boolean, onDone?: () => void): () => void {
  const scrambleMs = fast ? 15 : 30;
  const delayMs = fast ? 150 : 250;
  const resolveMs = fast ? 45 : 60;
  let resolved = 0;
  let resolveInterval: number | undefined;
  display.textContent = scramble(target);

  const scrambleInterval = window.setInterval(() => {
    let next = "";
    for (let i = 0; i < target.length; i++) {
      if (i < resolved) next += target[i];
      else if (target[i] === "-") next += "-";
      else next += randomChar(target[i]);
    }
    display.textContent = next;
  }, scrambleMs);

  const startTimeout = window.setTimeout(() => {
    resolveInterval = window.setInterval(() => {
      if (resolved >= target.length) {
        window.clearInterval(scrambleInterval);
        window.clearInterval(resolveInterval);
        display.textContent = target;
        onDone?.();
        return;
      }
      if (target[resolved] === "-") resolved++;
      resolved++;
    }, resolveMs);
  }, delayMs);

  return () => {
    window.clearInterval(scrambleInterval);
    window.clearTimeout(startTimeout);
    window.clearInterval(resolveInterval);
  };
}

function fireCelebration(layer: HTMLElement): void {
  const cx = layer.offsetWidth / 2;
  const cy = layer.offsetHeight / 2;

  for (let i = 0; i < 60; i++) {
    const particle = document.createElement("span");
    particle.className = "celebration-particle";

    const angle = Math.random() * 2 * Math.PI;
    const speed = 120 + Math.random() * 200;
    const vx = Math.cos(angle) * speed * 1.6;
    const vy = Math.sin(angle) * speed;

    particle.style.setProperty("--vx", `${vx}px`);
    particle.style.setProperty("--vy", `${vy}px`);
    particle.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    particle.style.setProperty("--size", `${4 + Math.random() * 5}px`);
    particle.style.setProperty("--dur", `${0.8 + Math.random() * 0.7}s`);
    particle.style.setProperty("--radius", Math.random() > 0.4 ? "50%" : "20%");
    particle.style.setProperty("--color", CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)]);
    particle.style.left = `${cx}px`;
    particle.style.top = `${cy}px`;

    layer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }
}

export function readCachedStudent(): CachedStudent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedStudent(student: CachedStudent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
  } catch {
    // Some browsers/extensions block localStorage. Enrollment still works for this session.
  }
}

async function enroll(): Promise<CachedStudent> {
  const response = await fetch("/api/students", { method: "POST" });
  if (!response.ok) throw new Error(`Enrollment failed: ${response.status}`);
  return response.json();
}

export function initEnrollment(): void {
  const card = document.getElementById("student-id-card");
  const display = document.getElementById("student-id-display");
  const celebrationLayer = document.getElementById("celebration-layer");
  const picker = document.querySelector<HTMLElement>("[data-enroll-colors]");
  const starts = document.querySelectorAll<HTMLButtonElement>("[data-enroll-start]");
  if (starts.length === 0 && !picker) return;

  starts.forEach((start) => {
    start.addEventListener("click", () => {
      if (!picker) {
        window.location.assign("/?enroll");
        return;
      }
      start.hidden = true;
      picker.hidden = false;
      (picker.querySelector<HTMLInputElement>('input:checked') ?? picker.querySelector<HTMLInputElement>('input'))?.focus();
    });
  });

  let isSubmitting = false;
  let cancelReveal: (() => void) | undefined;

  // The ID card only exists on the homepage. "Enroll" start buttons (e.g. the
  // header's, or the homepage's own cta-block) can appear on any page, so hiding
  // them must not depend on the card. Once enrolled, there's nothing left for an
  // "Enroll" button to do, so the whole button (or its cta-block wrapper, marked
  // with data-enroll-container) just disappears rather than relabeling.
  function markEnrolled(): void {
    starts.forEach((start) => {
      const container = start.closest<HTMLElement>("[data-enroll-container]") ?? start;
      container.hidden = true;
    });
  }

  // While a fresh ID is minted, <html data-minting> fades the homepage's CTA
  // out and dims the rest of the hero, so the card is the only thing moving.
  // Styles live in src/pages/index.astro.
  function setMinting(minting: boolean): void {
    if (minting) document.documentElement.dataset.minting = "";
    else delete document.documentElement.dataset.minting;
  }

  function announce(student: CachedStudent, fresh: boolean): void {
    markEnrolled();
    document.dispatchEvent(new CustomEvent<EnrolledDetail>(ENROLLED_EVENT, { detail: { ...student, fresh } }));
  }

  function showEnrolled(student: CachedStudent): void {
    announce(student, false);
    if (card && display && celebrationLayer) {
      cancelReveal?.();
      cancelReveal = cipherReveal(display, student.id, true, () => {
        fireCelebration(celebrationLayer);
      });
    }
  }

  // A fresh enrollment is a moment: the card lifts and shimmers while the
  // cipher runs, pops with confetti once the ID lands, and only then does the
  // page switch over (to the dashboard's welcome, on the homepage), with a
  // view transition that carries the card into its new spot.
  function showFreshlyEnrolled(student: CachedStudent): void {
    if (!card || !display || !celebrationLayer) {
      announce(student, true);
      return;
    }
    const layer = celebrationLayer;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    card.classList.remove("is-minted");
    card.classList.add("is-minting");
    setMinting(true);
    cancelReveal?.();
    cancelReveal = cipherReveal(display, student.id, false, () => {
      card.classList.replace("is-minting", "is-minted");
      fireCelebration(layer);
      window.setTimeout(() => {
        card.classList.remove("is-minted");
        // Start the new page at the top: on narrow screens the card was scrolled
        // to the middle, and it ends up below the welcome.
        const switchOver = () => {
          setMinting(false);
          announce(student, true);
          window.scrollTo(0, 0);
        };
        if (reduceMotion || !document.startViewTransition) switchOver();
        else document.startViewTransition(switchOver);
      }, CELEBRATION_MS);
    });
  }

  async function runEnrollment(): Promise<void> {
    const existing = readCachedStudent();
    if (existing) {
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
      showEnrolled(existing);
      return;
    }

    if (isSubmitting) return;
    isSubmitting = true;
    try {
      const student = await enroll();
      writeCachedStudent(student);
      showFreshlyEnrolled(student);
    } catch (error) {
      console.error("Enrollment failed", error);
    } finally {
      isSubmitting = false;
    }
  }

  const cached = readCachedStudent();
  if (cached) {
    showEnrolled(cached);
  } else if (card && display && celebrationLayer && display.textContent) {
    // Logged-out visitors see a sample ID. Play the same reveal over it on load.
    const layer = celebrationLayer;
    cancelReveal = cipherReveal(display, display.textContent.trim(), true, () => fireCelebration(layer));
  }

  if (!cached && new URLSearchParams(window.location.search).has("enroll")) starts[0]?.click();

  // Picking a color is the enrollment action. This listener sits on the picker,
  // an ancestor of the color selector, so theme-client's change handler (on the
  // selector) runs first and the chosen palette is saved and applied before the
  // reveal and confetti play.
  picker?.addEventListener("change", (event) => {
    const radio = event.target;
    if (radio instanceof HTMLInputElement && radio.checked && radio.name === "student-color") {
      void runEnrollment();
    }
  });
}
