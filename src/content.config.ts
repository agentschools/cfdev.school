import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { courseFrontmatterSchema, exerciseFrontmatterSchema } from "./schemas/course";

/**
 * Built-in courses, one `courses/<name>/COURSE.md` each (see #73), or
 * `courses/<track>/<name>/COURSE.md` for a course in a track (see TRACKS in
 * src/data/courses.ts). The entry ID is the course's directory name, without
 * its track. Ordering and titles are applied by src/lib/courses.ts, not here.
 */
const courses = defineCollection({
  loader: glob({
    base: "courses",
    pattern: ["*/COURSE.md", "*/*/COURSE.md"],
    generateId: ({ entry }) => entry.split("/").at(-2)!,
  }),
  schema: courseFrontmatterSchema,
});

/**
 * Exercises of the built-in courses, `courses/<name>/exercises/<file>.md`
 * (or `courses/<track>/<name>/...`). The entry ID is
 * `<name>/<file without .md>`, e.g. "agent-setup/01-models".
 */
const exercises = defineCollection({
  loader: glob({
    base: "courses",
    pattern: ["*/exercises/*.md", "*/*/exercises/*.md"],
    generateId: ({ entry }) => entry.split("/").slice(-3).join("/").replace("/exercises/", "/").replace(/\.md$/, ""),
  }),
  schema: exerciseFrontmatterSchema,
});

/** The interview a course gets when it doesn't write its own. */
const defaultInterview = defineCollection({
  loader: glob({ base: "src/content", pattern: "default-interview.md" }),
  schema: exerciseFrontmatterSchema,
});

/**
 * The guide for course authors (#79), shaped like an exercise: its
 * `agent-instructions` are the procedure for the author's agent, and its body
 * is what Dev School adds to the format, rendered on /authors and served raw
 * at /authors.md.
 */
const authorsGuide = defineCollection({
  loader: glob({ base: "src/content", pattern: "authors.md" }),
  schema: exerciseFrontmatterSchema,
});

/** The COURSE.md format, from the pinned @agentschools/course-spec dependency. Rendered on /authors. */
const courseSpec = defineCollection({
  loader: glob({ base: "node_modules/@agentschools/course-spec", pattern: "SPEC.md" }),
});

export const collections = { courses, exercises, defaultInterview, authorsGuide, courseSpec };
