# Cloudflare Dev School — Agent Notes

This repo is Cloudflare Dev School, a web app that teaches people how to build on Cloudflare using their AI-powered agent harness of choice. It's modeled on OpenCode School.

- Plans and decisions live in GitHub issues (see "Planning approach"). The original plan files were removed in #69; git history has them.
- No accounts and no personal data: students enroll anonymously and get a random student ID (see "Enrollment"). Signing in with Cloudflare OAuth is deferred until something needs it.
- Quizzes are written by the student's agent in conversation from each exercise, never scored or stored. Students opt in during Agent setup's interview.
- The school is organized into courses made of exercises (#73, the plan of record for courses and courses hosted elsewhere). v1 assumes a working agent and ships three built-in courses: Agent setup (an interview, then models, instructions, CLI, skills, tools), then two in the fundamentals track: Workers ("Deploy a Worker," then "Add a binding," which extends that same Worker; it was `workers-basics` until #98) and Bindings (see "Bindings course"). The projects track has no courses yet. See "Courses and exercises" and #98, which tracks the rest of the tracks work.

## Titles

Use sentence case for every title and heading: course and exercise titles, page headings, Markdown headings in content, `/llms.txt` sections. Capitalize only the first word and proper nouns/product names (Cloudflare, Worker, Workers KV, Claude Code). E.g. "Add a binding", not "Add A Binding". `src/data/sentence-case.test.ts` checks every heading in `courses/` and `src/content/` (acronyms always pass); when content needs a new proper noun, add it to that test's `PROPER_NOUNS`.

## Stack

- Astro (`output: 'server'`) deployed as a single Cloudflare Worker via `@astrojs/cloudflare`.
- D1 (`env.DB`, database `cloudflare-dev-school`) for all app data, no KV for business data: progress and interviews are relational, and D1 gives batched writes, SQL for debugging, migrations, and foreign keys. The `SESSION` KV namespace is Astro's own session-API binding, not app data storage, pinned by ID in `wrangler.jsonc` so it isn't re-provisioned per preview.
- `src/worker.ts` is the Worker entry (`main` in `wrangler.jsonc`), wrapping Astro's `@astrojs/cloudflare/handler` so it can also export Durable Object classes. `src/env.d.ts` extends `Cloudflare.Env` for binding types; add new bindings there.
- Visual reference: the public face of developers.cloudflare.com (logo top left, sidebar nav), in Cloudflare's brand colors. Light and dark mode follow the system preference, and every page has to work on mobile.
- Canonical domain: `https://cfdev.school` (registered with Cloudflare Registrar on the personal account, auto-renew on), attached to the production Worker as a custom domain in `wrangler.jsonc` `routes`. The old production host `cloudflare-dev-school.ziki.workers.dev` stays up (`workers_dev: true`) and `src/lib/canonical-host.ts` 308-redirects it, so origins saved in students' instructions files keep working, including PUTs. `astro.config.mjs` `site` and `Layout.astro`'s `<link rel="canonical">` use the same domain. Content and prompts still use the request's origin, never a hardcoded domain, so previews and local dev work.

## Commands

- `npm run dev` — local dev server
- `npm run dev:worker` — builds, applies D1 migrations locally, and runs the built Worker under `wrangler dev` on port 8788 with state in `.wrangler/state`, the target for the verify scripts and the progress WebSocket. It passes `--local-upstream localhost:8788` because otherwise `wrangler dev` rewrites every request's URL to the `cfdev.school` route, so server-built URLs (`/api/courses`' `markdownUrl`s, stored `exercise_url`s) would point at production. `npm run dev` doesn't have this problem.
- `npm run build` — `astro build`
- `npm run test` — `vitest run`
- `npm run lint` — `eslint .`
- `npm run deploy` — applies D1 migrations, then build + `wrangler deploy` to production (also run by `.github/workflows/deploy.yml` on merge to `main`)
- `npm run preview:deploy` / `npm run preview:destroy` — used by `.github/workflows/preview.yml` for per-PR previews, not meant to be run by hand
- `npm run verify:interview` — scripted fake-agent smoke test against a real running Worker (`BASE_URL` env var, defaults to `http://localhost:8788`); run this against `npm run dev:worker` after touching the interview API
- `npm run verify:exercise` / `npm run verify:exercise-kv` — same idea, for the Workers course's two exercises; run against `npm run dev:worker` after touching the exercise/progress API
- `npm run verify:external-course` — same idea, for a course hosted elsewhere: report a manifest, take its interview, complete every exercise

## cf, not Wrangler, in student-facing content

All course, exercise, and `/llms.txt` content tells students' agents to use `cf` (Cloudflare's new CLI, open beta since 2026-09-28, `npm i -g cf`), not Wrangler: `cf init`, `cf dev`, `cf deploy`, `cf auth login`, `cf kv namespaces create`, with bindings declared in `cloudflare.config.ts` via `bindings.*` from `cf/config`. The CLI exercise (`courses/agent-setup/exercises/03-cli.md`) adds Cloudflare's official versioned snippet (`## Cloudflare CLI - cf - v20260928`) to the student's global instructions file; if Cloudflare publishes a newer version of that snippet, update it there. `cf` is new and not in model training data, so verify commands against the installed CLI (`cf --help`, `cf cli search "..."`) before writing them into content. This repo itself still builds and deploys with Wrangler (`wrangler.jsonc`, `scripts/preview-env.mjs`); that's separate from what students are taught.

## Cloudflare docs are canon

developers.cloudflare.com is the source of truth for every Cloudflare fact in this repo: course and exercise content, `/llms.txt`, and anything an agent tells a student about Cloudflare. Fact-check against it, not training data, and link to the relevant page from content where it helps.

- Every page has a Markdown version at `<page URL>index.md`, and https://developers.cloudflare.com/llms.txt indexes them all.
- For searching across pages, keep a shallow clone of the public docs repo outside this repo (never a submodule or vendored copy): `git clone --depth 1 https://github.com/cloudflare/cloudflare-docs ~/.cache/cloudflare-docs`. Refresh it before a fact-checking session with `git -C ~/.cache/cloudflare-docs fetch --depth 1 origin production && git -C ~/.cache/cloudflare-docs reset --hard FETCH_HEAD`. Pages are in `src/content/docs/<product>/`, shared snippets they render in `src/content/partials/`, the changelog in `src/content/changelog/`, and compatibility flags in `src/content/compatibility-flags/`.
- `cf` and `cloudflare.config.ts` have their own docs: `src/content/docs/cf/` and `src/content/partials/workers/cloudflare-config.mdx` (rendered at https://developers.cloudflare.com/cf/projects/cloudflare-config/). Most other pages show Wrangler config; `src/content/docs/cf/wrangler/reference.mdx` maps Wrangler settings to `cloudflare.config.ts`.
- Pages can lag behind each other. When two disagree, the changelog usually settles it (e.g. the Worker Loader binding page still said "closed beta" months after the Dynamic Workers open beta changelog). When the docs and the real CLI or runtime disagree, test it, teach what actually happens, and note the discrepancy in this file.

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

Zod-schema-first ("ship types, not docs", https://shiptypes.com/): schemas are the contract, and TypeScript types and the OpenAPI doc are derived from them.

- `src/schemas/*.ts` are the source of truth for API request/response shapes and D1 table shapes. `src/schemas/student.ts` and `src/schemas/interview.ts` share a `studentIdSchema` piece, reuse it rather than re-declaring the ID regex.
- `migrations/*.sql` are hand-written D1 migrations kept in sync with the schemas by hand (there's no schema-to-SQL generator in use). Apply with `wrangler d1 migrations apply cloudflare-dev-school --local` (dev) or `--remote` (production/preview); this also runs automatically as part of `npm run deploy` and `scripts/preview-env.mjs`.
- PR previews apply migrations to the production D1 database as soon as the PR is opened (see "CI/CD"), while production still runs `main`. So a migration must not break the code on `main`: add new tables or columns, and drop old ones in a later PR, once nothing on `main` reads them. For example, #75 and #76 replaced tables but left them in place, and `migrations/0010_drop_replaced_tables.sql` dropped them once both were on `main` (#82).
- `src/lib/openapi.ts` builds the OpenAPI document with `zod-openapi`'s `createDocument`, reusing the same schemas. Served at `/api/openapi.json` via `src/pages/api/openapi.json.ts`.
- API routes live under `src/pages/api/*.ts` as Astro endpoints (`export const POST/GET: APIRoute = ...`), reading bindings via `import { env } from "cloudflare:workers"` (typed in `src/env.d.ts`), the same pattern OpenCode School uses. Astro's built-in CSRF check rejects same-origin-looking `POST` requests without a matching `Origin` header (e.g. plain `curl -X POST`); this is expected, real browser `fetch()` calls send `Origin` automatically. Add `export const prerender = false;` to every API route, they must run per-request, not at build time.

## Enrollment

`src/lib/student-id.ts` and the cipher-reveal/confetti animation in `src/lib/enroll-client.ts` are adapted from opencodeschool/opencode.school (Apache-2.0): this app copies OpenCode School's enrollment flow wholesale. Keep the copyright headers when touching these files. The student ID format (`adjective-noun-1234`) and the two word lists are copied verbatim; don't change them without a reason, exercises and docs may reference the format.

The homepage ID card (`src/components/StudentIdCard.astro`) is always visible, showing a sample ID (`smooth-operator-4629`) until the student enrolls; `enroll-client.ts` then cipher-reveals their real ID over it. Don't re-add `hidden` to the card, the logged-out design depends on the sample. It's one element in both the visitor hero and the enrolled dashboard (see "Student dashboard"), resized by CSS, so the reveal code doesn't need to know which one is showing.

`src/lib/enroll-client.ts` dispatches a `cfDevSchool:enrolled` custom event (`ENROLLED_EVENT`) on `document` whenever the student ID is shown, on fresh enrollment or a cached reload. Other client scripts (e.g. `src/lib/dashboard-client.ts`) listen for this instead of duplicating enrollment/localStorage logic. If a page adds another `initX()` client module that reacts to enrollment, register its listener before calling `initEnrollment()` in the page's `<script>` block, since a returning visitor's cached reveal dispatches the event synchronously.

## Harness detection and `/llms.txt`

There is no student-facing harness picker (removed in #37). The visitor homepage (headline, ID card, "Works with" logo grid, sidebar always visible, GitHub link only in the header via `Layout`'s `minimalHeader`) follows the "Homepage — H" design explored in Paper. Once enrolled it becomes a dashboard (see "Student dashboard") whose prompts come from the harness-free `buildPrompt()` in `src/lib/agent-prompt.ts`, embedding the student ID and `window.location.origin`, so they work unmodified in production, PR previews, and local dev. Other pages show prompts with `AgentPrompt.astro`. The agent figures out its own harness itself once it fetches `/llms.txt`, there's no `cfDevSchool.harnessId` localStorage key anymore. Each exercise is one Markdown file, written for any agent and served unchanged to humans (`/courses/{name}/{exercise}`) and, raw, to agents (see "Courses and exercises"). There are no per-harness variants: `agent-instructions` tell the agent to pull harness-specific facts from its harness profile (see "AI harness research data"), or list short per-agent steps inline where a profile field doesn't cover it (e.g. the Tools and Skills exercises). The agent still detects its own harness ID, it needs it for the profile and for exercise completions.

## Interview

Every course has an interview, stored per course as question-and-answer pairs (#76): `src/schemas/interview.ts` / `migrations/0009_create_interviews.sql` / `src/pages/api/students/[id]/interviews.ts`. A row in `interviews` is keyed on (student, course) with `responses` (JSON, `[{ question, answer }]`, `answer` a string or a string array), a one-sentence `summary`, and `updated_at`. Each answer carries its question's text because the default interview's questions are agent-written, so there are no question IDs or per-field columns. `GET /api/students/{id}/interviews` returns every course's interview in catalog order (empty list, not 404, before the first). `PUT` takes `{ course, responses, summary }` and replaces that course's whole interview, so agents re-send every response when one changes; it rejects courses not in the catalog. Answers shape tone, depth, and comparisons only, never which exercises run.

Agent setup's interview (`courses/agent-setup/exercises/00-interview.md`, never quizzed) is the baseline every course reads: AI agent experience, platforms deployed to before, learning goals, and quiz preference, plus the auto-detected OS stored as a pair too. These four questions are capped at four on purpose: Claude Code's `AskUserQuestion` takes at most four per call, so swap a question rather than add a fifth. The agent also checks Node, `cf`, `cf auth whoami`, and an existing instructions file without storing them. Its `agent-instructions` give the exact question texts (so later agents recognize them) and the procedure (all questions asked at once, kept short, via the harness's structured question tool if it has one, else one numbered plain-text message; students can change any answer later just by telling their agent). The homepage prompt (`buildPrompt()` with no context) points at it.

`/llms.txt`'s "Interviews" section holds the generic procedure for every course: use the course's own interview or the default one (`src/content/default-interview.md`, 2 to 4 agent-written questions), never more than 4 questions, never quizzed, and read all of the student's interviews before starting any course. Agents mark an interview complete with `PUT /api/progress` like any exercise. The interview PUT also broadcasts progress (see "Live progress"), since each course's `interviewSummary` is part of it.

Verify the interview API end to end with `npm run verify:interview` (a "scripted fake-agent": it fetches `/llms.txt`, then exercises the exact HTTP contract llms.txt documents against a real running Worker, it isn't simulating an LLM conversation). It saves interviews for both courses, re-sends one, and checks the new summary arrives over the progress WebSocket. Run it against `npm run dev:worker` after touching this code, and again against a PR preview (`BASE_URL=https://cloudflare-dev-school-pr-N.ziki.workers.dev`) before merging. Delete the rows it creates from D1 afterward, it's a real enrollment against whatever database `BASE_URL` points at.

## Courses and exercises

Built-in courses live in `courses/<name>/` at the repo root, or `courses/<track>/<name>/` for a course in a track (`TRACKS` in `src/data/courses.ts`, in display order: `projects` then `fundamentals`, labeled by `TRACK_LABELS`; Agent setup stays at the top level). URLs never include the track, so course names must be unique across tracks. The track directory is the only place a track is recorded: `getBuiltInCourses()` derives each course's `track` from its entry's `filePath`, and `GET /api/courses` exposes it. Tracks are groupings only, students complete courses, not tracks, and projects never require a fundamentals course. Only built-in courses have tracks. Built-in courses are in the same format courses hosted elsewhere use (see "Courses hosted elsewhere"), loosely following the Agent Skills spec (https://agentskills.io/specification):

- `COURSE.md`: frontmatter `name` (matches the directory), `description`, and optional `license`, `compatibility`, and `metadata` (`author`), then a `# Title` and intro prose. Schemas in `src/schemas/course.ts`. Both frontmatter schemas are strict (`z.strictObject`), so an unknown or misspelled key fails `npm test` and the build instead of being dropped. Courses hosted elsewhere never go through them, the server doesn't read their files.
- `exercises/NN-slug.md`: ordered by filename (natural sort). The slug is the filename without `.md` or its number prefix, so renumbering to insert an exercise doesn't change slugs. Frontmatter is optional: `description`, and `agent-instructions` (for the agent only, not rendered). The body starts with a `# Title` and is read by both students and agents. An exercise slugged `interview` always comes first; a course without one gets `src/content/default-interview.md`, which tells the agent to write its own questions. The rules live in `src/lib/course-format.ts`.
- Catalog order is `COURSE_ORDER` in `src/data/courses.ts`, since course directories can't take number prefixes when `name` has to match the directory. `REQUIRED_COURSE` (Agent setup) is required softly: `/llms.txt` tells agents to steer students there first, the API doesn't enforce it. To add a course, add its directory and its name to `COURSE_ORDER`; `src/data/courses.test.ts` checks the real files against the format, frontmatter included (parsed with `yaml`, since CI runs tests but not `astro build`).
- `getBuiltInCourses()` (`src/lib/courses.ts`) loads the `courses`, `exercises`, and `defaultInterview` content collections (`src/content.config.ts`) and applies the ordering rules. The pages, the sidebar, and `GET /api/courses` all go through it.
- Agents read courses as raw Markdown: `/courses/{name}/COURSE.md` and `/courses/{name}/exercises/{file}` serve the repo files as they are (prerendered from `import.meta.glob` `?raw` imports in `src/lib/course-files.ts`), plus the default interview at `/courses/{name}/exercises/interview.md` for a course without one. `GET /api/courses` lists each course and exercise with its `markdownUrl`.
- Pages: `/courses` (catalog: Agent setup, then a section per track, "Coming soon." for an empty one), `/courses/{name}` (intro, a prompt for the whole course, exercise list), and `/courses/{name}/{exercise}` (see "Live progress").
- The sidebar (`CurriculumSidebar.astro`, the design from #95) shows Agent setup with its exercises, numbered from `00`, then each track's label and courses (or "Coming soon"). A track course's exercises show only while you're on one of its pages. Each track shows its first five courses, the rest behind a "More +" / "Less −" toggle (a visually hidden checkbox, opened automatically when you're on a course behind it). Agent setup's exercise list collapses to its title once the course has a `completedAt`, unless you're on one of its pages: `curriculum-sidebar-client.ts` sets `data-collapsed` on `[data-collapse-when-complete]`, without animation since it happens on page load. Astro doesn't allow JSX in frontmatter functions, which is why the template is one loop over `sections`.
- The "next" button after an exercise comes from `nextStep()` (`src/lib/courses.ts`): the next exercise, then the next course in the same track, then `/courses`. Finishing Agent setup leads to `/courses` to pick a track, as does the homepage's "Next" once Agent setup is done. `/llms.txt` tells agents to ask the student which direction they want once Agent setup is finished (in conversation, not stored), and to go lighter in projects on what completed fundamentals covered. Pages show the content's `# Title` in their own header, so `Layout.astro` hides a `.prose` block's leading `h1` with CSS. Astro 7's default Markdown processor (Sätteri) doesn't run remark plugins, so don't reach for one to strip it.
- Bindings (`courses/fundamentals/bindings/`) has its own one-question interview and four exercises that build on one Worker: live objects (text, secret, and an ID-less KV binding), a service binding to a second Worker with no public URL, the same code against different resources (remote bindings, `--mode`), and a Dynamic Worker sandbox. See "Bindings course" for the `cf` behavior it relies on.
- The Workers course's exercises carry their own verification in `agent-instructions`: for "deploy-a-worker" the agent fetches the deployed URL and confirms the expected text before marking it complete; for "add-a-binding" it does a two-step write-then-separate-read round trip against the deployed URL, to prove the binding persists data rather than a single request echoing something back. Both also carry light teaching beats (brief explanations adapted to the interview answers, plus a comprehension check), but completion stays gated on the agent's own verification. "add-a-binding" soft-requires "deploy-a-worker" (the agent checks progress first).
- Progress is keyed by course and exercise (#75), see "Live progress". `exerciseCompletions()` in `src/lib/course-progress.ts` looks up one exercise's completions in a `Progress` object; client code goes through it.

Verify the Workers course with `npm run verify:exercise` and `npm run verify:exercise-kv` (sibling scripts, not one parameterized script, to keep each diff small), against `npm run dev:worker` or a PR preview (`BASE_URL=...`). Same caveats as `verify:interview`: real enrollment and completion rows in whatever D1 `BASE_URL` points at, delete them afterward. Neither deploys a Worker or provisions a KV namespace, they only check the HTTP contract.

## Bindings course

Every `cf` command and behavior in `courses/fundamentals/bindings/` was tested against a real account with `cf` v1.0.0-beta.12 (October 2026), and the content was checked against the docs (see "Cloudflare docs are canon"). Re-test before changing these claims, `cf` is in beta:

- `bindings.kv()` with no `id` is created on `cf deploy` (named `<worker>-<binding>`), and later deploys reuse it without an ID in the config. Remote bindings (`dev: { remote: true }`) do need the `id`.
- A Worker with `bindings.secret()` won't deploy until the secret is set; `cf deploy --secrets-file .env` works for new and existing Workers. Local dev reads `.env`.
- `JSON.stringify` of a KV binding is `{}`, and RPC methods on a service binding don't show up when enumerated.
- `bindings.worker({ worker })` takes a name or an imported `defineWorker` config; only the config gives typed RPC methods (documented). Locally, `dev: { remote: true }` on the binding calls the deployed Worker with `ctx.props` delivered. Running the other Worker under a second `cf dev` also works, but `ctx.props` arrived empty that way. The Vite plugin's `auxiliaryWorkers` (the docs' single-command option for multiple Workers) rejects a `cloudflare.config.ts` path. `workersDev: false` makes the Worker's workers.dev URL return a Cloudflare error page (code 1042, though the docs define 1042 as something else, so the course doesn't cite it).
- `defineConfig` takes a function of `{ mode }`, and `cf deploy --mode staging` with a different Worker name provisions separate resources.
- `bindings.workerLoader()` and `ctx.exports` work with no extra config at compatibility date 2026-10-01, locally and deployed. Dynamic Workers need Workers Paid once deployed (per the pricing docs; only tested on a paid account), so exercise 04 verifies locally.
- New deploys can take about 20 to 30 seconds to serve the new version.
- `cf workers delete` and `cf kv namespaces delete` abort when run non-interactively unless given `--force`.

## Courses hosted elsewhere

Students can take a course hosted anywhere (#77): a git repo in the built-in format, or a single-file `COURSE.md` whose `##` sections are exercises. The server never fetches course content. The student's agent reads the course and reports its manifest with `PUT /api/students/{id}/courses` (`{ url, title, description?, author?, exercises: [{ slug, title, url }] }`), stored in `external_courses` (`migrations/0011_create_external_courses.sql`, schemas in `src/schemas/course.ts`). `/llms.txt`'s "Courses hosted elsewhere" section holds the procedure.

- A course hosted elsewhere is identified by its URL, normalized by `normalizeCourseUrl()` (`src/lib/course-url.ts`): https only, lowercase host, no credentials, trailing slash, `.git`, query, or fragment. Request bodies' `course` field (`courseRefSchema`) takes a built-in name or any form of that URL; `resolveCourse()` in `src/lib/external-courses.ts` turns either into the course's ID and exercise list, for the progress and interview routes.
- The server puts `interview` first, adding Dev School's default (served raw at `/default-interview.md`, from the same `src/content/default-interview.md`) when the course has none. Reporting again replaces the manifest but keeps `created_at`, which orders the student's reported courses.
- Reported exercise URLs must be https. The added default interview's URL is on the request's origin, so it's `http://` in local dev; the stored-course schema allows that.
- `PUT /api/progress` rejects exercises missing from the reported manifest and takes `exercise_url` from it. `GET /api/progress` lists reported courses in `externalCourses`, after the built-in `courses`, with their titles and exercise URLs. Reporting a course broadcasts progress too.
- Agent setup's Instructions exercise has the agent add a "Cloudflare Dev School" section (student ID, plus "read <origin>/llms.txt") to the student's global instructions file, so a later session can take a course by URL.

Verify with `npm run verify:external-course` against `npm run dev:worker` or a PR preview, with the same caveats as the other verify scripts. It doesn't clone or fetch a real course, it only checks the HTTP contract.

## Authors

`/authors` (`src/pages/authors.astro`, #79) is for people who want to write a course: a pitch, a copyable prompt (`buildAuthorPrompt()` in `src/lib/agent-prompt.ts`, no enrollment needed) that points the author's agent at `/authors.md`, and the format reference. It's linked from the sidebar ("Write a course") and from `/courses`.

- The guide is one file, `src/content/authors.md`, shaped like an exercise: its `agent-instructions` frontmatter is the procedure for the author's agent (ask about the course, outline it, scaffold it, write checkable exercises, check the rules, then test it by taking it as a student), and its body is the format reference. `/authors.md` serves the file raw (`src/pages/authors.md.ts`), and `/authors` renders the body from the `authorsGuide` collection, so the two can't drift.
- `src/lib/authors-guide.test.ts` checks the guide's stated rules (name and description limits, slug and order examples, the interview slug, links to built-in course files) against the course-format code. When the format changes, update the guide in the same PR.
- Packaging the guide as an installable `create-course` Agent Skill waits until the repo is open source.

## Live progress

Exercise completion is done by the student's agent (`PUT /api/progress/{studentId}`), and open browser tabs update without polling or reloads:

- `ProgressHub` (`src/durable-objects/progress-hub.ts`, binding `PROGRESS_HUB`) is one Durable Object per student, addressed with `getByName(studentId)`. Browsers hold a hibernatable WebSocket to it; `PUT`/`DELETE` progress calls its `broadcast()` RPC after the D1 write (a failed broadcast is logged, never fails the request).
- `GET /api/progress/{studentId}/live` (WebSocket upgrade) is routed to the DO in `src/worker.ts` before Astro sees it, so it isn't an Astro API route and isn't in `/llms.txt` or the OpenAPI doc. It's browser-only, agents never need it.
- `src/lib/progress-client.ts`'s `subscribeToProgress(studentId, listener)` is the only client entry point: one shared socket per page, an HTTP fetch on every (re)connect so missed updates aren't lost, exponential-backoff reconnect, and a `"ping"` keepalive answered by the DO's auto-response (doesn't wake it from hibernation). The sidebar, exercise pages, and the homepage all subscribe through it; don't add separate progress fetches. The sidebar's client also fills in the completion check of every `[data-course][data-exercise]` item on the page, so a page's own exercise list (e.g. on a course page) needs no subscription of its own.
- Exercise pages (`src/pages/courses/[name]/[exercise].astro` + `src/lib/exercise-client.ts`) show the OpenCode School-style agent prompt, a completed banner, and a footer that reads "Complete this exercise in your agent to continue" until the exercise is complete, then becomes a link to the next exercise (or the next course, or `/courses`). There's no manual mark-complete button: completion is the agent's call. Once an exercise is complete its prompt is hidden behind a "Redo this exercise" button in the completed banner; revealing it shows the redo wording and keeps it open through later progress updates.
- Completions are per harness (#52): `PUT /api/progress` takes `{ course, exercise, harness, model? }`, and the key is (student, course, exercise, harness), so a student can complete an exercise once per agent (`migrations/0008_course_progress.sql`). The server fills in `exercise_url` (the exercise page on the request's origin, so PR previews store preview URLs) and rejects exercises that aren't in the catalog or the student's reported manifest. `GET /api/progress` returns every built-in course and exercise in order, then reported courses in `externalCourses`, each exercise with its completions (oldest first, empty if incomplete), and each course with its `interviewSummary` once it has an interview. `loadProgress()` and `broadcastProgress()` live in `src/lib/progress-store.ts`, shared by the progress, interview, and reported-course routes. The exercise banner names each agent ("...using Claude Code and on ... using OpenAI Codex", `generic` reads as "an unknown agent"), and once complete the prompt (behind "Redo this exercise") asks the agent to redo it.
- Course completion is sticky: the same D1 batch as the exercise upsert does an `INSERT OR IGNORE` into `course_completions` once every current exercise in the course has a completion from any harness. It's never revoked or updated, even if the course gains exercises later, so the first completion date sticks. Only `DELETE /api/progress` (reset) clears it.
- Interview summaries live on interviews, not completions (#76). `PUT /api/students/{id}/interviews` broadcasts the student's progress after its D1 write, so when an agent re-sends an interview with a changed answer, the dashboard's "About you" (Agent setup's `interviewSummary`) updates live; there's no separate interview broadcast.
- The enrolled homepage is a dashboard driven by live progress, see "Student dashboard".
- `/profile` (`src/pages/profile.astro` + `src/lib/profile-client.ts`, #78) lists every course the student has started, from `startedCourses()` in `src/lib/course-progress.ts`: a built-in course once it has an interview or a completion, a reported course as soon as it's reported. Built-in courses link to their pages and reported ones link out. Each exercise shows its per-agent completions, and a completed course whose exercises don't all have a completion shows "N new exercises since you finished". The dashboard's "Your courses" lists the same courses, linking to `/profile`. Both pages get built-in titles from `catalogCourses()` (`src/lib/courses.ts`) in a `data-catalog` attribute, since the student's ID only exists client-side.
- Titles and URLs of reported courses come from the student's agent: render them with `textContent` and DOM APIs, never as HTML. Elements created by client scripts need `:global()` selectors in a page's scoped `<style>`, since they don't get Astro's scoping attribute.
- Anything that appears or disappears in response to live progress uses `setVisible()` from `src/lib/reveal.ts` (height + fade + slide, skipped for `prefers-reduced-motion`) rather than toggling `hidden` directly. It tracks its target state in `data-reveal-target`, so don't mix it with direct `hidden` writes on the same element.
- To exercise the socket by hand: `npm run dev:worker` (its `--persist-to` is needed, otherwise local D1 state lives under `dist/server/` and has no tables), open a page while enrolled, and `PUT` progress with `curl` (send an `Origin` header).

## Student dashboard

Once a student is enrolled, the homepage (`src/pages/index.astro`) turns from the visitor hero into a dashboard, following the "Homepage — I1/I2" designs (light and dark) in Paper's Scratchpad file.

- Both are server-rendered on one page, since the student ID only exists in localStorage. An inline script at the top of the page sets `data-enrolled` on `<html>` before first paint (reading the same key as `enroll-client.ts`'s `STORAGE_KEY`), and CSS hides `.visitor-only` or `.student-only` from it, so returning students never see the hero. A fresh enrollment switches over right away (`dashboard-client.ts` sets the attribute), and the reveal plays on the smaller card.
- `buildDashboard()` (`src/lib/dashboard.ts`, unit-tested) turns progress plus the catalog into what's shown. "Up next" continues the unfinished course with the most recent completion; with none, it's Agent setup's first incomplete exercise until Agent setup is done, then a choice between the tracks (tracks with courses first, each linking to its first unfinished course) plus `buildChooseCoursePrompt()`. Also "Your courses" (one bar segment per exercise), "About you" (Agent setup's interview summary), and "Your agents" (exercise completions per harness).
- `src/lib/dashboard-client.ts` renders it on every progress update. "Up next" stays invisible (`data-loading`) until the first update, falling back to Agent setup's interview after 1.5s if progress doesn't load. The visitor hero's `h1` rule is scoped to `.visitor-only` so it doesn't hit the dashboard title.

`/llms.txt` (`src/pages/llms.txt.ts`, prerendered, format modeled on OpenCode School's) only documents API endpoints that actually exist today. When a ticket adds a new API route students' agents need to know about (interview, progress, etc.), update this file in the same PR, don't let it drift ahead of or behind the real API.

## Code block copy buttons

`src/lib/code-copy-client.ts` (`initCodeCopyButtons`, called from the exercise page and `/authors` scripts) wraps every `.prose pre` (one-liners included) in `.code-block` and adds an icon-only copy button on the right that flips to a check + "Copied" for 2s. Blocks fenced as ```` ```text ```` (diagrams like file trees) get no button, so fence anything nobody would paste that way. Styles for these and for all rendered Markdown (`.prose`: headings, lists, code blocks, tables) live in the global block in `src/layouts/Layout.astro`, shared by exercise pages, course pages, and `/authors`; don't re-scope them to one page.

## Disenroll

`/disenroll` (`src/pages/disenroll.astro`, client logic in `src/lib/disenroll-client.ts`) copies OpenCode School's disenroll page layout: two options, not one.

- **Reset progress**: `DELETE /api/progress/{studentId}` (same file as the other progress routes) deletes the student's rows from `course_exercise_completions` and `course_completions` but keeps the `students`, `interviews`, and `external_courses` rows. This is a real server-side delete, unlike everything else on this page.
- **Disenroll completely**: purely client-side, clears the `cfDevSchool.student` localStorage key and redirects home. It never calls the server; per this app's no-accounts model there's no student data to delete server-side on request, only progress (handled by the option above).

The page shows an enroll nudge instead of the two options for logged-out visitors. The sidebar (`CurriculumSidebar.astro`) only shows the "Account" section (containing the Profile and Disenroll links) once enrolled, `curriculum-sidebar-client.ts` toggles it both on load and reactively on the `cfDevSchool:enrolled` event, so it appears immediately after a fresh enrollment click without a reload.

## Dependency pinning

The global `~/.npmrc` sets `min-release-age=7`, so `npm install <pkg>@latest` can fail with `ETARGET` for packages published in the last week. Check `npm view <pkg> time --json` and pin an exact version older than 7 days when this happens. Don't work around it by editing the global npmrc.

## CI/CD

- `.github/workflows/ci.yml`: lint and test run as separate parallel jobs on every PR and on push to `main`.
- `.github/workflows/preview.yml`: per-PR preview Worker at `cloudflare-dev-school-pr-<N>.ziki.workers.dev`, torn down on PR close. `scripts/preview-env.mjs` strips `routes` from the built `dist/server/wrangler.json` before deploying, so a preview never claims `cfdev.school`. Triggered independently of `ci.yml` (no `needs:` between them) so previews don't wait on lint/test. Uses the **shared production resources** strategy (previews share the production D1 database and SESSION KV namespace). As of the enrollment flow (#11), previews now write real student rows into the production D1 database when testing enrollment by hand, this is an accepted tradeoff for now, not a bug. Revisit and switch to per-PR seeded/empty D1 if that becomes a real problem (e.g. once interview/progress data makes stray preview rows more than just noise).
- After a successful preview deploy, `scripts/preview-env.mjs` appends a list of links to the preview pages the PR affects at the end of the PR body (between `<!-- preview-links:start/end -->` markers, replaced on each push). The file-to-path mapping lives in `scripts/preview-links.mjs`; extend it when adding new pages or routes. It runs inside the deploy job rather than a `deployment_status` workflow because events created with `GITHUB_TOKEN` don't trigger other workflows.
- `.github/workflows/deploy.yml`: deploys to production on push to `main`.
- `.github/workflows/refresh-harnesses.yml`: daily (and manual `workflow_dispatch`) harness data check, see "AI harness research data". It runs lint and test itself before opening its PR, because PRs created with `GITHUB_TOKEN` don't trigger `ci.yml` or `preview.yml`. Needs "Allow GitHub Actions to create and approve pull requests" enabled in the repo's Actions settings.
- `anthropics/claude-code-action` needs `github_token: ${{ github.token }}` in this repo; without it the action tries to get a Claude GitHub App token (needs `id-token: write` and the app installed) and fails.
- Required repo secrets: `CLOUDFLARE_API_TOKEN` (scoped to `Workers Scripts:Edit` + `D1:Edit`), `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY` (refresh-harnesses only).

## Testing Astro components

`vitest.config.ts` calls `getViteConfig({}, { configFile: false })`. The `{ configFile: false }` MUST be the second argument (`inlineAstroConfig`), not the first (`userViteConfig`), or it's silently ignored. This skips loading `astro.config.mjs` (and its `@astrojs/cloudflare` adapter) for tests, working around an upstream incompatibility between Vitest 4's module runner and the Cloudflare Vite plugin (https://github.com/withastro/astro/issues/15878, unresolved as of this writing). Component tests render `.astro` files via `astro/container`'s `experimental_AstroContainer` and don't need real Worker bindings; if a test ever does need `env.DB`/`env.SESSION`, mock them rather than re-enabling the adapter here.

`configFile: false` also means `astro:content` collections don't resolve in tests (`getCollection()` comes back empty; tried a dedicated adapter-free `astro.config.test.mjs` too, no difference, the content layer needs Astro's real dev/build orchestration). `vi.mock("astro:content", ...)` with fake entries in any test that touches a route using `getCollection`/`render`, the same way `cloudflare:workers` is mocked. Page and component tests share `src/test/fake-content.ts` (three small courses shaped like the real ones, with `filePath`s so tracks resolve), since the sidebar on every page loads the courses. Route tests that touch D1 use `createSqliteD1()` from `src/test/sqlite-d1.ts`: an in-memory `node:sqlite` database with every migration applied, so they run the route's real SQL (prefer it over faking D1 by matching SQL strings). Don't try to unit-test real rendered Markdown/MDX body content through `render()`, its output is a genuine compiled Astro component that isn't practical to fake; verify that path against a real running Worker (`wrangler dev`) instead.

Astro treats every file under `src/pages/` as a route, test files included. That's harmless for most tests, but one that mentions `getStaticPaths` makes the build warn; test that logic from outside `src/pages/` (e.g. `src/lib/course-files.test.ts`).

## Known accepted risks

- Enrollment is anonymous and unauthenticated, with no rate limiting, so spam enrollments and guessed student IDs are possible. Revisit only if it becomes a real problem.
- `npm audit` reports high-severity advisories in `sharp`/`libheif`, transitively pulled in by `wrangler`'s dev tooling (`miniflare`/`@cloudflare/vite-plugin`). No fix is available without downgrading `wrangler` to `4.15.2`. This only affects local dev image processing, not the deployed Worker. Re-check `npm audit` when upgrading `wrangler`.

## Issue tracker

Issues live as GitHub issues on this repo, via the `gh` CLI.

## Planning approach

We're borrowing ideas from Matt Pocock's `mattpocock/skills` (https://github.com/mattpocock/skills), specifically `grill-me`, `to-spec`, and `to-tickets`, without installing them as skills:

- **Grilling**: interrogate a plan or spec one question at a time to surface gaps and contradictions before building.
- **Spec-first**: turn an agreed-upon conversation/plan into a single written decision record (a GitHub issue) before splitting work across sessions.
- **Ticketing**: break a spec into small, independently demoable tickets, each a vertical slice (schema + API + UI + tests), sized to fit one fresh context window, with explicit blocking dependencies between them.

Apply these ideas freely when planning work as GitHub issues (#73, split into #74 through #79, is an example), but there's no separate tracker config or skill install to maintain here, just plain GitHub issues.

## Keep this file current

This file must be revised whenever the stack, scripts, or conventions change. Don't let it drift from what's actually true about the repo.
