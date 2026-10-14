import { buildChooseCoursePrompt, buildPrompt } from "./agent-prompt";
import type { CatalogCourse } from "./course-progress";
import { buildDashboard, type Dashboard, type DashboardCourse } from "./dashboard";
import { type CachedStudent, ENROLLED_EVENT, type EnrolledDetail, readCachedStudent } from "./enroll-client";
import { subscribeToProgress } from "./progress-client";
import type { Progress } from "../schemas/progress";

/** Harness names and monochrome icons, keyed by harness ID, for "Your agents". */
export type HarnessDirectory = Record<string, { name: string; icon?: string }>;

const COPIED_MS = 2000;

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * The enrolled homepage (#98's dashboard designs): "Up next" with a prompt to
 * paste into the student's agent, their courses, their Agent setup interview
 * summary, and the agents they've used. Everything comes from live progress
 * (src/lib/progress-client.ts), so it updates as the student's agent works.
 * Course titles and URLs of courses hosted elsewhere come from the student's
 * agent, so they only go in through textContent and DOM APIs.
 */
export function initDashboard(): void {
  const root = document.getElementById("dashboard");
  if (!root) return;
  const catalog = JSON.parse(root.dataset.catalog ?? "[]") as CatalogCourse[];
  const directory = JSON.parse(root.dataset.harnesses ?? "{}") as HarnessDirectory;

  const upNext = el("up-next");
  const promptText = el("dashboard-prompt-text");
  const copyButton = el<HTMLButtonElement>("dashboard-prompt-copy");
  let student: CachedStudent | null = null;

  function render(dashboard: Dashboard): void {
    const { upNext: next } = dashboard;
    const choosing = next.kind === "choose";
    const welcome = dashboard.welcome && next.kind === "exercise";
    el("up-next-welcome").hidden = !welcome;
    el("up-next-exercise").hidden = choosing || welcome;
    el("up-next-choose").hidden = !choosing;
    el("dashboard-prompt").hidden = welcome;
    el("prompt-caption").hidden = choosing || welcome;
    el("welcome-description").textContent = welcome ? (next.description ?? "") : "";

    if (next.kind === "exercise") {
      el("up-next-eyebrow").textContent =
        `Up next · ${next.courseTitle} · Exercise ${String(next.index).padStart(2, "0")}`;
      el("up-next-title").textContent = next.exerciseTitle;
      const description = el("up-next-description");
      description.textContent = next.description ?? "";
      description.hidden = !next.description;
      promptText.textContent = buildPrompt(student!, { courseTitle: next.courseTitle, continuing: next.continuing });
    } else {
      el("choose-eyebrow").textContent = next.justFinishedAgentSetup ? "Agent setup complete" : "All caught up";
      el("choose-lede").hidden = !next.justFinishedAgentSetup;
      for (const link of root!.querySelectorAll<HTMLAnchorElement>("[data-track-start]")) {
        const start = dashboard.trackStarts[link.dataset.trackStart as keyof Dashboard["trackStarts"]];
        if (!start) continue;
        link.href = start.url;
        link.querySelector(".track-start")!.textContent = `Start with ${start.title} →`;
      }
      promptText.textContent = buildChooseCoursePrompt(student!);
    }
    upNext.removeAttribute("data-loading");

    renderCourses(dashboard);
    renderAboutYou(dashboard);
    renderAgents(dashboard);
  }

  function renderCourses({ courses: groups }: Dashboard): void {
    el("your-courses").hidden = groups.length === 0;
    el("course-rows").replaceChildren(
      ...groups.flatMap((group) => [
        ...(group.title ? [courseGroupLabel(group.title)] : []),
        ...group.courses.map(courseRow),
      ]),
    );
  }

  function courseGroupLabel(title: string): HTMLElement {
    const item = document.createElement("li");
    item.className = "course-group";
    item.textContent = title;
    return item;
  }

  function courseRow(course: DashboardCourse): HTMLElement {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "course-row";
    link.href = course.url;

    const text = document.createElement("span");
    text.className = "course-row-text";
    const title = document.createElement("span");
    title.className = "course-row-title";
    title.textContent = course.title;
    const sub = document.createElement("span");
    sub.className = "course-row-sub";
    sub.textContent = course.next
      ? `Next: ${course.next}`
      : course.completedAt
        ? `Completed ${formatDate(course.completedAt)}`
        : "";
    text.append(title, sub);

    const bar = document.createElement("span");
    bar.className = "course-row-bar";
    bar.setAttribute("aria-hidden", "true");
    for (const complete of course.segments) {
      const segment = document.createElement("span");
      if (complete) segment.className = "is-done";
      bar.appendChild(segment);
    }

    const count = document.createElement("span");
    count.className = "course-row-count";
    count.textContent = `${course.done} of ${course.segments.length}`;

    link.append(text, bar, count);
    item.appendChild(link);
    return item;
  }

  function renderAboutYou({ aboutYou }: Dashboard): void {
    el("about-you").hidden = !aboutYou;
    el("about-you-summary").textContent = aboutYou ?? "";
  }

  function renderAgents({ agents }: Dashboard): void {
    el("your-agents").hidden = agents.length === 0;
    el("agent-list").replaceChildren(
      ...agents.map(({ harness, exercises }) => {
        const entry = directory[harness] ?? directory.generic;
        const item = document.createElement("li");
        const icon = document.createElement("span");
        icon.className = "agent-icon";
        if (entry?.icon) {
          const mark = document.createElement("span");
          mark.className = "agent-mark";
          mark.style.setProperty("--icon", `url(${entry.icon})`);
          icon.appendChild(mark);
        }
        const text = document.createElement("span");
        text.className = "agent-text";
        const name = document.createElement("span");
        name.className = "agent-name";
        name.textContent = entry?.name ?? harness;
        const count = document.createElement("span");
        count.className = "agent-count";
        count.textContent = plural(exercises, "exercise");
        text.append(name, count);
        item.append(icon, text);
        return item;
      }),
    );
  }

  let progressReceived = false;
  function show(cached: CachedStudent, fresh = false): void {
    student = cached;
    document.documentElement.dataset.enrolled = "";
    const renderEmpty = () =>
      render(buildDashboard({ studentId: cached.id, courses: [], externalCourses: [], updatedAt: cached.createdAt }, catalog));
    // A student who just enrolled has no progress yet, so show the welcome
    // right away: enroll-client.ts switches the page over inside a view
    // transition, which captures the page as it is when this returns.
    if (fresh) renderEmpty();
    subscribeToProgress(cached.id, (progress: Progress) => {
      progressReceived = true;
      render(buildDashboard(progress, catalog));
    });
    // If progress can't load (e.g. a cached ID the server doesn't know),
    // fall back to the first Agent setup exercise rather than nothing.
    setTimeout(() => {
      if (!progressReceived) renderEmpty();
    }, 1500);
  }

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptText.textContent ?? "");
      copyButton.textContent = "Copied";
      setTimeout(() => (copyButton.textContent = "Copy"), COPIED_MS);
    } catch (error) {
      console.error("Copy failed", error);
    }
  });

  // initEnrollment() runs from Layout.astro, usually before this script, so a
  // cached student's ENROLLED_EVENT may already have fired. Check directly too.
  document.addEventListener(ENROLLED_EVENT, ((event: CustomEvent<EnrolledDetail>) => {
    if (event.detail.id !== student?.id) show(event.detail, event.detail.fresh);
  }) as EventListener);
  const cached = readCachedStudent();
  if (cached && cached.id !== student?.id) show(cached);
}
