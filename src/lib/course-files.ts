import defaultInterview from "../content/default-interview.md?raw";
import { exerciseSlugFromFilename, INTERVIEW_SLUG } from "./course-format";

/**
 * The built-in courses' files exactly as they are in the repo, bundled at
 * build time, for the raw file routes under src/pages/courses/[name]/ and
 * for tests that check the real content. Keyed by course name, then by
 * filename in the course's exercises/ directory.
 */
// A course is `courses/<name>/`, or `courses/<track>/<name>/` in a track (see TRACKS in src/data/courses.ts).
const courseFiles = import.meta.glob<string>(["/courses/*/COURSE.md", "/courses/*/*/COURSE.md"], {
  query: "?raw",
  import: "default",
  eager: true,
});
const exerciseFiles = import.meta.glob<string>(["/courses/*/exercises/*.md", "/courses/*/*/exercises/*.md"], {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface RawCourse {
  name: string;
  /** The track directory the course is in, if any. */
  track?: string;
  courseMarkdown: string;
  /** Filename to raw Markdown. Includes "interview.md" (the default interview) when the course has no interview. */
  exercises: Record<string, string>;
}

export function rawCourses(): RawCourse[] {
  return Object.entries(courseFiles).map(([path, courseMarkdown]) => {
    // "/courses/agent-setup/" or "/courses/fundamentals/bindings/"
    const dir = path.slice(0, -"COURSE.md".length);
    const dirs = dir.split("/").slice(2, -1);
    const name = dirs.at(-1)!;
    const track = dirs.length === 2 ? dirs[0] : undefined;
    const exercises = Object.fromEntries(
      Object.entries(exerciseFiles)
        .filter(([exercisePath]) => exercisePath.startsWith(`${dir}exercises/`))
        .map(([exercisePath, markdown]) => [exercisePath.split("/").pop()!, markdown]),
    );
    const hasInterview = Object.keys(exercises).some((file) => exerciseSlugFromFilename(file) === INTERVIEW_SLUG);
    if (!hasInterview) exercises[`${INTERVIEW_SLUG}.md`] = defaultInterview;
    return { name, ...(track ? { track } : {}), courseMarkdown, exercises };
  });
}
