import type { APIRoute } from "astro";

export const prerender = true;

// Closely follows opencodeschool/opencode.school's llms.txt format and tone
// (https://opencode.school/llms.txt), per plan.agent.md's instruction to
// copy OpenCode School's structure wholesale. API paths are relative to
// whatever origin this file was fetched from (production, a PR preview, or
// local dev all serve different origins), so don't hardcode a domain here.
const body = `# Cloudflare Dev School

Cloudflare Dev School is an interactive course that teaches people how to build on Cloudflare using whatever AI coding agent they already have installed.

Students enroll on the homepage, get a student ID (format: adjective-noun-1234, e.g. "curious-hacker-2019"), then pick their agent harness and get a prompt to paste into it. If you're reading this file because a student pasted that prompt, their student ID was included in it, use it, don't ask them to enroll again. The prompt also told you which harness the student picked, that's your harness id for the lesson endpoints below: \`claude-code\`, \`codex\`, \`opencode\`, \`pi\`, or \`generic\` if none of those match what you are.

## API

Download the OpenAPI schema to see the full, current API surface: GET /api/openapi.json (relative to this site's origin).

Currently available:

- POST /api/students: enrolls a new student. No request body. Returns \`{ "id": "...", "createdAt": "..." }\`. Only call this if you don't already have a student ID from the prompt that referred you here.
- GET /api/students/{id}/interview: fetch a student's interview answers. 404 if they haven't been interviewed yet.
- PUT /api/students/{id}/interview: submit or update a student's interview answers. Send only the fields you're setting, it's a partial update and safe to call more than once (e.g. once per question, or later just to change \`quizOptIn\`).
- GET /api/lessons/{slug}?harness={harnessId}: fetch a lesson's content and \`agentInstructions\` for your harness. Falls back to the \`generic\` variant if your harness has no dedicated content.
- GET /api/exercises: list all exercises (content + agentInstructions).
- GET /api/exercises/{slug}: fetch a single exercise by slug.
- GET /api/progress/{studentId}: fetch which exercises and lessons the student has completed.
- PUT /api/progress/{studentId}: mark an exercise or lesson complete. Send exactly one of \`{ "exerciseSlug": "deploy-first-worker" }\` or \`{ "lessonSlug": "models" }\`. Exercises may also include \`deployedUrl\` (the public URL you verified); either may include \`model\` (your current model ID, e.g. \`anthropic/claude-sonnet-4-5\`). Idempotent upsert.

## Interview

Right after a student gives you their student ID (from the handoff prompt), conduct a short interview before anything else:

1. Ask about their technical background (\`technicalBackground\`: "beginner", "intermediate", or "advanced").
2. Ask how familiar they are with Cloudflare (\`cloudflareFamiliarity\`: "new", "some-experience", or "regular-user"). Use this only to adjust your tone and depth of explanation later, never to skip lessons or change what content you show, that isn't supported in v1.
3. Ask what they want to get out of the course (\`learningGoals\`, free text).
4. Auto-detect their OS yourself (e.g. inspect \`uname\` or an OS environment variable), don't ask them. Send it as \`os\`: "macos", "linux", "windows", or "other".
5. Ask if they want to be quizzed at the end of each lesson (\`quizOptIn\`, boolean). Recommend trying it, but make clear they can skip any individual quiz or turn it off entirely at any time, it's just a preference, not a commitment.

Submit each answer via PUT /api/students/{id}/interview as you get it, or batch them into one call at the end, either works. If a returning student already has interview answers (check with GET first), don't re-ask questions they've already answered, just confirm nothing's changed.

## Lessons

After the interview, check GET /api/progress/{studentId} to see what's already done, then work through incomplete lessons in order: "models", then "instructions" (more lessons are coming).

For each lesson: fetch GET /api/lessons/{slug}?harness={yourHarnessId}, follow its \`agentInstructions\` to teach the material conversationally, then, once you're confident the student understood it (via the quiz if they opted in, or just conversationally if not), mark it complete with PUT /api/progress/{studentId} using \`{ "lessonSlug": "..." }\` before moving on. Always include \`model\` in that request.

Don't invent lesson content that isn't in \`agentInstructions\`, and don't invent lesson slugs or endpoints that aren't listed above.

## Exercise 1: Deploy your first Worker

Once all available lessons are complete, the hands-on exercises are available. Fetch this one with GET /api/exercises/deploy-first-worker (or list all via GET /api/exercises) and follow its \`content\` and \`agentInstructions\`.

Summary of what you must do:

1. Guide the student to create a minimal Worker that returns a plain-text response. No frameworks, databases, or custom domains.
2. Run it locally (\`wrangler dev\` / \`npx wrangler dev\`) and confirm the expected text.
3. Deploy with their existing Wrangler auth (\`wrangler deploy\` / \`npx wrangler deploy\`). If they aren't logged in yet, help them authenticate first.
4. Visit the public URL Wrangler prints.
5. **Verify yourself:** fetch the deployed URL and confirm the response body matches the expected text. Do not mark the exercise complete until you have checked this.
6. Only then PUT /api/progress/{studentId} with \`{ "exerciseSlug": "deploy-first-worker" }\`. Optionally send \`deployedUrl\` and \`model\`.
7. Encourage them to change the response text, redeploy, and hit the URL again.

Check GET /api/progress/{studentId} first if they might already have completed it.

## Exercise 2: Add your first Binding: Workers KV

Once exercise 1 is complete, fetch this one with GET /api/exercises/add-first-binding-kv and follow its \`content\` and \`agentInstructions\`. It extends the same Worker from exercise 1, it doesn't start a new project.

Summary of what you must do:

1. Create a Workers KV namespace (\`wrangler kv namespace create <name>\`) and bind it to the existing Worker in \`wrangler.jsonc\`/\`wrangler.toml\`.
2. Extend the Worker's \`fetch\` handler to write a value to KV and read it back through the binding.
3. Run it locally, then deploy.
4. **Verify yourself with a two-step round trip:** against the deployed URL, write a value, then in a *separate* follow-up request read it back and confirm it matches. This proves the binding persists data, not just that a single request echoes something back.
5. Only then PUT /api/progress/{studentId} with \`{ "exerciseSlug": "add-first-binding-kv" }\`. Optionally send \`deployedUrl\` and \`model\`.
6. Encourage them to write a few more keys and read them back to build intuition for the binding.

Check GET /api/progress/{studentId} first if they might already have completed it.

## Status

Cloudflare Dev School is under active development. Two lessons ("models", "instructions") and two exercises (Deploy your first Worker, then Add your first Binding: Workers KV) are available. Quiz scoring is not available yet — quizzes are conversational only. Don't invent lesson, exercise, or quiz endpoints that aren't listed above.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
