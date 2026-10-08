import { z } from "zod";
import { createDocument } from "zod-openapi";
import { harnessProfileSchema } from "../data/harnesses";
import { courseSchema, externalCourseSchema, reportCourseSchema } from "../schemas/course";
import { interviewsSchema, saveInterviewSchema } from "../schemas/interview";
import { markExerciseCompleteSchema, progressSchema } from "../schemas/progress";
import { studentIdSchema, studentSchema } from "../schemas/student";

/**
 * OpenAPI spec for the Cloudflare Dev School public API, derived from the
 * same Zod schemas the API routes validate against ("ship types, not docs",
 * https://shiptypes.com/). Served at /api/openapi.json.
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
          "Replaces the student's interview for one course: send every response, not just the ones that changed, each with the question's text as asked. Pushes the new summary to the student's open tabs along with their progress. Courses that aren't built in or reported are rejected.",
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
    "/api/students/{id}/courses": {
      put: {
        summary: "Report a course hosted elsewhere",
        description:
          "Stores the manifest of a course hosted outside this site, as you read it: a git repo with COURSE.md and exercises/, or a single-file COURSE.md whose ## sections are exercises. The server never fetches the course. It normalizes the course's URL into its ID (lowercase host, no trailing slash, .git, query, or fragment) and puts the interview first, adding Dev School's default one if the course doesn't have an exercise slugged interview. Reporting the same course again replaces its manifest. Then pass its URL as `course` to the interview and progress endpoints.",
        requestParams: { path: z.object({ id: studentIdSchema }) },
        requestBody: {
          content: {
            "application/json": { schema: reportCourseSchema },
          },
        },
        responses: {
          "200": {
            description: "The course as stored.",
            content: {
              "application/json": { schema: externalCourseSchema },
            },
          },
          "400": {
            description: "Invalid body (e.g. a URL that isn't https, or duplicate exercise slugs).",
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
          "Returns every built-in course and exercise, in order, then the courses hosted elsewhere that the student's agent reported, with the student's completions: one per harness that completed an exercise, a completedAt on each course the student has finished, and each course's interview summary.",
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
          "Idempotent upsert: marks an exercise complete for the student, per harness, so completing it with a second agent adds a second completion. Send the course name and exercise slug as GET /api/courses lists them (or a reported course's URL and slug), your harness ID, and your model ID. When every exercise in the course has a completion, the course is marked complete too, once. Courses that aren't built in or reported, and exercises missing from them, are rejected.",
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
          "Deletes all of the student's exercise and course completions. The student row, interviews, and reported courses are kept, only their progress is cleared. Used by the 'Reset progress' option on /disenroll.",
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
