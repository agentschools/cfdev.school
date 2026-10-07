# Cloudflare Dev School — Agent Notes

This repo is Cloudflare Dev School, a web app that teaches people how to build on Cloudflare using their AI-powered agent harness of choice. It's modeled on OpenCode School.

- `plan.human.md`: the original human-written plan.
- `plan.agent.md`: the agent-refined plan, produced by grilling `plan.human.md`. Where the two disagree, `plan.agent.md` wins.
- The school is organized into courses made of exercises (#73, the plan of record for courses and courses hosted elsewhere). v1 assumes a working agent and ships two built-in courses: Agent setup (an interview, then models, instructions, CLI, skills, tools) and Workers basics ("Deploy your first Worker," then "Add your first binding," which extends that same Worker). See "Courses and exercises".

## Titles

Use sentence case for every title and heading: course and exercise titles, page headings, Markdown headings in content, `/llms.txt` sections. Capitalize only the first word and proper nouns/product names (Cloudflare, Worker, Workers KV, Claude Code). E.g. "Add your first binding", not "Add Your First Binding".

## Stack

- Astro (`output: 'server'`) deployed as a single Cloudflare Worker via `@astrojs/cloudflare`.
- D1 (`env.DB`, database `cloudflare-dev-school`) for all app data, no KV for business data (see `plan.agent.md`'s Data storage section). The `SESSION` KV namespace is Astro's own session-API binding, not app data storage, pinned by ID in `wrangler.jsonc` so it isn't re-provisioned per preview.
- `src/worker.ts` is the Worker entry (`main` in `wrangler.jsonc`), wrapping Astro's `@astrojs/cloudflare/handler` so it can also export Durable Object classes. `src/env.d.ts` extends `Cloudflare.Env` for binding types; add new bindings there.
- Deployed to the personal Cloudflare account (`ziki.workers.dev` subdomain) until `cloudflaredevschool.com` is purchased (see issue #20).

## Commands

- `npm run dev` — local dev server
- `npm run build` — `astro build`
- `npm run test` — `vitest run`
- `npm run lint` — `eslint .`
- `npm run deploy` — applies D1 migrations, then build + `wrangler deploy` to production (also run by `.github/workflows/deploy.yml` on merge to `main`)
- `npm run preview:deploy` / `npm run preview:destroy` — used by `.github/workflows/preview.yml` for per-PR previews, not meant to be run by hand
- `npm run verify:interview` — scripted fake-agent smoke test against a real running Worker (`BASE_URL` env var, defaults to `http://localhost:8788`); run this against `wrangler dev` after touching the interview API
- `npm run verify:exercise` / `npm run verify:exercise-kv` — same idea, for Workers basics' two exercises; run against `wrangler dev` after touching the exercise/progress API

## cf, not Wrangler, in student-facing content

All course, exercise, and `/llms.txt` content tells students' agents to use `cf` (Cloudflare's new CLI, open beta since 2026-09-28, `npm i -g cf`), not Wrangler: `cf init`, `cf dev`, `cf deploy`, `cf auth login`, `cf kv namespaces create`, with bindings declared in `cloudflare.config.ts` via `bindings.*` from `cf/config`. The CLI exercise (`courses/agent-setup/exercises/03-cli.md`) adds Cloudflare's official versioned snippet (`## Cloudflare CLI - cf - v20260928`) to the student's global instructions file; if Cloudflare publishes a newer version of that snippet, update it there. `cf` is new and not in model training data, so verify commands against the installed CLI (`cf --help`, `cf cli search "..."`) before writing them into content. This repo itself still builds and deploys with Wrangler (`wrangler.jsonc`, `scripts/preview-env.mjs`); that's separate from what students are taught.

## AI harness research data

`src/data/harnesses.ts` is a manually maintained, Zod-schema-typed data source covering the harnesses this school supports (Claude Code, Codex, OpenCode, Pi, generic fallback): instructions file location, CLI command, skills support/install location/restart behavior, config/MCP file locations plus how to add a remote MCP server (`mcp` field, used by the Tools exercise), model comparison data, and subscription-vs-API-billing policy for third-party routing. It's consumed by the homepage "Works with" grid and served to agents as-is by `GET /api/harnesses/{id}` (`src/pages/api/harnesses/[id].ts`, schema reused in the OpenAPI doc), which `/llms.txt` tells agents to fetch once and prefer over their training data, while still checking commands against their harness's own CLI help or docs. Harness-specific facts that exercises need (file paths, commands, billing policy) belong here, not in exercise content.

Each harness profile carries its own `lastVerified` date and a `sources` list. This data goes stale fast (pricing and vendor policy on third-party subscription routing change often), so `.github/workflows/refresh-harnesses.yml` re-verifies it daily: Claude (via `anthropics/claude-code-action`, file and web tools only) edits `harnesses.ts`, and the workflow opens or updates a single `chore/refresh-harnesses` PR when something besides `lastVerified` changed. Review those PRs against their cited sources before merging. Whether a person or that job edits the file, the same rules apply:

- Before shipping or editing an exercise that depends on a harness's data, re-verify its entries against current sources (use web search, don't rely on training data) and bump `lastVerified`.
- Add new sources when you change a claim; don't delete old ones unless they're wrong, they help explain why a value is what it is.
- If you can't verify something confidently, leave a note in `summary`/`notes` saying so rather than guessing.

## Harness icons

`public/icons/agents/<harness>/{light,dark}.svg` are borrowed directly from `developers.cloudflare.com/agent-setup/`'s own icon URLs (`https://developers.cloudflare.com/icons/agents/<slug>/{light,dark}.svg`), which only has icons for Claude Code, Codex, and OpenCode, not Pi or a generic fallback. Referenced from `src/data/harnesses.ts`'s `icon` field. If Cloudflare adds an icon for a harness that's missing one here, re-fetch it from the same URL pattern rather than sourcing a logo elsewhere.

`public/icons/agents/<harness>/mono.svg` is our own derivative: a single-color silhouette (black, alpha only) of each logo, used by the homepage's "Works with" grid. `src/pages/index.astro` tints it with a CSS `mask` over `background-color: var(--fg)`, so it follows light/dark mode. When adding a harness, add a `mono.svg` alongside `light`/`dark`, set `icon.mono` in `harnesses.ts` (the schema requires it), and add a size to `iconSize` in `index.astro` if the default 40px square looks off.

## API, schemas, and migrations

Zod-schema-first (see `plan.agent.md`'s "ship types, not docs" section):

- `src/schemas/*.ts` are the source of truth for API request/response shapes and D1 table shapes. `src/schemas/student.ts` and `src/schemas/interview.ts` share a `studentIdSchema` piece, reuse it rather than re-declaring the ID regex.
- `migrations/*.sql` are hand-written D1 migrations kept in sync with the schemas by hand (there's no schema-to-SQL generator in use). Apply with `wrangler d1 migrations apply cloudflare-dev-school --local` (dev) or `--remote` (production/preview); this also runs automatically as part of `npm run deploy` and `scripts/preview-env.mjs`.
- `src/lib/openapi.ts` builds the OpenAPI document with `zod-openapi`'s `createDocument`, reusing the same schemas. Served at `/api/openapi.json` via `src/pages/api/openapi.json.ts`.
- API routes live under `src/pages/api/*.ts` as Astro endpoints (`export const POST/GET: APIRoute = ...`), reading bindings via `import { env } from "cloudflare:workers"` (typed in `src/env.d.ts`), the same pattern OpenCode School uses. Astro's built-in CSRF check rejects same-origin-looking `POST` requests without a matching `Origin` header (e.g. plain `curl -X POST`); this is expected, real browser `fetch()` calls send `Origin` automatically. Add `export const prerender = false;` to every API route, they must run per-request, not at build time.

## Enrollment

`src/lib/student-id.ts` and the cipher-reveal/confetti animation in `src/lib/enroll-client.ts` are adapted from opencodeschool/opencode.school (Apache-2.0), per `plan.agent.md`'s "copy OpenCode School's enrollment flow wholesale." Keep the copyright headers when touching these files. The student ID format (`adjective-noun-1234`) and the two word lists are copied verbatim; don't change them without a reason, exercises and docs may reference the format.

The homepage ID card (`src/components/StudentIdCard.astro`) is always visible, showing a sample ID (`smooth-operator-4629`) until the student enrolls; `enroll-client.ts` then cipher-reveals their real ID over it. Don't re-add `hidden` to the card, the logged-out design depends on the sample.

`src/lib/enroll-client.ts` dispatches a `cfDevSchool:enrolled` custom event (`ENROLLED_EVENT`) on `document` whenever the student ID is shown, on fresh enrollment or a cached reload. Other client scripts (e.g. `src/pages/index.astro`'s `initAgentPrompt`) listen for this instead of duplicating enrollment/localStorage logic. If a page adds another `initX()` client module that reacts to enrollment, register its listener before calling `initEnrollment()` in the page's `<script>` block, since a returning visitor's cached reveal dispatches the event synchronously.

## Harness detection and `/llms.txt`

There is no student-facing harness picker (removed in #37). The homepage layout (headline, ID card, "Works with" logo grid, sidebar always visible, GitHub link only in the header via `Layout`'s `minimalHeader`) follows the "Homepage — H" design explored in Paper. Once enrolled, the CTA is replaced by a single copyable prompt (`AgentPrompt.astro`, built by the harness-free `buildPrompt()` in `src/lib/agent-prompt.ts`) embedding their student ID and `window.location.origin`, so it works unmodified in production, PR previews, and local dev. The agent figures out its own harness itself once it fetches `/llms.txt`, there's no `cfDevSchool.harnessId` localStorage key anymore. Each exercise is one Markdown file, written for any agent and served unchanged to humans (`/courses/{name}/{exercise}`) and, raw, to agents (see "Courses and exercises"). There are no per-harness variants: `agent-instructions` tell the agent to pull harness-specific facts from its harness profile (see "AI harness research data"), or list short per-agent steps inline where a profile field doesn't cover it (e.g. the Tools and Skills exercises). The agent still detects its own harness ID, it needs it for the profile and for exercise completions.

## Interview

`src/schemas/interview.ts` / `migrations/0002_create_interview_answers.sql` / `src/pages/api/students/[id]/interview.ts` implement the interview from `plan.agent.md`'s Interview section: AI agent experience (`agentExperience`), platforms deployed to before (`platformsUsed`, a string array stored as JSON text, `[]` means none), both tone/depth/comparisons only, never exercise branching in v1, plus learning goals, auto-detected OS, and a standalone `quizOptIn` preference. These four questions are capped at four on purpose: Claude Code's `AskUserQuestion` takes at most four per call, so swap a question rather than add a fifth. The agent also checks Node, `cf`, `cf auth whoami`, and an existing instructions file without storing them. `migrations/0007_*.sql` replaced the original technical background and Cloudflare familiarity columns. `PUT` does a partial merge (upsert), safe to call once per question or just to change one field later; `GET` 404s until the student has at least one answer on file.

The interview is also Agent setup's first exercise (`courses/agent-setup/exercises/00-interview.md`, never quizzed). Its `agent-instructions` hold the interview procedure (all questions asked at once, kept short, via the harness's structured question tool if it has one, else one numbered plain-text message; students can change any answer later just by telling their agent); `/llms.txt` only summarizes it. The agent marks it complete with `PUT /api/progress` like any exercise. The homepage prompt (`buildPrompt()` with no context) points at it. Other courses' interviews are separate: a course without its own gets the default interview (see "Courses and exercises"), whose answers aren't stored yet (#76).

Verify the interview API end to end with `npm run verify:interview` (a "scripted fake-agent" per plan.agent.md's tickets: it fetches `/llms.txt`, then exercises the exact HTTP contract llms.txt documents against a real running Worker, it isn't simulating an LLM conversation). Run it against `wrangler dev` after touching this code, and again against a PR preview (`BASE_URL=https://cloudflare-dev-school-pr-N.ziki.workers.dev`) before merging. Delete the rows it creates from D1 afterward, it's a real enrollment against whatever database `BASE_URL` points at.

## Courses and exercises

Built-in courses live in `courses/<name>/` at the repo root, in the same format courses hosted elsewhere will use (#77), loosely following the Agent Skills spec (https://agentskills.io/specification):

- `COURSE.md`: frontmatter `name` (matches the directory), `description`, and optional `license`, `compatibility`, and `metadata` (`author`), then a `# Title` and intro prose. Schemas in `src/schemas/course.ts`.
- `exercises/NN-slug.md`: ordered by filename (natural sort). The slug is the filename without `.md` or its number prefix, so renumbering to insert an exercise doesn't change slugs. Frontmatter is optional: `description`, and `agent-instructions` (for the agent only, not rendered). The body starts with a `# Title` and is read by both students and agents. An exercise slugged `interview` always comes first; a course without one gets `src/content/default-interview.md`, which tells the agent to write its own questions. The rules live in `src/lib/course-format.ts`.
- Catalog order is `COURSE_ORDER` in `src/data/courses.ts`, since course directories can't take number prefixes when `name` has to match the directory. `REQUIRED_COURSE` (Agent setup) is required softly: `/llms.txt` tells agents to steer students there first, the API doesn't enforce it. To add a course, add its directory and its name to `COURSE_ORDER`; `src/data/courses.test.ts` checks the real files against the format.
- `getBuiltInCourses()` (`src/lib/courses.ts`) loads the `courses`, `exercises`, and `defaultInterview` content collections (`src/content.config.ts`) and applies the ordering rules. The pages, the sidebar, and `GET /api/courses` all go through it.
- Agents read courses as raw Markdown: `/courses/{name}/COURSE.md` and `/courses/{name}/exercises/{file}` serve the repo files as they are (prerendered from `import.meta.glob` `?raw` imports in `src/lib/course-files.ts`), plus the default interview at `/courses/{name}/exercises/interview.md` for a course without one. `GET /api/courses` lists each course and exercise with its `markdownUrl`.
- Pages: `/courses` (catalog), `/courses/{name}` (intro, a prompt for the whole course, exercise list), and `/courses/{name}/{exercise}` (see "Live progress"). The sidebar lists every built-in course with its exercises, numbered from `00`. Pages show the content's `# Title` in their own header, so `Layout.astro` hides a `.prose` block's leading `h1` with CSS. Astro 7's default Markdown processor (Sätteri) doesn't run remark plugins, so don't reach for one to strip it.
- Workers basics' exercises carry their own verification in `agent-instructions`: for "deploy-first-worker" the agent fetches the deployed URL and confirms the expected text before marking it complete; for "add-first-binding-kv" it does a two-step write-then-separate-read round trip against the deployed URL, to prove the binding persists data rather than a single request echoing something back. Both also carry light teaching beats (brief explanations adapted to the interview answers, plus a comprehension check), but completion stays gated on the agent's own verification. "add-first-binding-kv" soft-requires "deploy-first-worker" (the agent checks progress first).
- Progress is still keyed by the slugs from before courses, until #75: Agent setup's exercises are stored as lessons (`lessonSlug` + `harness`), Workers basics' as exercises (`exerciseSlug`), and Workers basics' interview isn't tracked. `exerciseCompletions()` in `src/lib/course-progress.ts` is the only place that maps between the two; client code goes through it.

Verify Workers basics with `npm run verify:exercise` and `npm run verify:exercise-kv` (sibling scripts, not one parameterized script, to keep each diff small), against `wrangler dev` or a PR preview (`BASE_URL=...`). Same caveats as `verify:interview`: real enrollment and completion rows in whatever D1 `BASE_URL` points at, delete them afterward. Neither deploys a Worker or provisions a KV namespace, they only check the HTTP contract.

## Live progress

Exercise completion is done by the student's agent (`PUT /api/progress/{studentId}`), and open browser tabs update without polling or reloads:

- `ProgressHub` (`src/durable-objects/progress-hub.ts`, binding `PROGRESS_HUB`) is one Durable Object per student, addressed with `getByName(studentId)`. Browsers hold a hibernatable WebSocket to it; `PUT`/`DELETE` progress calls its `broadcast()` RPC after the D1 write (a failed broadcast is logged, never fails the request).
- `GET /api/progress/{studentId}/live` (WebSocket upgrade) is routed to the DO in `src/worker.ts` before Astro sees it, so it isn't an Astro API route and isn't in `/llms.txt` or the OpenAPI doc. It's browser-only, agents never need it.
- `src/lib/progress-client.ts`'s `subscribeToProgress(studentId, listener)` is the only client entry point: one shared socket per page, an HTTP fetch on every (re)connect so missed updates aren't lost, exponential-backoff reconnect, and a `"ping"` keepalive answered by the DO's auto-response (doesn't wake it from hibernation). The sidebar, exercise pages, and the homepage all subscribe through it; don't add separate progress fetches. The sidebar's client also fills in the completion check of every `[data-course][data-exercise]` item on the page, so a page's own exercise list (e.g. on a course page) needs no subscription of its own.
- Exercise pages (`src/pages/courses/[name]/[exercise].astro` + `src/lib/exercise-client.ts`) show the OpenCode School-style agent prompt, a completed banner, and a footer that reads "Complete this exercise in your agent to continue" until the exercise is complete, then becomes a link to the next exercise (or the next course, or `/courses`). There's no manual mark-complete button: completion is the agent's call. Once an exercise is complete its prompt is hidden behind a "Redo this exercise" button in the completed banner; revealing it shows the redo wording and keeps it open through later progress updates.
- Agent setup's completions are per harness (#52), stored as lesson completions: `PUT /api/progress` requires `harness` for lessons, and the key is (student, lesson, harness), so a student can complete an exercise once per agent (`migrations/0006_lesson_completions_per_harness.sql`). `completedLessons` can hold several entries for one slug; use the newest for summaries. The exercise banner names each agent ("...using Claude Code and on ... using OpenAI Codex", `generic` reads as "an unknown agent"), and once complete the prompt (behind "Redo this exercise") asks the agent to redo it. Workers basics' completions are still one per student with no harness, so their banner names no agent (until #75).
- Lesson completions carry an optional agent-written one-sentence `summary` (`PUT /api/progress` body, `migrations/0005_add_lesson_completion_summary.sql`); a later PUT without one keeps the previous summary. Only Agent setup's interview uses it (per-exercise summaries felt like overkill and were removed from the pages); it's shown in the homepage's "Interview complete" box. The Interview's summary describes the student's saved answers, and agents re-send it whenever the student changes an answer, so the existing progress broadcast keeps it live; there's no separate interview broadcast.
- The homepage hero is progress-driven once enrolled: the Interview prompt until `interview` is complete, then an "Interview complete" box (same look as the exercise pages' completed banner) with its summary and a "Next: ..." button to the first incomplete exercise in Agent setup (or the course after it). If progress hasn't loaded after 1.5s (e.g. a cached ID the server doesn't know) it falls back to showing the prompt.
- Anything that appears or disappears in response to live progress uses `setVisible()` from `src/lib/reveal.ts` (height + fade + slide, skipped for `prefers-reduced-motion`) rather than toggling `hidden` directly. It tracks its target state in `data-reveal-target`, so don't mix it with direct `hidden` writes on the same element.
- To exercise the socket by hand: `npm run build`, then `npx wrangler dev -c dist/server/wrangler.json --port 8788 --persist-to .wrangler/state` (the `--persist-to` is needed, otherwise local D1 state lives under `dist/server/` and has no tables), open a page while enrolled, and `PUT` progress with `curl` (send an `Origin` header).

`/llms.txt` (`src/pages/llms.txt.ts`, prerendered, format modeled on OpenCode School's) only documents API endpoints that actually exist today. When a ticket adds a new API route students' agents need to know about (interview, progress, etc.), update this file in the same PR, don't let it drift ahead of or behind the real API.

## Code block copy buttons

`src/lib/code-copy-client.ts` (`initCodeCopyButtons`, called from the exercise page script) wraps every `.prose pre` (one-liners included) in `.code-block` and adds an icon-only copy button on the right that flips to a check + "Copied" for 2s. Styles live in the global block in `src/layouts/Layout.astro`.

## Disenroll

`/disenroll` (`src/pages/disenroll.astro`, client logic in `src/lib/disenroll-client.ts`) copies OpenCode School's disenroll page layout: two options, not one.

- **Reset progress**: `DELETE /api/progress/{studentId}` (same file as the other progress routes) deletes the student's rows from `exercise_completions` and `lesson_completions` but keeps the `students` and `interview_answers` rows. This is a real server-side delete, unlike everything else on this page.
- **Disenroll completely**: purely client-side, clears the `cfDevSchool.student` localStorage key and redirects home. It never calls the server; per this app's no-accounts model there's no student data to delete server-side on request, only progress (handled by the option above).

The page shows an enroll nudge instead of the two options for logged-out visitors. The sidebar (`CurriculumSidebar.astro`) only shows the "Account" section (containing the Disenroll link) once enrolled, `curriculum-sidebar-client.ts` toggles it both on load and reactively on the `cfDevSchool:enrolled` event, so it appears immediately after a fresh enrollment click without a reload.

## Dependency pinning

The global `~/.npmrc` sets `min-release-age=7`, so `npm install <pkg>@latest` can fail with `ETARGET` for packages published in the last week. Check `npm view <pkg> time --json` and pin an exact version older than 7 days when this happens. Don't work around it by editing the global npmrc.

## CI/CD

- `.github/workflows/ci.yml`: lint and test run as separate parallel jobs on every PR and on push to `main`.
- `.github/workflows/preview.yml`: per-PR preview Worker at `cloudflare-dev-school-pr-<N>.ziki.workers.dev`, torn down on PR close. Triggered independently of `ci.yml` (no `needs:` between them) so previews don't wait on lint/test. Uses the **shared production resources** strategy (previews share the production D1 database and SESSION KV namespace). As of the enrollment flow (#11), previews now write real student rows into the production D1 database when testing enrollment by hand, this is an accepted tradeoff for now, not a bug. Revisit and switch to per-PR seeded/empty D1 if that becomes a real problem (e.g. once interview/progress data makes stray preview rows more than just noise).
- After a successful preview deploy, `scripts/preview-env.mjs` appends a list of links to the preview pages the PR affects at the end of the PR body (between `<!-- preview-links:start/end -->` markers, replaced on each push). The file-to-path mapping lives in `scripts/preview-links.mjs`; extend it when adding new pages or routes. It runs inside the deploy job rather than a `deployment_status` workflow because events created with `GITHUB_TOKEN` don't trigger other workflows.
- `.github/workflows/deploy.yml`: deploys to production on push to `main`.
- `.github/workflows/refresh-harnesses.yml`: daily (and manual `workflow_dispatch`) harness data check, see "AI harness research data". It runs lint and test itself before opening its PR, because PRs created with `GITHUB_TOKEN` don't trigger `ci.yml` or `preview.yml`. Needs "Allow GitHub Actions to create and approve pull requests" enabled in the repo's Actions settings.
- `anthropics/claude-code-action` needs `github_token: ${{ github.token }}` in this repo; without it the action tries to get a Claude GitHub App token (needs `id-token: write` and the app installed) and fails.
- Required repo secrets: `CLOUDFLARE_API_TOKEN` (scoped to `Workers Scripts:Edit` + `D1:Edit`), `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY` (refresh-harnesses only).

## Testing Astro components

`vitest.config.ts` calls `getViteConfig({}, { configFile: false })`. The `{ configFile: false }` MUST be the second argument (`inlineAstroConfig`), not the first (`userViteConfig`), or it's silently ignored. This skips loading `astro.config.mjs` (and its `@astrojs/cloudflare` adapter) for tests, working around an upstream incompatibility between Vitest 4's module runner and the Cloudflare Vite plugin (https://github.com/withastro/astro/issues/15878, unresolved as of this writing). Component tests render `.astro` files via `astro/container`'s `experimental_AstroContainer` and don't need real Worker bindings; if a test ever does need `env.DB`/`env.SESSION`, mock them rather than re-enabling the adapter here.

`configFile: false` also means `astro:content` collections don't resolve in tests (`getCollection()` comes back empty; tried a dedicated adapter-free `astro.config.test.mjs` too, no difference, the content layer needs Astro's real dev/build orchestration). `vi.mock("astro:content", ...)` with fake entries in any test that touches a route using `getCollection`/`render`, the same way `cloudflare:workers` is mocked. Page and component tests share `src/test/fake-content.ts` (two small courses shaped like the real ones), since the sidebar on every page loads the courses. Don't try to unit-test real rendered Markdown/MDX body content through `render()`, its output is a genuine compiled Astro component that isn't practical to fake; verify that path against a real running Worker (`wrangler dev`) instead.

Astro treats every file under `src/pages/` as a route, test files included. That's harmless for most tests, but one that mentions `getStaticPaths` makes the build warn; test that logic from outside `src/pages/` (e.g. `src/lib/course-files.test.ts`).

## Known accepted risks

- `npm audit` reports high-severity advisories in `sharp`/`libheif`, transitively pulled in by `wrangler`'s dev tooling (`miniflare`/`@cloudflare/vite-plugin`). No fix is available without downgrading `wrangler` to `4.15.2`. This only affects local dev image processing, not the deployed Worker. Re-check `npm audit` when upgrading `wrangler`.

## Issue tracker

Issues live as GitHub issues on this repo, via the `gh` CLI.

## Planning approach

We're borrowing ideas from Matt Pocock's `mattpocock/skills` (https://github.com/mattpocock/skills), specifically `grill-me`, `to-spec`, and `to-tickets`, without installing them as skills:

- **Grilling**: interrogate a plan or spec one question at a time to surface gaps and contradictions before building.
- **Spec-first**: turn an agreed-upon conversation/plan into a single written decision record (a GitHub issue) before splitting work across sessions.
- **Ticketing**: break a spec into small, independently demoable tickets, each a vertical slice (schema + API + UI + tests), sized to fit one fresh context window, with explicit blocking dependencies between them.

Apply these ideas freely when turning `plan.agent.md` into GitHub issues, but there's no separate tracker config or skill install to maintain here, just plain GitHub issues.

## Keep this file current

This file must be revised whenever the stack, scripts, or conventions change. Don't let it drift from what's actually true about the repo.
