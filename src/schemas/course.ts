import { z } from "zod";

/**
 * Courses and their exercises (see #73). A course is a directory with a
 * `COURSE.md` whose frontmatter loosely follows the Agent Skills spec
 * (https://agentskills.io/specification), plus an `exercises/` directory of
 * Markdown files ordered by filename. Built-in courses live in `courses/` at
 * the repo root. Ordering, slug, and title rules live in src/lib/course-format.ts.
 *
 * Source of truth for the `courses` and `exercises` content collections
 * (src/content.config.ts) and GET /api/courses.
 */

/** Same rules as an Agent Skills `name`: lowercase letters, numbers, and single hyphens. */
const namePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const courseNameSchema = z.string().min(1).max(64).regex(namePattern).meta({
  description: "Stable course name. Lowercase letters, numbers, and hyphens, matching the course's directory.",
  example: "agent-setup",
});

export const exerciseSlugSchema = z.string().min(1).max(64).regex(namePattern).meta({
  description:
    'Stable exercise slug: the exercise\'s filename without ".md" or a leading number prefix ("01-models.md" is "models").',
  example: "models",
});

/** `COURSE.md` frontmatter. Same field set as `SKILL.md`. */
export const courseFrontmatterSchema = z.object({
  name: courseNameSchema,
  description: z.string().min(1).max(1024).meta({
    description: "What the course teaches and who it's for.",
  }),
  license: z.string().min(1).optional(),
  compatibility: z.string().min(1).max(500).optional().meta({
    description: "Prerequisites: accounts, tools, or courses the student needs first.",
  }),
  metadata: z.record(z.string(), z.string()).optional().meta({
    description: "Anything else, as strings. Dev School reads `author`.",
  }),
});

/** Exercise file frontmatter. Everything is optional, the body is the exercise. */
export const exerciseFrontmatterSchema = z.object({
  description: z.string().min(1).optional(),
  "agent-instructions": z.string().min(1).optional(),
});

export const courseExerciseSchema = z.object({
  slug: exerciseSlugSchema,
  title: z.string().min(1).meta({ description: "The exercise's first `#` heading." }),
  description: z.string().min(1).optional(),
  url: z.url().meta({ description: "The exercise's page on this site." }),
  markdownUrl: z.url().meta({
    description:
      "The exercise's raw Markdown, frontmatter included. Read it to teach the exercise: follow its `agent-instructions` frontmatter (if any) and its body.",
  }),
});

export const courseSchema = courseFrontmatterSchema.extend({
  title: z.string().min(1).meta({ description: "The course's first `#` heading." }),
  url: z.url().meta({ description: "The course's page on this site." }),
  markdownUrl: z.url().meta({ description: "The course's raw COURSE.md." }),
  exercises: z.array(courseExerciseSchema).meta({
    description: "In order. The interview is always first.",
  }),
});

export type CourseFrontmatter = z.infer<typeof courseFrontmatterSchema>;
export type ExerciseFrontmatter = z.infer<typeof exerciseFrontmatterSchema>;
export type CourseExercise = z.infer<typeof courseExerciseSchema>;
export type Course = z.infer<typeof courseSchema>;
