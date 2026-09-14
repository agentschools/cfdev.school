import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import {
  completedExerciseSchema,
  markProgressSchema,
  progressSchema,
  type CompletedExercise,
  type Progress,
} from "../../../schemas/progress";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

interface StudentRow {
  id: string;
  created_at: string;
}

interface CompletionRow {
  student_id: string;
  exercise_slug: string;
  completed_at: string;
  deployed_url: string | null;
  model: string | null;
}

function rowToCompletedExercise(row: CompletionRow): CompletedExercise {
  return completedExerciseSchema.parse({
    slug: row.exercise_slug,
    completedAt: row.completed_at,
    ...(row.deployed_url ? { deployedUrl: row.deployed_url } : {}),
    ...(row.model ? { model: row.model } : {}),
  });
}

async function loadProgress(studentId: string, fallbackUpdatedAt: string): Promise<Progress> {
  const { results } = await env.DB.prepare(
    "SELECT * FROM exercise_completions WHERE student_id = ? ORDER BY completed_at ASC",
  )
    .bind(studentId)
    .all<CompletionRow>();

  const completedExercises = (results ?? []).map(rowToCompletedExercise);
  const latest =
    completedExercises.length > 0
      ? completedExercises.reduce<string>(
          (max, item) => (item.completedAt > max ? item.completedAt : max),
          completedExercises[0]!.completedAt,
        )
      : fallbackUpdatedAt;

  return progressSchema.parse({
    studentId,
    completedExercises,
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

  const progress = await loadProgress(studentId, student.created_at);
  return new Response(JSON.stringify(progress), { headers: jsonHeaders });
};
