/**
 * Built-in courses (see #73), in catalog order. Each name is a directory in
 * `courses/` at the repo root. Course directories can't carry number
 * prefixes the way exercise files do, since a course's `name` matches its
 * directory, so their order lives here.
 */
export const COURSE_ORDER = ["agent-setup", "publish-a-website", "build-a-guestbook", "workers", "bindings", "durable-objects"] as const;

/**
 * Track directories in `courses/`. A course in a track lives in
 * `courses/<track>/<name>/`; one that isn't, like Agent setup, lives in
 * `courses/<name>/`. Course URLs don't include the track. In the order pages
 * show them: Projects first.
 */
export const TRACKS = ["projects", "fundamentals"] as const;

export type Track = (typeof TRACKS)[number];

/** How pages label each track. */
export const TRACK_LABELS: Record<Track, { title: string; pitch: string; description: string }> = {
  projects: {
    title: "Projects",
    pitch: "Build something",
    description: "Build something you want, and pick up Cloudflare products along the way.",
  },
  fundamentals: {
    title: "Fundamentals",
    pitch: "Learn how it works",
    description: "One concept or product at a time: how it works and how the pieces fit together.",
  },
};

/** The course every other course assumes the student has finished. */
export const REQUIRED_COURSE = "agent-setup";

export function coursePath(name: string): string {
  return `/courses/${name}`;
}

export function exercisePath(course: string, slug: string): string {
  return `/courses/${course}/${slug}`;
}

/** Raw COURSE.md, as it is in the repo. */
export function courseMarkdownPath(name: string): string {
  return `/courses/${name}/COURSE.md`;
}

/** Raw exercise file, as it is in the repo. `file` is its name in the course's exercises/ directory. */
export function exerciseMarkdownPath(course: string, file: string): string {
  return `/courses/${course}/exercises/${file}`;
}

/** Dev School's default interview, raw, for a course hosted elsewhere that doesn't have its own. */
export const DEFAULT_INTERVIEW_PATH = "/default-interview.md";
