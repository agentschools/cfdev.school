import { z } from "zod";
import { createDocument } from "zod-openapi";
import { harnessProfileSchema } from "../data/harnesses";
import { courseSchema } from "../schemas/course";
import { interviewAnswersSchema, interviewSchema } from "../schemas/interview";
import { markExerciseCompleteSchema, progressSchema } from "../schemas/progress";
import { studentIdSchema, studentSchema } from "../schemas/student";

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
      "Public, versioned API for Cloudflare Dev School: enrollment, interview, courses, harness profiles, and progress. No authentication required.",
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
          "Returns the student's AI agent experience, platforms used before, learning goals, OS, and quiz opt-in preference. Agent experience and platforms only inform tone and depth of explanation, they never skip exercises or branch logic in v1.",
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
    "/api/courses": {
      get: {
        summary: "List built-in courses",
        description:
          "Returns the built-in courses in order, each with its exercises in order (the interview is always first). To teach an exercise, fetch its markdownUrl and follow the Markdown: its agent-instructions frontmatter, if any, and its body. Fetch GET /api/harnesses/{id} for facts specific to your harness.",
        responses: {
          "200": {
            description: "Array of courses.",
            content: {
              "application/json": { schema: z.array(courseSchema) },
            },
          },
        },
      },
    },
    "/api/harnesses/{id}": {
      get: {
        summary: "Get a harness profile",
        description:
          "Returns researched, manually maintained facts about one agent harness: instructions file location, MCP and skills setup, subscription billing policy, and models. Each profile has a lastVerified date and sources. These facts change often, so confirm commands against the harness's own CLI help or docs before running them, and trust those over this data if they disagree.",
        requestParams: { path: z.object({ id: harnessProfileSchema.shape.id }) },
        responses: {
          "200": {
            description: "Harness profile.",
            content: {
              "application/json": { schema: harnessProfileSchema },
            },
          },
          "404": {
            description: "No harness exists with that ID.",
          },
        },
      },
    },
    "/api/progress/{studentId}": {
      get: {
        summary: "Get a student's progress",
        description:
          "Returns every built-in course and exercise, in order, with the student's completions: one per harness that completed an exercise, and a completedAt on each course the student has finished.",
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
        summary: "Mark an exercise complete",
        description:
          "Idempotent upsert: marks an exercise complete for the student, per harness, so completing it with a second agent adds a second completion. Send the course name and exercise slug as GET /api/courses lists them, your harness ID, and your model ID. Agent setup's interview also takes a one-sentence summary of the student's answers. When every exercise in the course has a completion, the course is marked complete too, once. Unknown courses and exercises are rejected.",
        requestParams: { path: z.object({ studentId: studentIdSchema }) },
        requestBody: {
          content: {
            "application/json": { schema: markExerciseCompleteSchema },
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
            description: "Invalid body (e.g. an unknown course or exercise, or a missing harness).",
          },
          "404": {
            description: "No student exists with that ID.",
          },
        },
      },
      delete: {
        summary: "Reset a student's progress",
        description:
          "Deletes all of the student's exercise and course completions. The student row and interview answers are kept, only their progress is cleared. Used by the 'Reset progress' option on /disenroll.",
        requestParams: { path: z.object({ studentId: studentIdSchema }) },
        responses: {
          "200": {
            description: "Progress after the reset, with no completions.",
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
