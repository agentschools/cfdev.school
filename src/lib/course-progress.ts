import { TRACK_LABELS, TRACKS, type Track } from "../data/courses";
import type { ExerciseCompletion, Progress } from "../schemas/progress";

/** One exercise's completions, one per harness that completed it. Empty if it isn't complete. */
export function exerciseCompletions(progress: Progress, course: string, exercise: string): ExerciseCompletion[] {
  return (
    progress.courses.find((item) => item.name === course)?.exercises.find((item) => item.slug === exercise)
      ?.completions ?? []
  );
}

/** Whether any of a built-in course's exercises has a completion, from any agent. */
export function hasCompletions(progress: Progress, course: string): boolean {
  return (
    progress.courses
      .find((item) => item.name === course)
      ?.exercises.some((exercise) => exercise.completions.length > 0) ?? false
  );
}

/** What client code needs to know about a built-in course to show a student's progress through it. */
export interface CatalogCourse {
  name: string;
  title: string;
  url: string;
  track?: Track;
  exercises: { slug: string; title: string; url: string; description?: string }[];
}

export interface StartedCourse {
  title: string;
  /** The course's page here, or where it's hosted for a course hosted elsewhere. */
  url: string;
  external: boolean;
  /** The built-in course's track, if it has one. */
  track?: Track;
  completedAt?: string;
  exercises: { title: string; url: string; description?: string; completions: ExerciseCompletion[] }[];
  /** How many exercises have no completion. On a completed course, they were added since the student finished it. */
  remaining: number;
}

/**
 * Every course the student has started, built-in courses first in catalog
 * order, then the ones their agent reported (see #78). A built-in course
 * counts as started once it has an interview or any completion; a reported
 * course counts as soon as it's reported.
 */
export function startedCourses(progress: Progress, catalog: readonly CatalogCourse[]): StartedCourse[] {
  const builtIn = progress.courses.flatMap((course) => {
    const entry = catalog.find((item) => item.name === course.name);
    const started = course.interviewSummary || course.exercises.some((exercise) => exercise.completions.length > 0);
    if (!entry || !started) return [];
    return [
      withRemaining({
        title: entry.title,
        url: entry.url,
        external: false,
        ...(entry.track ? { track: entry.track } : {}),
        completedAt: course.completedAt,
        exercises: course.exercises.map((exercise) => {
          const catalogExercise = entry.exercises.find((item) => item.slug === exercise.slug);
          return {
            title: catalogExercise?.title ?? exercise.slug,
            url: catalogExercise?.url ?? entry.url,
            ...(catalogExercise?.description ? { description: catalogExercise.description } : {}),
            completions: exercise.completions,
          };
        }),
      }),
    ];
  });

  const external = progress.externalCourses.map((course) =>
    withRemaining({
      title: course.title,
      url: course.url,
      external: true,
      completedAt: course.completedAt,
      exercises: course.exercises.map(({ title, url, completions }) => ({ title, url, completions })),
    }),
  );

  return [...builtIn, ...external];
}

function withRemaining(course: Omit<StartedCourse, "remaining">): StartedCourse {
  return { ...course, remaining: course.exercises.filter((exercise) => exercise.completions.length === 0).length };
}

export interface CourseGroup<T> {
  id: "start" | Track | "elsewhere";
  /** None for the courses outside any track, like Agent setup, which come first. */
  title?: string;
  courses: T[];
}

/**
 * Started courses grouped the way the sidebar and /courses show them: built-in
 * courses outside any track first (Agent setup), then each track in TRACKS
 * order, then courses hosted elsewhere. Empty groups are left out.
 */
export function groupByTrack<T extends Pick<StartedCourse, "track" | "external">>(courses: readonly T[]): CourseGroup<T>[] {
  const groups: CourseGroup<T>[] = [
    { id: "start", courses: courses.filter((course) => !course.external && !course.track) },
    ...TRACKS.map((track) => ({
      id: track,
      title: TRACK_LABELS[track].title,
      courses: courses.filter((course) => course.track === track),
    })),
    { id: "elsewhere", title: "Hosted elsewhere", courses: courses.filter((course) => course.external) },
  ];
  return groups.filter((group) => group.courses.length > 0);
}
