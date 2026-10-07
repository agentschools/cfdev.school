import { z } from "zod";
import { createDocument } from "zod-openapi";
import { harnessProfileSchema } from "../data/harnesses";
import { courseSchema } from "../schemas/course";
import { interviewsSchema, saveInterviewSchema } from "../schemas/interview";
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
      "Public, versioned API for Cloudflare Dev School: enrollment, interviews, courses, harness profiles, and progress. No authentication required.",
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
    "/api/students/{id}/interviews": {
      get: {
        summary: "Get a student's interviews",
        description:
          "Returns every interview the student has done, one per course in catalog order, each a list of question-and-answer pairs plus a one-sentence summary. Read them all before starting any course: Agent setup's is the baseline (quiz preference, OS, AI agent experience). Answers only inform tone and depth of explanation, they never skip exercises.",
        requestParams: { path: z.object({ id: studentIdSchema }) },
        responses: {
          "200": {
            description: "The student's interviews. Empty until the first one is saved.",
            content: {
              "application/json": { schema: interviewsSchema },
            },
          },
          "404": {
            description: "No student exists with that ID.",
          },
        },
      },
      put: {
        summary: "Save a course's interview",
        description:
          "Replaces the student's interview for one course: send every response, not just the ones that changed, each with the question's text as asked. Pushes the new summary to the student's open tabs along with their progress. Unknown courses are rejected.",
        requestParams: { path: z.object({ id: studentIdSchema }) },
        requestBody: {
          content: {
            "application/json": { schema: saveInterviewSchema },
          },
        },
        responses: {
          "200": {
            description: "All of the student's interviews after the update.",
            content: {
              "application/json": { schema: interviewsSchema },
            },
          },
          "400": {
            description: "Invalid body (e.g. an unknown course or a missing summary).",
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
          "Returns every built-in course and exercise, in order, with the student's completions: one per harness that completed an exercise, a completedAt on each course the student has finished, and each course's interview summary.",
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
          "Idempotent upsert: marks an exercise complete for the student, per harness, so completing it with a second agent adds a second completion. Send the course name and exercise slug as GET /api/courses lists them, your harness ID, and your model ID. When every exercise in the course has a completion, the course is marked complete too, once. Unknown courses and exercises are rejected.",
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
          "Deletes all of the student's exercise and course completions. The student row and interviews are kept, only their progress is cleared. Used by the 'Reset progress' option on /disenroll.",
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
