import type { APIRoute } from "astro";
import { courseMarkdownPath, coursePath, exerciseMarkdownPath, exercisePath } from "../../data/courses";
import { getBuiltInCourses } from "../../lib/courses";
import { type Course, courseSchema } from "../../schemas/course";

export const prerender = false;

/** Built-in courses in catalog order, each with its exercises in order. */
export const GET: APIRoute = async ({ url }) => {
  const absolute = (path: string) => new URL(path, url).toString();

  // Parsing strips what the API doesn't expose, like each content collection entry.
  const courses: Course[] = (await getBuiltInCourses()).map((course) =>
    courseSchema.parse({
      ...course,
      url: absolute(coursePath(course.name)),
      markdownUrl: absolute(courseMarkdownPath(course.name)),
      exercises: course.exercises.map((exercise) => ({
        ...exercise,
        url: absolute(exercisePath(course.name, exercise.slug)),
        markdownUrl: absolute(exerciseMarkdownPath(course.name, exercise.file)),
      })),
    }),
  );

  return new Response(JSON.stringify(courses), { headers: { "Content-Type": "application/json" } });
};
