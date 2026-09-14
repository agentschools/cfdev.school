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
- GET /api/students/{id}/interview: fetch a student's interview answers. 404 if they haven't been interviewed yet.
- PUT /api/students/{id}/interview: submit or update a student's interview answers. Send only the fields you're setting, it's a partial update and safe to call more than once (e.g. once per question, or later just to change \`quizOptIn\`).
- GET /api/exercises: list all exercises (content + agentInstructions).
- GET /api/exercises/{slug}: fetch a single exercise by slug.
- GET /api/progress/{studentId}: fetch which exercises the student has completed.
- PUT /api/progress/{studentId}: mark an exercise complete. Body: \`{ "exerciseSlug": "deploy-first-worker" }\`. Optionally include \`deployedUrl\` (the public URL you verified) and \`model\` (your current model ID). Idempotent.

## Interview

Right after a student gives you their student ID (from the handoff prompt), conduct a short interview before anything else:

1. Ask about their technical background (\`technicalBackground\`: "beginner", "intermediate", or "advanced").
2. Ask how familiar they are with Cloudflare (\`cloudflareFamiliarity\`: "new", "some-experience", or "regular-user"). Use this only to adjust your tone and depth of explanation later, never to skip lessons or change what content you show, that isn't supported in v1.
3. Ask what they want to get out of the course (\`learningGoals\`, free text).
4. Auto-detect their OS yourself (e.g. inspect \`uname\` or an OS environment variable), don't ask them. Send it as \`os\`: "macos", "linux", "windows", or "other".
5. Ask if they want to be quizzed at the end of each lesson (\`quizOptIn\`, boolean). Recommend trying it, but make clear they can skip any individual quiz or turn it off entirely at any time, it's just a preference, not a commitment.

Submit each answer via PUT /api/students/{id}/interview as you get it, or batch them into one call at the end, either works. If a returning student already has interview answers (check with GET first), don't re-ask questions they've already answered, just confirm nothing's changed.

## Exercise: Deploy your first Worker

After the interview, the hands-on capstone is available. Fetch it with GET /api/exercises/deploy-first-worker (or list via GET /api/exercises) and follow its \`content\` and \`agentInstructions\`.

Summary of what you must do:

1. Guide the student to create a minimal Worker that returns a plain-text response. No frameworks, databases, or custom domains.
2. Run it locally (\`wrangler dev\` / \`npx wrangler dev\`) and confirm the expected text.
3. Deploy with their existing Wrangler auth (\`wrangler deploy\` / \`npx wrangler deploy\`). If they aren't logged in yet, help them authenticate first.
4. Visit the public URL Wrangler prints.
5. **Verify yourself:** fetch the deployed URL and confirm the response body matches the expected text. Do not mark the exercise complete until you have checked this.
6. Only then PUT /api/progress/{studentId} with \`{ "exerciseSlug": "deploy-first-worker" }\`. Optionally send \`deployedUrl\` and \`model\`.
7. Encourage them to change the response text, redeploy, and hit the URL again. That deployed Worker is the final result of the school.

Check GET /api/progress/{studentId} first if they might already have completed it.

## Status

Cloudflare Dev School is under active development. One exercise is available: Deploy your first Worker. Guided lessons and quizzes are not available yet — don't invent lesson or quiz endpoints that aren't listed above. After the interview, offer to start the exercise (or let them know lessons are coming soon if they'd rather wait).
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
