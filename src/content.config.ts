import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { courseFrontmatterSchema, exerciseFrontmatterSchema } from "./schemas/course";

/**
 * Built-in courses, one `courses/<name>/COURSE.md` each (see #73). The entry
 * ID is the course's directory name. Ordering and titles are applied by
 * src/lib/courses.ts, not here.
 */
const courses = defineCollection({
  loader: glob({
    base: "courses",
    pattern: "*/COURSE.md",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: courseFrontmatterSchema,
});

/**
 * Exercises of the built-in courses, `courses/<name>/exercises/<file>.md`.
 * The entry ID is `<name>/<file without .md>`, e.g. "agent-setup/01-models".
 */
const exercises = defineCollection({
  loader: glob({
    base: "courses",
    pattern: "*/exercises/*.md",
    generateId: ({ entry }) => entry.replace("/exercises/", "/").replace(/\.md$/, ""),
  }),
  schema: exerciseFrontmatterSchema,
});

/** The interview a course gets when it doesn't write its own. */
const defaultInterview = defineCollection({
  loader: glob({ base: "src/content", pattern: "default-interview.md" }),
  schema: exerciseFrontmatterSchema,
});

export const collections = { courses, exercises, defaultInterview };
