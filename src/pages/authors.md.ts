import type { APIRoute } from "astro";
import guide from "../content/authors.md?raw";

// The guide for course authors' agents (#79), exactly as it is in the repo:
// its agent-instructions frontmatter is the procedure, its body the format.
// /authors renders the same body for people.
export const prerender = true;

export const GET: APIRoute = () => new Response(guide, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
