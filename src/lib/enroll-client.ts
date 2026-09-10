// Cipher-reveal + confetti animation adapted from opencodeschool/opencode.school's
// src/pages/index.astro and src/styles/main.css
// (https://github.com/opencodeschool/opencode.school), reused per
// plan.agent.md's "copy OpenCode School's enrollment flow wholesale".
//
// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

const STORAGE_KEY = "cfDevSchool.student";
const CHARS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const CELEBRATION_COLORS = ["#f6821f", "#faad3f", "#c026d3", "#7c3aed", "#2563eb"];

interface CachedStudent {
  id: string;
  createdAt: string;
}

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

function cipherReveal(display: HTMLElement, target: string, fast: boolean, onDone?: () => void): void {
  const scrambleMs = fast ? 15 : 30;
  const delayMs = fast ? 150 : 600;
  const resolveMs = fast ? 45 : 140;
  let resolved = 0;
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

  window.setTimeout(() => {
    const resolveInterval = window.setInterval(() => {
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

function readCachedStudent(): CachedStudent | null {
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
  const triggers = document.querySelectorAll<HTMLButtonElement>("[data-enroll-trigger]");
  if (!card || !display || !celebrationLayer || triggers.length === 0) return;

  let isSubmitting = false;

  function showEnrolled(student: CachedStudent, fast: boolean): void {
    card!.hidden = false;
    cipherReveal(display as HTMLElement, student.id, fast, () => {
      fireCelebration(celebrationLayer as HTMLElement);
    });
  }

  const cached = readCachedStudent();
  if (cached) showEnrolled(cached, true);

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", async () => {
      const existing = readCachedStudent();
      if (existing) {
        card!.scrollIntoView({ behavior: "smooth", block: "center" });
        showEnrolled(existing, true);
        return;
      }

      if (isSubmitting) return;
      isSubmitting = true;
      trigger.disabled = true;

      try {
        const student = await enroll();
        writeCachedStudent(student);
        card!.scrollIntoView({ behavior: "smooth", block: "center" });
        showEnrolled(student, false);
      } catch (error) {
        console.error("Enrollment failed", error);
      } finally {
        isSubmitting = false;
        trigger.disabled = false;
      }
    });
  });
}
