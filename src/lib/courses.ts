import { type CollectionEntry, getCollection } from "astro:content";
import { COURSE_ORDER, coursePath, exercisePath, REQUIRED_COURSE, type Track } from "../data/courses";
import type { CourseFrontmatter } from "../schemas/course";
import type { CatalogCourse } from "./course-progress";
import {
  compareExerciseFilenames,
  exerciseSlugFromFilename,
  INTERVIEW_SLUG,
  titleFromMarkdown,
  withInterviewFirst,
} from "./course-format";

export interface BuiltInExercise {
  slug: string;
  title: string;
  description?: string;
  /** Filename in the course's exercises/ directory, as served raw. "interview.md" for an implicit interview. */
  file: string;
  entry: CollectionEntry<"exercises"> | CollectionEntry<"defaultInterview">;
}

export interface BuiltInCourse extends CourseFrontmatter {
  title: string;
  /** The track directory the course is in, if any (see TRACKS in src/data/courses.ts). */
  track?: Track;
  entry: CollectionEntry<"courses">;
  exercises: BuiltInExercise[];
}

/**
 * The built-in courses from `courses/`, in catalog order (src/data/courses.ts),
 * each with its exercises in order: sorted by filename, interview first, and
 * the default interview added when a course doesn't have one (see #73).
 */
export async function getBuiltInCourses(): Promise<BuiltInCourse[]> {
  const [courseEntries, exerciseEntries, [defaultInterview]] = await Promise.all([
    getCollection("courses"),
    getCollection("exercises"),
    getCollection("defaultInterview"),
  ]);

  return COURSE_ORDER.map((name) => {
    const entry = courseEntries.find((course) => course.id === name);
    if (!entry) throw new Error(`src/data/courses.ts lists "${name}", but there's no COURSE.md for it in courses/ or a track directory`);

    const files = exerciseEntries
      .filter((exercise) => exercise.id.startsWith(`${name}/`))
      .map((exercise) => ({ file: `${exercise.id.slice(name.length + 1)}.md`, entry: exercise }))
      .sort((a, b) => compareExerciseFilenames(a.file, b.file));

    const exercises = withInterviewFirst(
      files.map(({ file, entry }) => toExercise(exerciseSlugFromFilename(file), file, entry)),
      () => toExercise(INTERVIEW_SLUG, `${INTERVIEW_SLUG}.md`, defaultInterview),
    );

    const track = trackFromPath(entry.filePath);
    return {
      ...entry.data,
      title: titleFromMarkdown(entry.body ?? "") ?? name,
      ...(track ? { track } : {}),
      entry,
      exercises,
    };
  });
}

/** The built-in courses as client code needs them to show a student's progress (see src/lib/course-progress.ts). */
export function catalogCourses(courses: readonly BuiltInCourse[]): CatalogCourse[] {
  return courses.map((course) => ({
    name: course.name,
    title: course.title,
    url: coursePath(course.name),
    ...(course.track ? { track: course.track } : {}),
    exercises: course.exercises.map((exercise) => ({
      slug: exercise.slug,
      title: exercise.title,
      url: exercisePath(course.name, exercise.slug),
      ...(exercise.description ? { description: exercise.description } : {}),
    })),
  }));
}

export interface NextStep {
  url: string;
  label: string;
  shortLabel: string;
}

/**
 * Where an exercise page's "next" button points once the exercise at
 * `index` is complete: the next exercise in its course, then the next course
 * in the same track, then the course catalog, where a student finishing
 * Agent setup picks a track.
 */
export function nextStep(courses: readonly BuiltInCourse[], course: BuiltInCourse, index: number): NextStep {
  const nextExercise = course.exercises[index + 1];
  if (nextExercise) {
    return {
      url: exercisePath(course.name, nextExercise.slug),
      label: `Next exercise: ${nextExercise.title} →`,
      shortLabel: `Next: ${nextExercise.title} →`,
    };
  }
  const nextCourse = course.track
    ? courses.slice(courses.indexOf(course) + 1).find((item) => item.track === course.track)
    : undefined;
  if (nextCourse) {
    return {
      url: coursePath(nextCourse.name),
      label: `Next course: ${nextCourse.title} →`,
      shortLabel: `Next: ${nextCourse.title} →`,
    };
  }
  if (course.name === REQUIRED_COURSE) {
    return { url: "/courses", label: "Next: pick a project or the fundamentals →", shortLabel: "Next: choose a course →" };
  }
  return { url: "/courses", label: "All courses →", shortLabel: "All courses →" };
}

export async function getBuiltInCourse(name: string): Promise<BuiltInCourse | undefined> {
  return (await getBuiltInCourses()).find((course) => course.name === name);
}

/** "courses/fundamentals/bindings/COURSE.md" is in "fundamentals"; "courses/agent-setup/COURSE.md" has no track. */
function trackFromPath(filePath: string | undefined): Track | undefined {
  const dirs = filePath?.split("/") ?? [];
  return dirs.length === 4 ? (dirs[1] as Track) : undefined;
}

function toExercise(slug: string, file: string, entry: BuiltInExercise["entry"]): BuiltInExercise {
  return {
    slug,
    title: titleFromMarkdown(entry.body ?? "") ?? slug,
    ...(entry.data.description ? { description: entry.data.description } : {}),
    file,
    entry,
  };
}
