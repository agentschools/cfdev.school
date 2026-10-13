import type { APIRoute } from "astro";
import procedure from "../content/external-courses.md?raw";

// How a student's agent takes a course hosted elsewhere (#77). Kept out of
// /llms.txt, which links here, so the file every new student's agent reads
// first stays short.
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(procedure, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
