import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import {
  completedExerciseSchema,
  completedLessonSchema,
  markProgressSchema,
  progressSchema,
  type CompletedExercise,
  type CompletedLesson,
  type Progress,
} from "../../../schemas/progress";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

interface StudentRow {
  id: string;
  created_at: string;
}

interface ExerciseCompletionRow {
  student_id: string;
  exercise_slug: string;
  completed_at: string;
  deployed_url: string | null;
  model: string | null;
}

interface LessonCompletionRow {
  student_id: string;
  lesson_slug: string;
  completed_at: string;
  model: string | null;
}

function rowToCompletedExercise(row: ExerciseCompletionRow): CompletedExercise {
  return completedExerciseSchema.parse({
    slug: row.exercise_slug,
    completedAt: row.completed_at,
    ...(row.deployed_url ? { deployedUrl: row.deployed_url } : {}),
    ...(row.model ? { model: row.model } : {}),
  });
}

function rowToCompletedLesson(row: LessonCompletionRow): CompletedLesson {
  return completedLessonSchema.parse({
    slug: row.lesson_slug,
    completedAt: row.completed_at,
    ...(row.model ? { model: row.model } : {}),
  });
}

async function loadProgress(studentId: string, fallbackUpdatedAt: string): Promise<Progress> {
  const [{ results: exerciseRows }, { results: lessonRows }] = await Promise.all([
    env.DB.prepare("SELECT * FROM exercise_completions WHERE student_id = ? ORDER BY completed_at ASC")
      .bind(studentId)
      .all<ExerciseCompletionRow>(),
    env.DB.prepare("SELECT * FROM lesson_completions WHERE student_id = ? ORDER BY completed_at ASC")
      .bind(studentId)
      .all<LessonCompletionRow>(),
  ]);

  const completedExercises = (exerciseRows ?? []).map(rowToCompletedExercise);
  const completedLessons = (lessonRows ?? []).map(rowToCompletedLesson);

  const latest = [...completedExercises, ...completedLessons].reduce<string>(
    (max, item) => (item.completedAt > max ? item.completedAt : max),
    fallbackUpdatedAt,
  );

  return progressSchema.parse({
    studentId,
    completedExercises,
    completedLessons,
    updatedAt: latest,
  });
}

export const GET: APIRoute = async ({ params }) => {
  const studentId = params.studentId ?? "";

  const student = await env.DB.prepare("SELECT id, created_at FROM students WHERE id = ?")
    .bind(studentId)
    .first<StudentRow>();

  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  const progress = await loadProgress(studentId, student.created_at);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};

/**
 * Resets a student's progress: deletes all exercise/lesson completions, but
 * keeps the student row and interview answers. Used by the "Reset progress"
 * option on /disenroll (see AGENTS.md's "Disenroll" section). "Disenroll
 * completely" is a client-only localStorage clear and doesn't call this.
 */
export const DELETE: APIRoute = async ({ params }) => {
  const studentId = params.studentId ?? "";

  const student = await env.DB.prepare("SELECT id, created_at FROM students WHERE id = ?")
    .bind(studentId)
    .first<StudentRow>();

  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  await Promise.all([
    env.DB.prepare("DELETE FROM exercise_completions WHERE student_id = ?").bind(studentId).run(),
    env.DB.prepare("DELETE FROM lesson_completions WHERE student_id = ?").bind(studentId).run(),
  ]);

  const progress = await loadProgress(studentId, student.created_at);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const studentId = params.studentId ?? "";

  const student = await env.DB.prepare("SELECT id, created_at FROM students WHERE id = ?")
    .bind(studentId)
    .first<StudentRow>();

  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  const parsed = markProgressSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  const body = parsed.data;
  const completedAt = new Date().toISOString();

  if ("exerciseSlug" in body) {
    const deployedUrl = body.deployedUrl ?? null;
    const model = body.model ?? null;

    await env.DB.prepare(
      `INSERT INTO exercise_completions (student_id, exercise_slug, completed_at, deployed_url, model)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(student_id, exercise_slug) DO UPDATE SET
         completed_at = excluded.completed_at,
         deployed_url = COALESCE(excluded.deployed_url, exercise_completions.deployed_url),
         model = COALESCE(excluded.model, exercise_completions.model)`,
    )
      .bind(studentId, body.exerciseSlug, completedAt, deployedUrl, model)
      .run();
  } else {
    const model = body.model ?? null;

    await env.DB.prepare(
      `INSERT INTO lesson_completions (student_id, lesson_slug, completed_at, model)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(student_id, lesson_slug) DO UPDATE SET
         completed_at = excluded.completed_at,
         model = COALESCE(excluded.model, lesson_completions.model)`,
    )
      .bind(studentId, body.lessonSlug, completedAt, model)
      .run();
  }

  const progress = await loadProgress(studentId, student.created_at);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};
