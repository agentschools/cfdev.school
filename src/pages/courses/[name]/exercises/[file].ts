import type { APIRoute, GetStaticPaths } from "astro";
import { rawCourses } from "../../../../lib/course-files";

// Raw exercise files for each built-in course, exactly as they are in the
// repo, plus the default interview for courses without one.
export const prerender = true;

export const getStaticPaths = (() =>
  rawCourses().flatMap((course) =>
    Object.entries(course.exercises).map(([file, markdown]) => ({
      params: { name: course.name, file },
      props: { markdown },
    })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.markdown as string, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
