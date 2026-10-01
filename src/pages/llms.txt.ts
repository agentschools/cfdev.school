import type { APIRoute } from "astro";

export const prerender = true;

// Closely follows opencodeschool/opencode.school's llms.txt format and tone
// (https://opencode.school/llms.txt), per plan.agent.md's instruction to
// copy OpenCode School's structure wholesale. API paths are relative to
// whatever origin this file was fetched from (production, a PR preview, or
// local dev all serve different origins), so don't hardcode a domain here.
const body = `# Cloudflare Dev School

Cloudflare Dev School is an interactive course that teaches people how to build on Cloudflare using whatever AI coding agent they already have installed.

Students enroll on the homepage, get a student ID (format: adjective-noun-1234, e.g. "curious-hacker-2019"), and get a prompt to paste into their agent, whatever it is. If you're reading this file because a student pasted that prompt, their student ID was included in it, use it, don't ask them to enroll again. The prompt doesn't tell you which harness you are, that's on you: figure out your own harness id from \`claude-code\`, \`codex\`, \`opencode\`, \`pi\`, \`cursor\`, or \`copilot\`, or \`generic\` if none of those match, and use it for the lesson endpoints below.

## Cloudflare CLI: use cf, not Wrangler

This course uses \`cf\`, Cloudflare's new CLI (open beta since September 2026), for everything: \`cf init\`, \`cf dev\`, \`cf deploy\`, \`cf auth login\`, \`cf kv ...\`. Wrangler was Cloudflare's CLI for years, so your training data almost certainly knows Wrangler and not \`cf\`. Don't fall back to Wrangler commands (\`wrangler ...\` or \`npx wrangler ...\`) out of habit. \`cf\` commands differ from Wrangler's, so check \`cf --help\` or \`cf cli search "<what you want to do>"\` instead of guessing. The "cli" lesson installs it and adds these instructions to the student's global agent instructions file.

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

After the interview, check GET /api/progress/{studentId} to see what's already done, then work through incomplete lessons in order: "models", then "instructions", then "cli", then "skills", then "tools".

For each lesson: fetch GET /api/lessons/{slug}?harness={yourHarnessId}, follow its \`agentInstructions\` to teach the material conversationally, then, once you're confident the student understood it (via the quiz if they opted in, or just conversationally if not), mark it complete with PUT /api/progress/{studentId} using \`{ "lessonSlug": "..." }\` before moving on. Always include \`model\` in that request.

Don't invent lesson content that isn't in \`agentInstructions\`, and don't invent lesson slugs or endpoints that aren't listed above.

## Exercise 1: Deploy your first Worker

Once all available lessons are complete, the hands-on exercises are available. Fetch this one with GET /api/exercises/deploy-first-worker (or list all via GET /api/exercises) and follow its \`content\` and \`agentInstructions\`.

Summary of what you must do:

1. Guide the student to create a minimal Worker that returns a plain-text response (scaffold with \`cf init <directory>\`). No frameworks, databases, or custom domains.
2. Run it locally (\`cf dev\`) and confirm the expected text.
3. Deploy with their existing \`cf\` auth from the CLI lesson (\`cf deploy\`). If they aren't logged in yet (\`cf auth whoami\`), help them run \`cf auth login\` first.
4. Visit the public URL \`cf deploy\` prints.
5. **Verify yourself:** fetch the deployed URL and confirm the response body matches the expected text. Do not mark the exercise complete until you have checked this.
6. Only then PUT /api/progress/{studentId} with \`{ "exerciseSlug": "deploy-first-worker" }\`. Optionally send \`deployedUrl\` and \`model\`.
7. Encourage them to change the response text, redeploy, and hit the URL again.

Teach lightly: briefly explain each new concept (Worker, fetch handler, deploying, workers.dev URL) with depth adapted to their interview answers, and before marking complete ask them to explain what happens when someone visits their URL. Verification is still the gate.

Check GET /api/progress/{studentId} first if they might already have completed it.

## Exercise 2: Add your first Binding: Workers KV

Once exercise 1 is complete, fetch this one with GET /api/exercises/add-first-binding-kv and follow its \`content\` and \`agentInstructions\`. It extends the same Worker from exercise 1, it doesn't start a new project.

Summary of what you must do:

1. Create a Workers KV namespace (\`cf kv namespaces create --title <name>\`) and bind it to the existing Worker in \`cloudflare.config.ts\` (\`KV: bindings.kv({ id })\`).
2. Extend the Worker's \`fetch\` handler to write a value to KV and read it back through the binding.
3. Run it locally, then deploy.
4. **Verify yourself with a two-step round trip:** against the deployed URL, write a value, then in a *separate* follow-up request read it back and confirm it matches. This proves the binding persists data, not just that a single request echoes something back.
5. Only then PUT /api/progress/{studentId} with \`{ "exerciseSlug": "add-first-binding-kv" }\`. Optionally send \`deployedUrl\` and \`model\`.
6. Encourage them to write a few more keys and read them back to build intuition for the binding.

Teach lightly: briefly explain each new concept (KV namespace, binding, env) with depth adapted to their interview answers, tell them why the two-step round trip proves persistence, and before marking complete ask them to explain what a binding is. Verification is still the gate.

Check GET /api/progress/{studentId} first if they might already have completed it.

## Status

Cloudflare Dev School is under active development. Five lessons ("models", "instructions", "cli", "skills", "tools") and two exercises (Deploy your first Worker, then Add your first Binding: Workers KV) are available. Quiz scoring is not available yet — quizzes are conversational only. Don't invent lesson, exercise, or quiz endpoints that aren't listed above.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
