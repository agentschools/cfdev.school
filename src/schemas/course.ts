import { courseFrontmatterSchema, courseNameSchema, exerciseSlugSchema } from "@agentschools/course-spec";
import { z } from "zod";
import { TRACKS } from "../data/courses";

/**
 * Courses and their exercises (see #73), in the COURSE.md format
 * (https://github.com/agentschools/course-spec). That package defines the
 * frontmatter schemas and the ordering, slug, and title rules; this file adds
 * what Dev School serves and stores. Built-in courses live in `courses/` at
 * the repo root.
 *
 * Source of truth for the `courses` and `exercises` content collections
 * (src/content.config.ts) and GET /api/courses, and for courses hosted
 * outside this site (#77): the `external_courses` D1 table
 * (migrations/0011_create_external_courses.sql) and PUT
 * /api/students/{id}/courses.
 */

export {
  type CourseFrontmatter,
  courseFrontmatterSchema,
  courseNameSchema,
  type ExerciseFrontmatter,
  exerciseFrontmatterSchema,
  exerciseSlugSchema,
} from "@agentschools/course-spec";

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

// Not strict: GET /api/courses parses loaded courses with this to strip what
// the API doesn't expose.
export const courseSchema = z.object({
  ...courseFrontmatterSchema.shape,
  title: z.string().min(1).meta({ description: "The course's first `#` heading." }),
  track: z.enum(TRACKS).optional().meta({
    description:
      'The course\'s track, a grouping only: "projects" (build something, outcome first) or "fundamentals" (one concept or product at a time). Agent setup has no track.',
  }),
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

export type CourseExercise = z.infer<typeof courseExerciseSchema>;
export type Course = z.infer<typeof courseSchema>;
export type ReportCourse = z.infer<typeof reportCourseSchema>;
export type ExternalCourse = z.infer<typeof externalCourseSchema>;
