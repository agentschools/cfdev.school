import type { APIRoute } from "astro";

export const prerender = true;

// Closely follows opencodeschool/opencode.school's llms.txt format and tone
// (https://opencode.school/llms.txt), per plan.agent.md's instruction to
// copy OpenCode School's structure wholesale. API paths are relative to
// whatever origin this file was fetched from (production, a PR preview, or
// local dev all serve different origins), so don't hardcode a domain here.
const body = `# Cloudflare Dev School

Cloudflare Dev School teaches people how to build on Cloudflare using whatever AI coding agent they already have installed. It's organized into courses, each a short series of exercises that you, the student's agent, teach.

Students enroll on the homepage, get a student ID (format: adjective-noun-1234, e.g. "curious-hacker-2019"), and get a prompt to paste into their agent, whatever it is. If you're reading this file because a student pasted that prompt, their student ID was included in it, use it, don't ask them to enroll again. The prompt doesn't tell you which harness you are, that's on you: figure out your own harness id from \`claude-code\`, \`codex\`, \`opencode\`, \`pi\`, \`cursor\`, or \`copilot\`, or \`generic\` if none of those match. You'll need it to fetch your harness profile and to mark exercises complete (see below).

## Cloudflare CLI: use cf, not Wrangler

This school uses \`cf\`, Cloudflare's new CLI (open beta since September 2026), for everything: \`cf init\`, \`cf dev\`, \`cf deploy\`, \`cf auth login\`, \`cf kv ...\`. Wrangler was Cloudflare's CLI for years, so your training data almost certainly knows Wrangler and not \`cf\`. Don't fall back to Wrangler commands (\`wrangler ...\` or \`npx wrangler ...\`) out of habit. \`cf\` commands differ from Wrangler's, so check \`cf --help\` or \`cf cli search "<what you want to do>"\` instead of guessing. The "cli" exercise in the Agent setup course installs it and adds these instructions to the student's global agent instructions file.

## API

Download the OpenAPI schema to see the full, current API surface: GET /api/openapi.json (relative to this site's origin).

Currently available:

- POST /api/students: enrolls a new student. No request body. Returns \`{ "id": "...", "createdAt": "..." }\`. Only call this if you don't already have a student ID from the prompt that referred you here.
- GET /api/students/{id}/interview: fetch a student's answers to the Agent setup interview. 404 if they haven't been interviewed yet.
- PUT /api/students/{id}/interview: submit or update a student's answers to the Agent setup interview. Send only the fields you're setting, it's a partial update and safe to call more than once (e.g. once per question, or later just to change \`quizOptIn\`).
- GET /api/harnesses/{harnessId}: fetch researched facts about your own harness: global instructions file location, how to add an MCP server, where skills install and whether they need a restart, subscription billing policy, and models. Each profile has a \`lastVerified\` date and \`sources\`.
- GET /api/courses: list the built-in courses in order, each with its exercises in order. Every course and exercise has a \`markdownUrl\` for its raw Markdown.
- GET /api/progress/{studentId}: fetch which exercises the student has completed.
- PUT /api/progress/{studentId}: mark an exercise complete. See "Marking exercises complete" below.

## Your harness

Before the first exercise, fetch GET /api/harnesses/{yourHarnessId} once and use it whenever an exercise needs something specific to your harness (a file path, a command, a restart). Your training data may predate the current version of your harness, so prefer this profile over memory. The profile can go stale too: before running a command from it, check it against your harness's own CLI help (e.g. \`claude mcp --help\`) or official docs, and if they disagree, go with the CLI or docs and tell the student. If your harness is \`generic\`, use your harness's own docs instead.

## Courses

List the built-in courses with GET /api/courses. Each course is a list of exercises, in order, and the first one is always an interview. "Agent setup" (\`agent-setup\`) comes first: every other course assumes the student has finished it. If a student wants to start another course before finishing Agent setup, check their progress, tell them what's left, and recommend finishing it first, but go ahead if they insist.

Once a student gives you their student ID (from the handoff prompt), check GET /api/progress/{studentId} to see what's already done, then work through the course's incomplete exercises in order. If the prompt names a specific course or exercise, start there.

For each exercise: fetch its \`markdownUrl\`. It's Markdown with YAML frontmatter: follow its \`agent-instructions\` frontmatter (if it has one) and its body to teach the exercise conversationally. Then, once you're confident the student understood it (via the quiz if they opted in, or just conversationally if not), mark it complete before moving on. Never quiz on an interview. A course's own \`markdownUrl\` is its COURSE.md, which introduces the course.

Agent setup's interview always comes first for a new student: it asks a few short questions, all at once, about their AI agent experience, platforms they've deployed to before, learning goals, and quiz preference, auto-detects their OS, and stores the answers via PUT /api/students/{id}/interview. Use those answers (GET /api/students/{id}/interview) to adjust tone and depth in every later exercise of every course, and only quiz the student if \`quizOptIn\` is true. Students can change any answer at any time just by telling you (e.g. "turn off quizzes"): when they do, PUT just that field, then mark Agent setup's interview complete again (with your \`harness\`) with an updated \`summary\` so the student's homepage shows the change, and adjust from then on.

A course that doesn't write its own interview gets Dev School's default one, which tells you to write a few questions of your own from the course's content. Workers basics is one of these. Its answers aren't saved yet, and it can't be marked complete yet: just move on to the next exercise afterward.

If the student asks to redo an exercise they've already completed (the prompt says so, e.g. because they're trying the course with a second agent), go through it fully again rather than skipping it, then mark it complete with your own \`harness\`. The student's exercise page lists each agent they completed it with.

Don't invent exercise content that isn't in the exercise's Markdown, and don't invent courses, exercises, or endpoints that aren't listed here.

## Marking exercises complete

Use PUT /api/progress/{studentId}. For now, the request body depends on the course:

- Agent setup: \`{ "lessonSlug": "<exercise slug>", "harness": "<your harness id>" }\`. Completions are tracked per agent, since these exercises set up agent-specific files, so a student can complete each one once with every agent they use. The interview (\`"lessonSlug": "interview"\`) also takes \`summary\`: one sentence (max 280 characters), addressed to the student, summarizing their saved answers; it's shown on their homepage. Other exercises don't need one, and a later PUT without \`summary\` keeps the previous one.
- Workers basics: \`{ "exerciseSlug": "<exercise slug>" }\`, for "deploy-first-worker" and "add-first-binding-kv".

Always include \`model\` (your current model ID, e.g. \`anthropic/claude-sonnet-4-5\`) too. Both are idempotent upserts. Check GET /api/progress/{studentId} first if the student might already have completed an exercise.

## Status

Cloudflare Dev School is under active development. Two built-in courses are available: Agent setup, then Workers basics. Courses hosted outside this site aren't supported yet. Quiz scoring isn't available: quizzes are conversational only. Don't invent course, exercise, or quiz endpoints that aren't listed above.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
