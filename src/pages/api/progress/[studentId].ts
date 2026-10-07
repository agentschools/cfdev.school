import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { getBuiltInCourses } from "../../../lib/courses";
import { resolveCourse } from "../../../lib/external-courses";
import { broadcastProgress, findStudent, loadProgress } from "../../../lib/progress-store";
import { markExerciseCompleteSchema } from "../../../schemas/progress";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

function badRequest(error: string): Response {
  return new Response(JSON.stringify({ error }), { status: 400, headers: jsonHeaders });
}

function studentNotFound(): Response {
  return new Response(JSON.stringify({ error: "Student not found" }), { status: 404, headers: jsonHeaders });
}

export const GET: APIRoute = async ({ params }) => {
  const studentId = params.studentId ?? "";
  const student = await findStudent(studentId);
  if (!student) return studentNotFound();

  const progress = await loadProgress(studentId, student.created_at, await getBuiltInCourses());
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};

/**
 * Resets a student's progress: deletes all exercise and course completions,
 * but keeps the student row, interviews, and reported courses. Used by the "Reset
 * progress" option on /disenroll (see AGENTS.md's "Disenroll" section).
 * "Disenroll completely" is a client-only localStorage clear and doesn't
 * call this.
 */
export const DELETE: APIRoute = async ({ params }) => {
  const studentId = params.studentId ?? "";
  const student = await findStudent(studentId);
  if (!student) return studentNotFound();

  await env.DB.batch([
    env.DB.prepare("DELETE FROM course_exercise_completions WHERE student_id = ?").bind(studentId),
    env.DB.prepare("DELETE FROM course_completions WHERE student_id = ?").bind(studentId),
  ]);

  const progress = await loadProgress(studentId, student.created_at, await getBuiltInCourses());
  await broadcastProgress(progress);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};

export const PUT: APIRoute = async ({ params, request, url }) => {
  const studentId = params.studentId ?? "";
  const student = await findStudent(studentId);
  if (!student) return studentNotFound();

  const parsed = markExerciseCompleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return badRequest(parsed.error.message);
  const body = parsed.data;

  const courses = await getBuiltInCourses();
  const course = await resolveCourse(studentId, body.course, courses);
  if (!course) {
    return badRequest(
      `No course "${body.course}". GET /api/courses lists the built-in ones; report a course hosted elsewhere with PUT /api/students/{id}/courses first.`,
    );
  }
  const exercise = course.exercises.find((item) => item.slug === body.exercise);
  if (!exercise) return badRequest(`No exercise "${body.exercise}" in course "${course.id}"`);

  const completedAt = new Date().toISOString();
  const exerciseUrl = new URL(exercise.url, url).toString();
  const slugs = course.exercises.map((item) => item.slug);

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO course_exercise_completions (student_id, course_id, exercise_slug, harness, exercise_url, model, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, course_id, exercise_slug, harness) DO UPDATE SET
         exercise_url = excluded.exercise_url,
         model = COALESCE(excluded.model, course_exercise_completions.model),
         completed_at = excluded.completed_at`,
    ).bind(studentId, course.id, body.exercise, body.harness, exerciseUrl, body.model ?? null, completedAt),
    // Records the course as complete the first time every one of its current
    // exercises has a completion. INSERT OR IGNORE keeps the first date.
    env.DB.prepare(
      `INSERT OR IGNORE INTO course_completions (student_id, course_id, completed_at)
       SELECT ?, ?, ?
       WHERE (
         SELECT COUNT(DISTINCT exercise_slug) FROM course_exercise_completions
         WHERE student_id = ? AND course_id = ? AND exercise_slug IN (${slugs.map(() => "?").join(", ")})
       ) = ?`,
    ).bind(studentId, course.id, completedAt, studentId, course.id, ...slugs, slugs.length),
  ]);

  const progress = await loadProgress(studentId, student.created_at, courses);
  await broadcastProgress(progress);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};
