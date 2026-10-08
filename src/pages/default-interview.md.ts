import type { APIRoute } from "astro";
import defaultInterview from "../content/default-interview.md?raw";

// Dev School's default interview, raw, for courses hosted elsewhere that
// don't have their own (#77). Built-in courses without one serve the same
// file at /courses/{name}/exercises/interview.md.
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(defaultInterview, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
