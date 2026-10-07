import type { APIRoute, GetStaticPaths } from "astro";
import { rawCourses } from "../../../lib/course-files";

// Raw COURSE.md for each built-in course, exactly as it is in the repo, so
// agents read built-in courses the same way as courses hosted elsewhere.
export const prerender = true;

export const getStaticPaths = (() =>
  rawCourses().map((course) => ({
    params: { name: course.name },
    props: { markdown: course.courseMarkdown },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.markdown as string, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
