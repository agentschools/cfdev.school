import { z } from "zod";
import { createDocument } from "zod-openapi";
import { harnessProfileSchema } from "../data/harnesses";
import { exerciseSchema, exerciseSlugSchema } from "../schemas/exercise";
import { interviewAnswersSchema, interviewSchema } from "../schemas/interview";
import { markProgressSchema, progressSchema } from "../schemas/progress";
import { studentIdSchema, studentSchema } from "../schemas/student";

const lessonContentSchema = z.object({
  slug: z.string(),
  harness: harnessProfileSchema.shape.id,
  title: z.string(),
  description: z.string(),
  quiz: z.boolean(),
  agentInstructions: z.string(),
});

/**
 * OpenAPI spec for the Cloudflare Dev School public API, derived from the
 * same Zod schemas the API routes validate against (see plan.agent.md's
 * "ship types, not docs" type design approach). Served at /api/openapi.json.
 */
export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Cloudflare Dev School API",
    version: "0.1.0",
    description:
      "Public, versioned API for Cloudflare Dev School: enrollment, interview, exercises, and progress. No authentication required.",
  },
  paths: {
    "/api/students": {
      post: {
        summary: "Enroll a new student",
        description:
          "Creates a student with a randomly generated adjective-noun-number ID and no personal data. Call this once per student and cache the returned ID (e.g. in localStorage) for subsequent requests.",
        responses: {
          "201": {
            description: "Student created.",
            content: {
              "application/json": { schema: studentSchema },
            },
          },
        },
      },
    },
    "/api/students/{id}/interview": {
      get: {
        summary: "Get a student's interview answers",
        description:
          "Returns the student's technical background, Cloudflare familiarity, learning goals, OS, and quiz opt-in preference. Familiarity and background only inform tone and depth of explanation, they never skip lessons or branch logic in v1.",
        requestParams: { path: z.object({ id: studentIdSchema }) },
        responses: {
          "200": {
            description: "Interview answers.",
            content: {
              "application/json": { schema: interviewSchema },
            },
          },
          "404": {
            description: "The student hasn't been interviewed yet.",
          },
        },
      },
      put: {
        summary: "Submit or update a student's interview answers",
        description:
          "Partial update: send only the fields you're setting. Safe to call repeatedly, e.g. once per interview question, or later just to change quizOptIn. quizOptIn defaults to true on first creation.",
        requestParams: { path: z.object({ id: studentIdSchema }) },
        requestBody: {
          content: {
            "application/json": { schema: interviewAnswersSchema },
          },
        },
        responses: {
          "200": {
            description: "Interview answers after the update.",
            content: {
              "application/json": { schema: interviewSchema },
            },
          },
          "404": {
            description: "No student exists with that ID.",
          },
        },
      },
    },
    "/api/exercises": {
      get: {
        summary: "List all exercises",
        description:
          "Returns every exercise in the catalog, sorted by order, including student-facing content and agent instructions.",
        responses: {
          "200": {
            description: "Array of exercises.",
            content: {
              "application/json": { schema: z.array(exerciseSchema) },
            },
          },
        },
      },
    },
    "/api/exercises/{slug}": {
      get: {
        summary: "Get a single exercise",
        description: "Returns one exercise by slug, including content and agent instructions.",
        requestParams: { path: z.object({ slug: exerciseSlugSchema }) },
        responses: {
          "200": {
            description: "Exercise found.",
            content: {
              "application/json": { schema: exerciseSchema },
            },
          },
          "404": {
            description: "No exercise exists with that slug.",
          },
        },
      },
    },
    "/api/lessons/{slug}": {
      get: {
        summary: "Get lesson content for a harness",
        description:
          "Returns the agent instructions and description for a lesson, tailored to the given harness. Falls back to the generic variant if the harness has no dedicated content or is omitted.",
        requestParams: {
          path: z.object({ slug: z.string() }),
          query: z.object({ harness: harnessProfileSchema.shape.id.optional() }),
        },
        responses: {
          "200": {
            description: "Lesson content for the resolved harness.",
            content: {
              "application/json": { schema: lessonContentSchema },
            },
          },
          "404": {
            description: "No lesson exists with that slug.",
          },
        },
      },
    },
    "/api/progress/{studentId}": {
      get: {
        summary: "Get a student's progress",
        description:
          "Returns which exercises and lessons the student has completed. Empty completedExercises/completedLessons means nothing is complete yet in that category.",
        requestParams: { path: z.object({ studentId: studentIdSchema }) },
        responses: {
          "200": {
            description: "Progress for the student.",
            content: {
              "application/json": { schema: progressSchema },
            },
          },
          "404": {
            description: "No student exists with that ID.",
          },
        },
      },
      put: {
        summary: "Mark an exercise or lesson complete",
        description:
          "Idempotent upsert: marks the given exercise or lesson complete for the student. Send exactly one of exerciseSlug or lessonSlug. Exercises may optionally include deployedUrl (the public Worker URL you verified); both may optionally include model (your current model ID). Lessons require harness (your harness ID) and may include a one-sentence summary; lesson completions are kept per harness, so completing a lesson with a second agent adds a second completion. Unknown slugs are rejected.",
        requestParams: { path: z.object({ studentId: studentIdSchema }) },
        requestBody: {
          content: {
            "application/json": { schema: markProgressSchema },
          },
        },
        responses: {
          "200": {
            description: "Updated progress.",
            content: {
              "application/json": { schema: progressSchema },
            },
          },
          "400": {
            description: "Invalid body (e.g. unknown exercise/lesson slug or bad deployedUrl).",
          },
          "404": {
            description: "No student exists with that ID.",
          },
        },
      },
      delete: {
        summary: "Reset a student's progress",
        description:
          "Deletes all of the student's exercise and lesson completions. The student row and interview answers are kept, only their progress is cleared. Used by the 'Reset progress' option on /disenroll.",
        requestParams: { path: z.object({ studentId: studentIdSchema }) },
        responses: {
          "200": {
            description: "Progress after the reset (both arrays empty).",
            content: {
              "application/json": { schema: progressSchema },
            },
          },
          "404": {
            description: "No student exists with that ID.",
          },
        },
      },
    },
  },
});
