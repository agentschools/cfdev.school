import { env } from "cloudflare:workers";
import { exercisePath } from "../data/courses";
import { type ExternalCourse, externalCourseSchema } from "../schemas/course";
import { normalizeCourseUrl } from "./course-url";
import type { BuiltInCourse } from "./courses";

// Server-side reads of courses hosted outside this site (#77), as each
// student's agent reported them, and lookups of the course a request names.

interface ExternalCourseRow {
  course_id: string;
  title: string;
  description: string | null;
  author: string | null;
  /** JSON array of { slug, title, url }. */
  exercises: string;
  updated_at: string;
}

function rowToCourse(row: ExternalCourseRow): ExternalCourse {
  return externalCourseSchema.parse({
    url: row.course_id,
    title: row.title,
    ...(row.description ? { description: row.description } : {}),
    ...(row.author ? { author: row.author } : {}),
    exercises: JSON.parse(row.exercises),
    updatedAt: row.updated_at,
  });
}

/** The student's reported courses, oldest first. */
export async function loadExternalCourses(studentId: string): Promise<ExternalCourse[]> {
  const { results } = await env.DB.prepare("SELECT * FROM external_courses WHERE student_id = ? ORDER BY created_at ASC")
    .bind(studentId)
    .all<ExternalCourseRow>();
  return results.map(rowToCourse);
}

export interface ResolvedCourse {
  /** The course's ID: a built-in course's name, or a reported course's normalized URL. */
  id: string;
  /** In order. Built-in exercise URLs are paths, for the caller to resolve against the request's origin. */
  exercises: { slug: string; url: string }[];
}

/** The course a request names, built-in or reported by the student's agent, or null if there's no such course. */
export async function resolveCourse(
  studentId: string,
  course: string,
  builtIns: BuiltInCourse[],
): Promise<ResolvedCourse | null> {
  const builtIn = builtIns.find((item) => item.name === course);
  if (builtIn) {
    return {
      id: builtIn.name,
      exercises: builtIn.exercises.map((exercise) => ({ slug: exercise.slug, url: exercisePath(builtIn.name, exercise.slug) })),
    };
  }

  const id = normalizeCourseUrl(course);
  if (!id) return null;
  const row = await env.DB.prepare("SELECT * FROM external_courses WHERE student_id = ? AND course_id = ?")
    .bind(studentId, id)
    .first<ExternalCourseRow>();
  return row ? { id, exercises: rowToCourse(row).exercises } : null;
}
