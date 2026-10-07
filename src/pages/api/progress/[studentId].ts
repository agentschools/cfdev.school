import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { exercisePath } from "../../../data/courses";
import { getBuiltInCourses } from "../../../lib/courses";
import { broadcastProgress, findStudent, loadProgress } from "../../../lib/progress-store";
import { markExerciseCompleteSchema } from "../../../schemas/progress";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

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
 * but keeps the student row and interviews. Used by the "Reset
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
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400, headers: jsonHeaders });
  }
  const body = parsed.data;

  const courses = await getBuiltInCourses();
  const course = courses.find((item) => item.name === body.course);
  if (!course?.exercises.some((exercise) => exercise.slug === body.exercise)) {
    return new Response(JSON.stringify({ error: `No exercise "${body.exercise}" in a course named "${body.course}"` }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const completedAt = new Date().toISOString();
  const exerciseUrl = new URL(exercisePath(course.name, body.exercise), url).toString();
  const slugs = course.exercises.map((exercise) => exercise.slug);

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO course_exercise_completions (student_id, course_id, exercise_slug, harness, exercise_url, model, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, course_id, exercise_slug, harness) DO UPDATE SET
         exercise_url = excluded.exercise_url,
         model = COALESCE(excluded.model, course_exercise_completions.model),
         completed_at = excluded.completed_at`,
    ).bind(studentId, course.name, body.exercise, body.harness, exerciseUrl, body.model ?? null, completedAt),
    // Records the course as complete the first time every one of its current
    // exercises has a completion. INSERT OR IGNORE keeps the first date.
    env.DB.prepare(
      `INSERT OR IGNORE INTO course_completions (student_id, course_id, completed_at)
       SELECT ?, ?, ?
       WHERE (
         SELECT COUNT(DISTINCT exercise_slug) FROM course_exercise_completions
         WHERE student_id = ? AND course_id = ? AND exercise_slug IN (${slugs.map(() => "?").join(", ")})
       ) = ?`,
    ).bind(studentId, course.name, completedAt, studentId, course.name, ...slugs, slugs.length),
  ]);

  const progress = await loadProgress(studentId, student.created_at, courses);
  await broadcastProgress(progress);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};
