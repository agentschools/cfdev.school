import { z } from "zod";

/**
 * Courses and their exercises (see #73). A course is a directory with a
 * `COURSE.md` whose frontmatter loosely follows the Agent Skills spec
 * (https://agentskills.io/specification), plus an `exercises/` directory of
 * Markdown files ordered by filename. Built-in courses live in `courses/` at
 * the repo root. Ordering, slug, and title rules live in src/lib/course-format.ts.
 *
 * Source of truth for the `courses` and `exercises` content collections
 * (src/content.config.ts) and GET /api/courses, and for courses hosted
 * outside this site (#77): the `external_courses` D1 table
 * (migrations/0011_create_external_courses.sql) and PUT
 * /api/students/{id}/courses.
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

const httpsUrlSchema = z.url({ protocol: /^https$/ });

/**
 * How request bodies name a course: a built-in course's name, or the URL of a
 * course hosted elsewhere, which the server normalizes (src/lib/course-url.ts).
 */
export const courseRefSchema = z.union([courseNameSchema, httpsUrlSchema]).meta({
  description:
    'A built-in course\'s name, as GET /api/courses lists it, or the https URL of a course hosted elsewhere that you\'ve reported with PUT /api/students/{id}/courses. URLs are normalized (lowercase host, no trailing slash, ".git", query, or fragment), so any form of the same URL works.',
  example: "agent-setup",
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

/** An exercise in a course hosted elsewhere, as stored. */
export const externalExerciseSchema = z.object({
  slug: exerciseSlugSchema,
  title: z.string().min(1).meta({
    description: "The exercise file's first `#` heading, or the section's `##` heading in a single-file course.",
  }),
  url: z.url().meta({
    description: "Where the exercise lives, as reported, or Dev School's default interview on this site.",
  }),
});

/** An exercise as the student's agent reports it: always public, so always https. */
const reportedExerciseSchema = externalExerciseSchema.extend({
  url: httpsUrlSchema.meta({
    description:
      "Where the exercise lives: its file on the web (e.g. its GitHub page), or the course's URL plus `#<slug>` for a single-file course.",
  }),
});

/** Body for PUT /api/students/{id}/courses: the manifest the student's agent read. */
export const reportCourseSchema = z.object({
  url: httpsUrlSchema.meta({
    description: "COURSE.md's `metadata.url` if it declares one, otherwise the URL the student gave you.",
    example: "https://github.com/acme/durable-objects-course",
  }),
  title: z.string().min(1).meta({ description: "The course's first `#` heading." }),
  description: courseFrontmatterSchema.shape.description.optional(),
  author: z.string().min(1).optional().meta({ description: "COURSE.md's `metadata.author`, if it has one." }),
  exercises: z
    .array(reportedExerciseSchema)
    .refine((exercises) => new Set(exercises.map((exercise) => exercise.slug)).size === exercises.length, {
      message: "Exercise slugs must be unique",
    })
    .meta({
      description:
        "Every exercise, in order. Include the course's own interview if it has one; if it doesn't, Dev School's default interview is added first.",
    }),
});

/** A course hosted elsewhere, as stored for one student. */
export const externalCourseSchema = reportCourseSchema.extend({
  url: z.url().meta({
    description: "The course's ID: the reported URL, normalized. Use it as `course` from then on.",
    example: "https://github.com/acme/durable-objects-course",
  }),
  exercises: z.array(externalExerciseSchema).meta({ description: "Every exercise, in order, interview first." }),
  updatedAt: z.iso.datetime().meta({ description: "When the course was last reported, as an ISO 8601 timestamp." }),
});

export type CourseFrontmatter = z.infer<typeof courseFrontmatterSchema>;
export type ExerciseFrontmatter = z.infer<typeof exerciseFrontmatterSchema>;
export type CourseExercise = z.infer<typeof courseExerciseSchema>;
export type Course = z.infer<typeof courseSchema>;
export type ReportCourse = z.infer<typeof reportCourseSchema>;
export type ExternalCourse = z.infer<typeof externalCourseSchema>;
