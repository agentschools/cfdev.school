import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { exercisePath } from "../../../data/courses";
import { type BuiltInCourse, getBuiltInCourses } from "../../../lib/courses";
import { type ExerciseCompletion, markExerciseCompleteSchema, type Progress, progressSchema } from "../../../schemas/progress";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

interface StudentRow {
  id: string;
  created_at: string;
}

interface ExerciseCompletionRow {
  course_id: string;
  exercise_slug: string;
  harness: string;
  exercise_url: string;
  model: string | null;
  summary: string | null;
  completed_at: string;
}

interface CourseCompletionRow {
  course_id: string;
  completed_at: string;
}

function rowToCompletion(row: ExerciseCompletionRow): ExerciseCompletion {
  return {
    harness: row.harness as ExerciseCompletion["harness"],
    completedAt: row.completed_at,
    exerciseUrl: row.exercise_url,
    ...(row.model ? { model: row.model } : {}),
    ...(row.summary ? { summary: row.summary } : {}),
  };
}

/** Every built-in course and exercise, in order, with the student's completions filled in. */
async function loadProgress(studentId: string, fallbackUpdatedAt: string, courses: BuiltInCourse[]): Promise<Progress> {
  const [{ results: completionRows }, { results: courseRows }] = await Promise.all([
    env.DB.prepare("SELECT * FROM exercise_completions WHERE student_id = ? ORDER BY completed_at ASC")
      .bind(studentId)
      .all<ExerciseCompletionRow>(),
    env.DB.prepare("SELECT * FROM course_completions WHERE student_id = ?").bind(studentId).all<CourseCompletionRow>(),
  ]);

  const updatedAt = [...completionRows, ...courseRows].reduce(
    (max, row) => (row.completed_at > max ? row.completed_at : max),
    fallbackUpdatedAt,
  );

  return progressSchema.parse({
    studentId,
    courses: courses.map((course) => ({
      name: course.name,
      completedAt: courseRows.find((row) => row.course_id === course.name)?.completed_at,
      exercises: course.exercises.map((exercise) => ({
        slug: exercise.slug,
        completions: completionRows
          .filter((row) => row.course_id === course.name && row.exercise_slug === exercise.slug)
          .map(rowToCompletion),
      })),
    })),
    updatedAt,
  });
}

/**
 * Pushes the new progress to any open browser tabs for this student (see
 * src/durable-objects/progress-hub.ts). The D1 write already succeeded, so a
 * failed broadcast is logged rather than failing the request: tabs re-fetch
 * progress when their WebSocket reconnects.
 */
async function broadcastProgress(progress: Progress): Promise<void> {
  try {
    await env.PROGRESS_HUB.getByName(progress.studentId).broadcast(progress);
  } catch (error) {
    console.error("Failed to broadcast progress", error);
  }
}

async function findStudent(studentId: string): Promise<StudentRow | null> {
  return env.DB.prepare("SELECT id, created_at FROM students WHERE id = ?").bind(studentId).first<StudentRow>();
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
 * but keeps the student row and interview answers. Used by the "Reset
 * progress" option on /disenroll (see AGENTS.md's "Disenroll" section).
 * "Disenroll completely" is a client-only localStorage clear and doesn't
 * call this.
 */
export const DELETE: APIRoute = async ({ params }) => {
  const studentId = params.studentId ?? "";
  const student = await findStudent(studentId);
  if (!student) return studentNotFound();

  await env.DB.batch([
    env.DB.prepare("DELETE FROM exercise_completions WHERE student_id = ?").bind(studentId),
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
      `INSERT INTO exercise_completions (student_id, course_id, exercise_slug, harness, exercise_url, model, summary, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, course_id, exercise_slug, harness) DO UPDATE SET
         exercise_url = excluded.exercise_url,
         model = COALESCE(excluded.model, exercise_completions.model),
         summary = COALESCE(excluded.summary, exercise_completions.summary),
         completed_at = excluded.completed_at`,
    ).bind(studentId, course.name, body.exercise, body.harness, exerciseUrl, body.model ?? null, body.summary ?? null, completedAt),
    // Records the course as complete the first time every one of its current
    // exercises has a completion. INSERT OR IGNORE keeps the first date.
    env.DB.prepare(
      `INSERT OR IGNORE INTO course_completions (student_id, course_id, completed_at)
       SELECT ?, ?, ?
       WHERE (
         SELECT COUNT(DISTINCT exercise_slug) FROM exercise_completions
         WHERE student_id = ? AND course_id = ? AND exercise_slug IN (${slugs.map(() => "?").join(", ")})
       ) = ?`,
    ).bind(studentId, course.name, completedAt, studentId, course.name, ...slugs, slugs.length),
  ]);

  const progress = await loadProgress(studentId, student.created_at, courses);
  await broadcastProgress(progress);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};
