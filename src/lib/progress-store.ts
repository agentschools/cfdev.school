import { env } from "cloudflare:workers";
import { type ExerciseCompletion, type Progress, progressSchema } from "../schemas/progress";
import type { BuiltInCourse } from "./courses";

// Server-side progress reads and broadcasts, shared by the progress and
// interview routes. Browsers go through src/lib/progress-client.ts instead.

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
  completed_at: string;
}

interface CourseCompletionRow {
  course_id: string;
  completed_at: string;
}

interface InterviewSummaryRow {
  course_id: string;
  summary: string;
}

function rowToCompletion(row: ExerciseCompletionRow): ExerciseCompletion {
  return {
    harness: row.harness as ExerciseCompletion["harness"],
    completedAt: row.completed_at,
    exerciseUrl: row.exercise_url,
    ...(row.model ? { model: row.model } : {}),
  };
}

export async function findStudent(studentId: string): Promise<StudentRow | null> {
  return env.DB.prepare("SELECT id, created_at FROM students WHERE id = ?").bind(studentId).first<StudentRow>();
}

/** Every built-in course and exercise, in order, with the student's completions and interview summaries filled in. */
export async function loadProgress(studentId: string, fallbackUpdatedAt: string, courses: BuiltInCourse[]): Promise<Progress> {
  const [{ results: completionRows }, { results: courseRows }, { results: interviewRows }] = await Promise.all([
    env.DB.prepare("SELECT * FROM course_exercise_completions WHERE student_id = ? ORDER BY completed_at ASC")
      .bind(studentId)
      .all<ExerciseCompletionRow>(),
    env.DB.prepare("SELECT * FROM course_completions WHERE student_id = ?").bind(studentId).all<CourseCompletionRow>(),
    env.DB.prepare("SELECT course_id, summary FROM interviews WHERE student_id = ?")
      .bind(studentId)
      .all<InterviewSummaryRow>(),
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
      interviewSummary: interviewRows.find((row) => row.course_id === course.name)?.summary,
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
export async function broadcastProgress(progress: Progress): Promise<void> {
  try {
    await env.PROGRESS_HUB.getByName(progress.studentId).broadcast(progress);
  } catch (error) {
    console.error("Failed to broadcast progress", error);
  }
}
