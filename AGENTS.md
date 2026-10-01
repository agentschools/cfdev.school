# Cloudflare Dev School — Agent Notes

This repo is Cloudflare Dev School, a web app that teaches people how to build on Cloudflare using their AI-powered agent harness of choice. It's modeled on OpenCode School.

- `plan.human.md`: the original human-written plan.
- `plan.agent.md`: the agent-refined plan, produced by grilling `plan.human.md`. Where the two disagree, `plan.agent.md` wins.
- v1 assumes a working agent and covers five setup lessons followed by two exercises: "Deploy your first Worker," then "Add your first Binding: Workers KV," which extends that same Worker. Use `plan.agent.md` for the current scope.
- Tickets for turning the plan into working software live as GitHub issues #8–#20 on this repo, in dependency order. See each issue's "Blocked by" for sequencing.

## Stack

- Astro (`output: 'server'`) deployed as a single Cloudflare Worker via `@astrojs/cloudflare`.
- D1 (`env.DB`, database `cloudflare-dev-school`) for all app data, no KV for business data (see `plan.agent.md`'s Data storage section). The `SESSION` KV namespace is Astro's own session-API binding, not app data storage, pinned by ID in `wrangler.jsonc` so it isn't re-provisioned per preview.
- Deployed to the personal Cloudflare account (`ziki.workers.dev` subdomain) until `cloudflaredevschool.com` is purchased (see issue #20).

## Commands

- `npm run dev` — local dev server
- `npm run build` — `astro build`
- `npm run test` — `vitest run`
- `npm run lint` — `eslint .`
- `npm run deploy` — applies D1 migrations, then build + `wrangler deploy` to production (also run by `.github/workflows/deploy.yml` on merge to `main`)
- `npm run preview:deploy` / `npm run preview:destroy` — used by `.github/workflows/preview.yml` for per-PR previews, not meant to be run by hand
- `npm run verify:interview` — scripted fake-agent smoke test against a real running Worker (`BASE_URL` env var, defaults to `http://localhost:8788`); run this against `wrangler dev` after touching the interview API
- `npm run verify:exercise` / `npm run verify:exercise-kv` — same idea, for the two exercises; run against `wrangler dev` after touching the exercise/progress API

## cf, not Wrangler, in student-facing content

All lesson, exercise, and `/llms.txt` content tells students' agents to use `cf` (Cloudflare's new CLI, open beta since 2026-09-28, `npm i -g cf`), not Wrangler: `cf init`, `cf dev`, `cf deploy`, `cf auth login`, `cf kv namespaces create`, with bindings declared in `cloudflare.config.ts` via `bindings.*` from `cf/config`. The CLI lesson (`src/content/lessons/cli/generic.md`) adds Cloudflare's official versioned snippet (`## Cloudflare CLI - cf - v20260928`) to the student's global instructions file; if Cloudflare publishes a newer version of that snippet, update it there. `cf` is new and not in model training data, so verify commands against the installed CLI (`cf --help`, `cf cli search "..."`) before writing them into content. This repo itself still builds and deploys with Wrangler (`wrangler.jsonc`, `scripts/preview-env.mjs`); that's separate from what students are taught.

## AI harness research data

`src/data/harnesses.ts` is a manually maintained, Zod-schema-typed data source covering the harnesses this school supports (Claude Code, Codex, OpenCode, Pi, generic fallback): instructions file location, CLI command, skills support/install location/restart behavior, config/MCP file locations plus how to add a remote MCP server (`mcp` field, used by the Tools lesson), model comparison data, and subscription-vs-API-billing policy for third-party routing. It's consumed by the homepage harness cards and lesson content, not re-derived per lesson.

Each harness profile carries its own `lastVerified` date and a `sources` list. This data goes stale fast (pricing and vendor policy on third-party subscription routing change often), so it's a manual process, not a scheduled job:

- Before shipping or editing a lesson that depends on a harness's data, re-verify its entries against current sources (use web search, don't rely on training data) and bump `lastVerified`.
- Add new sources when you change a claim; don't delete old ones unless they're wrong, they help explain why a value is what it is.
- If you can't verify something confidently, leave a note in `summary`/`notes` saying so rather than guessing.

## Harness icons

`public/icons/agents/<harness>/{light,dark}.svg` are borrowed directly from `developers.cloudflare.com/agent-setup/`'s own icon URLs (`https://developers.cloudflare.com/icons/agents/<slug>/{light,dark}.svg`), which only has icons for Claude Code, Codex, and OpenCode, not Pi or a generic fallback. Referenced from `src/data/harnesses.ts`'s optional `icon` field and swapped in `src/pages/index.astro`'s harness logo row via `prefers-color-scheme` (no JS). If Cloudflare adds an icon for a harness that's missing one here, re-fetch it from the same URL pattern rather than sourcing a logo elsewhere.

## API, schemas, and migrations

Zod-schema-first (see `plan.agent.md`'s "ship types, not docs" section):

- `src/schemas/*.ts` are the source of truth for API request/response shapes and D1 table shapes. `src/schemas/student.ts` and `src/schemas/interview.ts` share a `studentIdSchema` piece, reuse it rather than re-declaring the ID regex.
- `migrations/*.sql` are hand-written D1 migrations kept in sync with the schemas by hand (there's no schema-to-SQL generator in use). Apply with `wrangler d1 migrations apply cloudflare-dev-school --local` (dev) or `--remote` (production/preview); this also runs automatically as part of `npm run deploy` and `scripts/preview-env.mjs`.
- `src/lib/openapi.ts` builds the OpenAPI document with `zod-openapi`'s `createDocument`, reusing the same schemas. Served at `/api/openapi.json` via `src/pages/api/openapi.json.ts`.
- API routes live under `src/pages/api/*.ts` as Astro endpoints (`export const POST/GET: APIRoute = ...`), reading bindings via `import { env } from "cloudflare:workers"` (typed in `src/env.d.ts`), the same pattern OpenCode School uses. Astro's built-in CSRF check rejects same-origin-looking `POST` requests without a matching `Origin` header (e.g. plain `curl -X POST`); this is expected, real browser `fetch()` calls send `Origin` automatically. Add `export const prerender = false;` to every API route, they must run per-request, not at build time.

## Enrollment

`src/lib/student-id.ts` and the cipher-reveal/confetti animation in `src/lib/enroll-client.ts` are adapted from opencodeschool/opencode.school (Apache-2.0), per `plan.agent.md`'s "copy OpenCode School's enrollment flow wholesale." Keep the copyright headers when touching these files. The student ID format (`adjective-noun-1234`) and the two word lists are copied verbatim; don't change them without a reason, lessons and docs may reference the format.

`src/lib/enroll-client.ts` dispatches a `cfDevSchool:enrolled` custom event (`ENROLLED_EVENT`) on `document` whenever the student ID is shown, on fresh enrollment or a cached reload. Other client scripts (e.g. `src/pages/index.astro`'s `initAgentPrompt`) listen for this instead of duplicating enrollment/localStorage logic. If a page adds another `initX()` client module that reacts to enrollment, register its listener before calling `initEnrollment()` in the page's `<script>` block, since a returning visitor's cached reveal dispatches the event synchronously.

## Harness detection and `/llms.txt`

There is no student-facing harness picker (removed in #37): once enrolled, the homepage fills and reveals a single copyable prompt (`AgentPrompt.astro`, built by the harness-free `buildPrompt()` in `src/lib/agent-prompt.ts`) embedding their student ID and `window.location.origin`, so it works unmodified in production, PR previews, and local dev. The agent figures out its own harness itself once it fetches `/llms.txt`, there's no `cfDevSchool.harnessId` localStorage key anymore. Per-harness content (e.g. `src/content/lessons/models/claude-code.md`) still exists for the `/api/lessons/{slug}` endpoint, which agents call with `?harness=<id>` after detecting themselves; the human-facing `/lessons/{slug}` page always renders the `generic` variant, since there's no picker to tell it which one a visiting human would want.

## Interview

`src/schemas/interview.ts` / `migrations/0002_create_interview_answers.sql` / `src/pages/api/students/[id]/interview.ts` implement the interview from `plan.agent.md`'s Interview section: technical background, Cloudflare familiarity (tone/depth only, never lesson branching in v1), learning goals, auto-detected OS, and a standalone `quizOptIn` preference. `PUT` does a partial merge (upsert), safe to call once per question or just to change one field later; `GET` 404s until the student has at least one answer on file.

Verify the interview API end to end with `npm run verify:interview` (a "scripted fake-agent" per plan.agent.md's tickets: it fetches `/llms.txt`, then exercises the exact HTTP contract llms.txt documents against a real running Worker, it isn't simulating an LLM conversation). Run it against `wrangler dev` after touching this code, and again against a PR preview (`BASE_URL=https://cloudflare-dev-school-pr-N.ziki.workers.dev`) before merging. Delete the rows it creates from D1 afterward, it's a real enrollment against whatever database `BASE_URL` points at.

## Exercises and progress

v1 ships two exercises, in order:

1. **Deploy your first Worker** (`deploy-first-worker`): create, run locally, deploy, and visit a minimal text-response Worker.
2. **Add your first Binding: Workers KV** (`add-first-binding-kv`): extends that same Worker — create a KV namespace, bind it, and read/write a value through it. Soft-prerequisite on exercise 1 (the agent checks `GET /api/progress/{studentId}` first, not enforced server-side).

Shared infrastructure for both:

- Catalog: `src/data/exercises.ts` (static), served by `GET /api/exercises` and `GET /api/exercises/{slug}`. `exerciseSlugSchema` in `src/schemas/exercise.ts` is a union of both slugs — extend it (and add a catalog entry) the same way for any future exercise.
- Student-facing pages: `/exercises` (`src/pages/exercises/index.astro`) and `/exercises/{slug}` (`src/pages/exercises/[slug].astro`). The short page prose (intro, what you'll build, prerequisites) lives in the `exercises` content collection (`src/content/exercises/<slug>.md`, frontmatter just `exerciseSlug`); title/description/order and the agent-facing walkthrough stay in the catalog, don't duplicate them into frontmatter. Each page shows a copyable agent prompt naming the exercise (reused `AgentPrompt.astro`, prompt built by the optional exercise arg to `buildPrompt` in `src/lib/agent-prompt.ts`), a manual mark-complete button (PUTs progress, bypasses agent URL verification by design), a completed banner, and an enroll nudge for logged-out visitors. Client logic: `src/lib/exercise-client.ts` (derives the slug from the URL and reads the catalog client-side, same pattern as `lesson-client.ts`). The sidebar links exercises that have a content entry, same cross-reference pattern as lessons.
- Completion: `migrations/0003_create_exercise_completions.sql` + `GET|PUT /api/progress/{studentId}` (`src/pages/api/progress/[studentId].ts`, schemas in `src/schemas/progress.ts`). `PUT` body is `{ exerciseSlug, deployedUrl?, model? }` — `deployedUrl` is optional (store when the agent has it; never required). Idempotent upsert on `(student_id, exercise_slug)`; a student can have both completions at once.
- Agent procedure lives in each exercise's `agentInstructions` / `content` and is summarized in `/llms.txt`. For exercise 1 the agent fetches the deployed URL and confirms the expected text before calling `PUT` progress; for exercise 2 the agent does a two-step write-then-separate-read round trip against the deployed URL, to prove the binding actually persists data rather than a single request just echoing something back. Both `agentInstructions` also carry light teaching beats (brief concept explanations adapted to the student's interview answers, plus a comprehension check before marking complete), but completion stays gated on the agent's own URL verification.

Verify exercise 1 with `npm run verify:exercise`, exercise 2 with `npm run verify:exercise-kv` (a sibling script, not a generalized/parameterized version of the first — keeps each diff small), both against `wrangler dev` (or a PR preview via `BASE_URL=...`). Same caveats as `verify:interview`: real enrollment + completion rows in whatever D1 `BASE_URL` points at; delete them afterward. Neither script deploys a Worker or provisions a real KV namespace — they only check the HTTP contract.

`/llms.txt` (`src/pages/llms.txt.ts`, prerendered, format modeled on OpenCode School's) only documents API endpoints that actually exist today. When a ticket adds a new API route students' agents need to know about (interview, progress, etc.), update this file in the same PR, don't let it drift ahead of or behind the real API.

## Code block copy buttons

`src/lib/code-copy-client.ts` (`initCodeCopyButtons`, called from the lesson and exercise page scripts) wraps every `.prose pre` (one-liners included) in `.code-block` and adds an icon-only copy button on the right that flips to a check + "Copied" for 2s. Styles live in the global block in `src/layouts/Layout.astro`.

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
- `.github/workflows/deploy.yml`: deploys to production on push to `main`.
- Required repo secrets: `CLOUDFLARE_API_TOKEN` (scoped to `Workers Scripts:Edit` + `D1:Edit`), `CLOUDFLARE_ACCOUNT_ID`.

## Testing Astro components

`vitest.config.ts` calls `getViteConfig({}, { configFile: false })`. The `{ configFile: false }` MUST be the second argument (`inlineAstroConfig`), not the first (`userViteConfig`), or it's silently ignored. This skips loading `astro.config.mjs` (and its `@astrojs/cloudflare` adapter) for tests, working around an upstream incompatibility between Vitest 4's module runner and the Cloudflare Vite plugin (https://github.com/withastro/astro/issues/15878, unresolved as of this writing). Component tests render `.astro` files via `astro/container`'s `experimental_AstroContainer` and don't need real Worker bindings; if a test ever does need `env.DB`/`env.SESSION`, mock them rather than re-enabling the adapter here.

`configFile: false` also means `astro:content` collections don't resolve in tests (`getCollection()` comes back empty; tried a dedicated adapter-free `astro.config.test.mjs` too, no difference, the content layer needs Astro's real dev/build orchestration). `vi.mock("astro:content", ...)` with fake entries in any test that touches a route using `getCollection`/`render`, the same way `cloudflare:workers` is mocked. Don't try to unit-test real rendered Markdown/MDX body content through `render()`, its output is a genuine compiled Astro component that isn't practical to fake; verify that path against a real running Worker (`wrangler dev`) instead.

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

## Reviewing with Crit

[Crit](https://github.com/tomasz-tomczyk/crit) lets a human leave inline comments on a running page or a markdown file, then hands them to the agent. It runs locally and needs no account.

Setup (once per machine):

- `brew install crit`
- `claude plugin marketplace add tomasz-tomczyk/crit` (adds the `/crit` command to Claude Code)

Review the running site (layout, UI, copy as rendered):

1. `npm run dev` (Astro dev server, default `http://localhost:4321`)
2. `crit live http://localhost:4321` (proxy review; open the URL Crit prints, comment on the page)
3. Run `/crit` in the agent to read the comments, make the edits, and reply to each one. Repeat until the reviewer is satisfied.

Review prose only: `crit <file>.md` (e.g. a lesson in `src/content/lessons/`, `plan.agent.md`).

Mapping comments back to source:

- Page layout and routes: `src/pages/*.astro` (landing page is `src/pages/index.astro`, exercises under `src/pages/exercises/`)
- Shared UI: `src/components/*.astro` (e.g. `AgentPrompt.astro`, `CurriculumSidebar.astro`)
- Lesson and exercise copy: `src/content/lessons/**`, `src/content/exercises/*.md`
- Harness cards and facts on the homepage: `src/data/harnesses.ts`

Don't commit Crit's review state files. Verify flags with `crit --help`.

## Keep this file current

This file must be revised whenever the stack, scripts, or conventions change. Don't let it drift from what's actually true about the repo.
