import { REQUIRED_COURSE, TRACKS, type Track } from "../data/courses";
import type { Progress } from "../schemas/progress";
import { type CatalogCourse, type CourseGroup, groupByTrack, type StartedCourse, startedCourses } from "./course-progress";

/** What the enrolled homepage's "Up next" block shows. */
export type UpNext =
  | {
      kind: "exercise";
      courseTitle: string;
      exerciseTitle: string;
      /** Zero-based, like the exercise files: the interview is 0. */
      index: number;
      description?: string;
    }
  | {
      kind: "choose";
      /** Nothing but Agent setup is finished, so this is the fork after it. */
      justFinishedAgentSetup: boolean;
    };

export interface DashboardCourse {
  title: string;
  url: string;
  external: boolean;
  track?: Track;
  completedAt?: string;
  done: number;
  /** One per exercise, true once it has a completion. */
  segments: boolean[];
  /** The first exercise without a completion, if any. */
  next?: string;
}

export interface Dashboard {
  upNext: UpNext;
  /** Started courses, grouped like the sidebar (see groupByTrack). */
  courses: CourseGroup<DashboardCourse>[];
  /** Agents that completed at least one exercise, most exercises first. */
  agents: { harness: string; exercises: number }[];
  /** Agent setup's interview summary, once there is one. */
  aboutYou?: string;
  /** Where each non-empty track's "Start with ..." link goes: its first course the student hasn't finished. */
  trackStarts: Partial<Record<Track, { title: string; url: string }>>;
}

/**
 * Everything the enrolled homepage shows, from the student's progress. "Up
 * next" continues the most recently active unfinished course; with none,
 * it's Agent setup's first exercise until Agent setup is done, then a choice
 * between the tracks.
 */
export function buildDashboard(progress: Progress, catalog: readonly CatalogCourse[]): Dashboard {
  const started = startedCourses(progress, catalog);
  const completed = (name: string) => Boolean(progress.courses.find((course) => course.name === name)?.completedAt);

  return {
    upNext: upNext(started, catalog, progress),
    courses: groupByTrack(started.map(toDashboardCourse)),
    agents: agents(progress),
    aboutYou: progress.courses.find((course) => course.name === REQUIRED_COURSE)?.interviewSummary,
    trackStarts: Object.fromEntries(
      TRACKS.flatMap((track) => {
        const courses = catalog.filter((course) => course.track === track);
        const start = courses.find((course) => !completed(course.name)) ?? courses[0];
        return start ? [[track, { title: start.title, url: start.url }]] : [];
      }),
    ),
  };
}

function upNext(started: StartedCourse[], catalog: readonly CatalogCourse[], progress: Progress): UpNext {
  const inProgress = started.filter((course) => !course.completedAt && course.remaining > 0);
  const current = inProgress.reduce<StartedCourse | undefined>(
    (latest, course) => (!latest || lastActivity(course) > lastActivity(latest) ? course : latest),
    undefined,
  );
  if (current) return nextExercise(current.title, current.exercises);

  const setup = catalog.find((course) => course.name === REQUIRED_COURSE);
  const setupProgress = progress.courses.find((course) => course.name === REQUIRED_COURSE);
  if (setup && !setupProgress?.completedAt) {
    return nextExercise(
      setup.title,
      setup.exercises.map((exercise) => ({ ...exercise, completions: [] })),
    );
  }

  const othersCompleted =
    progress.courses.some((course) => course.name !== REQUIRED_COURSE && course.completedAt) ||
    progress.externalCourses.some((course) => course.completedAt);
  return { kind: "choose", justFinishedAgentSetup: !othersCompleted };
}

function nextExercise(courseTitle: string, exercises: StartedCourse["exercises"]): UpNext {
  const index = Math.max(
    exercises.findIndex((exercise) => exercise.completions.length === 0),
    0,
  );
  const exercise = exercises[index];
  return {
    kind: "exercise",
    courseTitle,
    exerciseTitle: exercise.title,
    index,
    ...(exercise.description ? { description: exercise.description } : {}),
  };
}

/** ISO timestamps sort as strings. "" for a course with an interview but no completions yet. */
function lastActivity(course: StartedCourse): string {
  return course.exercises
    .flatMap((exercise) => exercise.completions.map((completion) => completion.completedAt))
    .reduce((latest, at) => (at > latest ? at : latest), "");
}

function toDashboardCourse(course: StartedCourse): DashboardCourse {
  const segments = course.exercises.map((exercise) => exercise.completions.length > 0);
  const next = course.exercises.find((exercise) => exercise.completions.length === 0);
  return {
    title: course.title,
    url: course.url,
    external: course.external,
    ...(course.track ? { track: course.track } : {}),
    ...(course.completedAt ? { completedAt: course.completedAt } : {}),
    done: segments.filter(Boolean).length,
    segments,
    ...(next ? { next: next.title } : {}),
  };
}

function agents(progress: Progress): Dashboard["agents"] {
  const counts = new Map<string, number>();
  for (const course of [...progress.courses, ...progress.externalCourses]) {
    for (const exercise of course.exercises) {
      for (const completion of exercise.completions) {
        counts.set(completion.harness, (counts.get(completion.harness) ?? 0) + 1);
      }
    }
  }
  return [...counts]
    .map(([harness, exercises]) => ({ harness, exercises }))
    .sort((a, b) => b.exercises - a.exercises);
}
