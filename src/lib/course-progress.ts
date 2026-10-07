import type { ExerciseCompletion, Progress } from "../schemas/progress";

/** One exercise's completions, one per harness that completed it. Empty if it isn't complete. */
export function exerciseCompletions(progress: Progress, course: string, exercise: string): ExerciseCompletion[] {
  return (
    progress.courses.find((item) => item.name === course)?.exercises.find((item) => item.slug === exercise)
      ?.completions ?? []
  );
}
