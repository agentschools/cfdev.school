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

## Exercise 2: Add your first binding

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

## Exercise 3: Use Worker Previews

Once exercise 2 is complete, fetch this one with GET /api/exercises/use-worker-previews and follow its \`content\` and \`agentInstructions\`. It extends the same Worker from exercise 2, it doesn't start a new project.

Summary of what you must do:

1. Make sure \`cf previews deploy\` exists (update \`cf\` if not) and the project is a git repository, then create a branch.
2. Run \`cf previews deploy\` unchanged and show the student that the Preview reads production's KV data, because \`cf\` builds it from the same \`cloudflare.config.ts\`.
3. Create a second KV namespace and switch \`cloudflare.config.ts\` to \`defineConfig(({ isPreview }) => ...)\`, picking the KV namespace ID with \`isPreview\`. Add an \`ENVIRONMENT\` text binding and enable observability.
4. Commit and redeploy the Preview. Explain the Preview URL (one per branch) versus deployment URLs (one per deploy).
5. **Verify yourself:** the Preview URL says "preview", can't see production's value, and reads back its own value from a separate request, while production still returns its own value.
6. Read the Preview's logs with \`cf observability telemetry query\`, filtered on \`$workers.scriptName\` and \`$workers.preview.slug\`.
7. Merge to \`main\`, \`cf deploy\`, and verify production now says "production" and kept its data.
8. Only then PUT /api/progress/{studentId} with \`{ "exerciseSlug": "use-worker-previews" }\`. Optionally send \`deployedUrl\` (the Preview URL) and \`model\`.
9. Afterward, briefly suggest next steps (a second Preview, Workers Builds for pull requests, Access and custom domains, Preview secrets, isolating D1/R2).

Throughout, offer to open the matching Cloudflare dashboard pages (Preview overview, deployments, settings, observability, and both KV namespaces); the exercise's \`agentInstructions\` list the URL patterns.

Teach lightly: briefly explain each new concept (Preview, bindings by resource ID, Preview vs deployment URL, per-Preview logs) with depth adapted to their interview answers, and before marking complete ask them what a Preview shares with production and what it doesn't. Verification is still the gate.

Check GET /api/progress/{studentId} first if they might already have completed it.

## Status

Cloudflare Dev School is under active development. Six lessons ("interview", "models", "instructions", "cli", "skills", "tools") and three exercises (Deploy your first Worker, Add your first binding, then Use Worker Previews) are available. Quiz scoring is not available yet — quizzes are conversational only. Don't invent lesson, exercise, or quiz endpoints that aren't listed above.
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
