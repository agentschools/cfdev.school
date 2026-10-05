import type { APIRoute } from "astro";

export const prerender = true;

// Closely follows opencodeschool/opencode.school's llms.txt format and tone
// (https://opencode.school/llms.txt), per plan.agent.md's instruction to
// copy OpenCode School's structure wholesale. API paths are relative to
// whatever origin this file was fetched from (production, a PR preview, or
// local dev all serve different origins), so don't hardcode a domain here.
const body = `# Cloudflare Dev School

Cloudflare Dev School is an interactive course that teaches people how to build on Cloudflare using whatever AI coding agent they already have installed.

Students enroll on the homepage, get a student ID (format: adjective-noun-1234, e.g. "curious-hacker-2019"), and get a prompt to paste into their agent, whatever it is. If you're reading this file because a student pasted that prompt, their student ID was included in it, use it, don't ask them to enroll again. The prompt doesn't tell you which harness you are, that's on you: figure out your own harness id from \`claude-code\`, \`codex\`, \`opencode\`, \`pi\`, \`cursor\`, or \`copilot\`, or \`generic\` if none of those match. You'll need it to fetch your harness profile and to mark lessons complete (see below).

## Cloudflare CLI: use cf, not Wrangler

This course uses \`cf\`, Cloudflare's new CLI (open beta since September 2026), for everything: \`cf init\`, \`cf dev\`, \`cf deploy\`, \`cf auth login\`, \`cf kv ...\`. Wrangler was Cloudflare's CLI for years, so your training data almost certainly knows Wrangler and not \`cf\`. Don't fall back to Wrangler commands (\`wrangler ...\` or \`npx wrangler ...\`) out of habit. \`cf\` commands differ from Wrangler's, so check \`cf --help\` or \`cf cli search "<what you want to do>"\` instead of guessing. The "cli" lesson installs it and adds these instructions to the student's global agent instructions file.

## API

Download the OpenAPI schema to see the full, current API surface: GET /api/openapi.json (relative to this site's origin).

Currently available:

- POST /api/students: enrolls a new student. No request body. Returns \`{ "id": "...", "createdAt": "..." }\`. Only call this if you don't already have a student ID from the prompt that referred you here.
- GET /api/students/{id}/interview: fetch a student's interview answers. 404 if they haven't been interviewed yet.
- PUT /api/students/{id}/interview: submit or update a student's interview answers. Send only the fields you're setting, it's a partial update and safe to call more than once (e.g. once per question, or later just to change \`quizOptIn\`).
- GET /api/harnesses/{harnessId}: fetch researched facts about your own harness: global instructions file location, how to add an MCP server, where skills install and whether they need a restart, subscription billing policy, and models. Each profile has a \`lastVerified\` date and \`sources\`.
- GET /api/lessons/{slug}: fetch a lesson's content and \`agentInstructions\`. Lessons are written for any agent.
- GET /api/exercises: list all exercises (content + agentInstructions).
- GET /api/exercises/{slug}: fetch a single exercise by slug.
- GET /api/progress/{studentId}: fetch which exercises and lessons the student has completed.
- PUT /api/progress/{studentId}: mark an exercise or lesson complete. Send exactly one of \`{ "exerciseSlug": "deploy-first-worker" }\` or \`{ "lessonSlug": "models", "harness": "claude-code" }\`. Lessons require \`harness\`, your harness id: lesson completions are tracked per agent, since lessons set up agent-specific files, so a student can complete the same lesson once with each agent they use. Exercises may also include \`deployedUrl\` (the public URL you verified); either may include \`model\` (your current model ID, e.g. \`anthropic/claude-sonnet-4-5\`). The "interview" lesson also takes \`summary\`: one sentence (max 280 characters), addressed to the student, summarizing their saved answers; it's shown on their homepage. Other lessons don't need one. Idempotent upsert (per lesson and harness for lessons), and a later PUT without \`summary\` keeps the previous one.

## Your harness

Before the first lesson, fetch GET /api/harnesses/{yourHarnessId} once and use it whenever a lesson needs something specific to your harness (a file path, a command, a restart). Your training data may predate the current version of your harness, so prefer this profile over memory. The profile can go stale too: before running a command from it, check it against your harness's own CLI help (e.g. \`claude mcp --help\`) or official docs, and if they disagree, go with the CLI or docs and tell the student. If your harness is \`generic\`, use your harness's own docs instead.

## Lessons

Once a student gives you their student ID (from the handoff prompt), check GET /api/progress/{studentId} to see what's already done, then work through incomplete lessons in order: "interview", then "models", then "instructions", then "cli", then "skills", then "tools". If the prompt names a specific lesson, start there instead.

The "interview" lesson always comes first for a new student: it asks a few short questions, all at once, about their AI agent experience, platforms they've deployed to before, learning goals, and quiz preference, auto-detects their OS, and stores the answers via PUT /api/students/{id}/interview. Use those answers (GET /api/students/{id}/interview) to adjust tone and depth in every later lesson and exercise, and only quiz the student if \`quizOptIn\` is true. Students can change any answer at any time just by telling you (e.g. "turn off quizzes"): when they do, PUT just that field, then PUT the "interview" lesson completion again (with your \`harness\`) and an updated \`summary\` so the student's homepage shows the change, and adjust from then on.

For each lesson: fetch GET /api/lessons/{slug}, follow its \`agentInstructions\` to teach the material conversationally, then, once you're confident the student understood it (via the quiz if they opted in, or just conversationally if not), mark it complete with PUT /api/progress/{studentId} using \`{ "lessonSlug": "...", "harness": "..." }\` before moving on. Always include \`model\` in that request too.

If the student asks to redo a lesson they've already completed (the prompt says so, e.g. because they're trying the course with a second agent), go through it fully again rather than skipping it, then PUT its completion with your own \`harness\`. The student's lesson page lists each agent they completed it with.

Don't invent lesson content that isn't in \`agentInstructions\`, and don't invent lesson slugs or endpoints that aren't listed above.

## Exercises

Once all available lessons are complete, the hands-on exercises are available. GET /api/exercises lists them in order (by \`order\`). Work through them in order, and check GET /api/progress/{studentId} first to see which are already done. If the prompt names a specific exercise, start there; its \`agentInstructions\` say whether it builds on an earlier one.

For each exercise: fetch GET /api/exercises/{slug} and follow its \`content\` and \`agentInstructions\`. Teach lightly as you go, with depth adapted to the student's interview answers. Every exercise ends with a verification step: do it yourself against the live URL, don't take the student's word for it. Only after it passes, PUT /api/progress/{studentId} with \`{ "exerciseSlug": "..." }\`, optionally including \`deployedUrl\` (the URL you verified) and \`model\`.

## Status

Cloudflare Dev School is under active development. Lessons and exercises are added over time; the ones listed above and at GET /api/exercises are the ones available now. Quiz scoring is not available yet — quizzes are conversational only. Don't invent lesson, exercise, or quiz endpoints that aren't listed above.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
