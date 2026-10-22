import type { APIRoute } from "astro";
import spec from "@agentschools/course-spec/SPEC.md?raw";

// The COURSE.md format (https://github.com/agentschools/course-spec), at the
// version pinned in package.json, so agents read the rules this site applies.
export const prerender = true;

export const GET: APIRoute = () => new Response(spec, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
