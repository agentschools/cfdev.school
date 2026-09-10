import { z } from "zod";

/**
 * A student, identified by a randomly generated adjective-noun-number ID
 * (e.g. "curious-hacker-2019"). No account, no email, no personal data.
 *
 * This is the single source of truth for the `students` D1 table shape
 * (see migrations/0001_create_students.sql) and the /api/students response.
 */
export const studentSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z]+-[a-z]+-\d{4}$/, "Student ID must look like adjective-noun-1234")
    .meta({
      description: "Randomly generated adjective-noun-number student ID.",
      example: "curious-hacker-2019",
    }),
  createdAt: z.iso.datetime().meta({
    description: "When the student enrolled, as an ISO 8601 timestamp.",
    example: "2026-09-10T12:00:00.000Z",
  }),
});

export type Student = z.infer<typeof studentSchema>;
