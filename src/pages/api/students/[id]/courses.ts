import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { DEFAULT_INTERVIEW_PATH } from "../../../../data/courses";
import { INTERVIEW_SLUG, withInterviewFirst } from "@agentschools/course-spec";
import { normalizeCourseUrl } from "../../../../lib/course-url";
import { getBuiltInCourses } from "../../../../lib/courses";
import { broadcastProgress, findStudent, loadProgress } from "../../../../lib/progress-store";
import { externalCourseSchema, reportCourseSchema } from "../../../../schemas/course";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

/**
 * Stores the manifest of a course hosted outside this site, as the student's
 * agent read it (see #77). The server never fetches the course itself. It
 * normalizes the course's URL into its ID and puts the interview first,
 * adding Dev School's default one if the course doesn't have its own.
 * Reporting the same course again replaces its manifest.
 */
export const PUT: APIRoute = async ({ params, request, url }) => {
  const studentId = params.id ?? "";
  const student = await findStudent(studentId);
  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), { status: 404, headers: jsonHeaders });
  }

  const parsed = reportCourseSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400, headers: jsonHeaders });
  }
  const body = parsed.data;

  // The schema only accepts https URLs, which always normalize.
  const id = normalizeCourseUrl(body.url)!;
  const exercises = withInterviewFirst(body.exercises, () => ({
    slug: INTERVIEW_SLUG,
    title: "Interview",
    url: new URL(DEFAULT_INTERVIEW_PATH, url).toString(),
  }));
  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO external_courses (student_id, course_id, title, description, author, exercises, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(student_id, course_id) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       author = excluded.author,
       exercises = excluded.exercises,
       updated_at = excluded.updated_at`,
  )
    .bind(
      studentId,
      id,
      body.title,
      body.description ?? null,
      body.author ?? null,
      JSON.stringify(exercises),
      updatedAt,
      updatedAt,
    )
    .run();

  await broadcastProgress(await loadProgress(studentId, student.created_at, await getBuiltInCourses()));
  const course = externalCourseSchema.parse({ ...body, url: id, exercises, updatedAt });
  return new Response(JSON.stringify(course), { headers: jsonHeaders });
};
