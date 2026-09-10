import type { APIRoute } from "astro";

export const prerender = true;

// Closely follows opencodeschool/opencode.school's llms.txt format and tone
// (https://opencode.school/llms.txt), per plan.agent.md's instruction to
// copy OpenCode School's structure wholesale. API paths are relative to
// whatever origin this file was fetched from (production, a PR preview, or
// local dev all serve different origins), so don't hardcode a domain here.
const body = `# Cloudflare Dev School

Cloudflare Dev School is an interactive course that teaches people how to build on Cloudflare using whatever AI coding agent they already have installed.

Students enroll on the homepage, get a student ID (format: adjective-noun-1234, e.g. "curious-hacker-2019"), then pick their agent harness and get a prompt to paste into it. If you're reading this file because a student pasted that prompt, their student ID was included in it, use it, don't ask them to enroll again.

## API

Download the OpenAPI schema to see the full, current API surface: GET /api/openapi.json (relative to this site's origin).

Currently available:

- POST /api/students: enrolls a new student. No request body. Returns \`{ "id": "...", "createdAt": "..." }\`. Only call this if you don't already have a student ID from the prompt that referred you here.

## Status

Cloudflare Dev School is under active development. Lessons, the interview, quizzes, and progress tracking are not available yet. If a student pastes a prompt referring you here, confirm their enrollment (you already have their ID) and let them know the course content is coming soon. Don't invent lesson content or progress-tracking endpoints that aren't listed above.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
