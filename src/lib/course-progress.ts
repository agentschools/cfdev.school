import type { Progress } from "../schemas/progress";

export interface ExerciseCompletion {
  completedAt: string;
  /** Harness that completed it, when progress records one. */
  harness?: string;
}

/**
 * Completions of one exercise in a built-in course. Progress is still keyed
 * by the slugs from before courses existed: Agent setup's exercises are
 * stored as lessons (one completion per harness), Workers basics' as
 * exercises (one per student, and its interview isn't tracked). #75 keys
 * progress by course and exercise, and replaces this.
 */
export function exerciseCompletions(progress: Progress, course: string, exercise: string): ExerciseCompletion[] {
  if (course === "agent-setup") {
    return progress.completedLessons
      .filter((lesson) => lesson.slug === exercise)
      .map(({ completedAt, harness }) => ({ completedAt, harness }));
  }
  if (course === "workers-basics") {
    return progress.completedExercises
      .filter((completed) => completed.slug === exercise)
      .map(({ completedAt }) => ({ completedAt }));
  }
  return [];
}
