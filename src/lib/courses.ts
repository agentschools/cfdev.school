import { type CollectionEntry, getCollection } from "astro:content";
import { COURSE_ORDER, coursePath, exercisePath } from "../data/courses";
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
    if (!entry) throw new Error(`src/data/courses.ts lists "${name}", but courses/${name}/COURSE.md doesn't exist`);

    const files = exerciseEntries
      .filter((exercise) => exercise.id.startsWith(`${name}/`))
      .map((exercise) => ({ file: `${exercise.id.slice(name.length + 1)}.md`, entry: exercise }))
      .sort((a, b) => compareExerciseFilenames(a.file, b.file));

    const exercises = withInterviewFirst(
      files.map(({ file, entry }) => toExercise(exerciseSlugFromFilename(file), file, entry)),
      () => toExercise(INTERVIEW_SLUG, `${INTERVIEW_SLUG}.md`, defaultInterview),
    );

    return {
      ...entry.data,
      title: titleFromMarkdown(entry.body ?? "") ?? name,
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
    exercises: course.exercises.map((exercise) => ({
      slug: exercise.slug,
      title: exercise.title,
      url: exercisePath(course.name, exercise.slug),
    })),
  }));
}

export async function getBuiltInCourse(name: string): Promise<BuiltInCourse | undefined> {
  return (await getBuiltInCourses()).find((course) => course.name === name);
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
