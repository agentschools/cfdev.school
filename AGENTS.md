# Cloudflare Dev School — Agent Notes

This repo is Cloudflare Dev School, a web app that teaches people how to build on Cloudflare using their AI-powered agent harness of choice. It's modeled on OpenCode School.

- `plan.human.md`: the original human-written plan.
- `plan.agent.md`: the agent-refined plan, produced by grilling `plan.human.md`. Where the two disagree, `plan.agent.md` wins.
- v1 assumes a working agent and covers five setup lessons followed by one exercise, "Deploy your first Worker." The deployed Worker is the final result; use `plan.agent.md` for the current scope.
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
- `npm run deploy` — build + `wrangler deploy` to production (also run by `.github/workflows/deploy.yml` on merge to `main`)
- `npm run preview:deploy` / `npm run preview:destroy` — used by `.github/workflows/preview.yml` for per-PR previews, not meant to be run by hand

## AI harness research data

`src/data/harnesses.ts` is a manually maintained, Zod-schema-typed data source covering the harnesses this school supports (Claude Code, Codex, OpenCode, Pi, generic fallback): instructions file location, CLI command, skills support/install location/restart behavior, config/MCP file locations, model comparison data, and subscription-vs-API-billing policy for third-party routing. It's consumed by the homepage harness cards and lesson content, not re-derived per lesson.

Each harness profile carries its own `lastVerified` date and a `sources` list. This data goes stale fast (pricing and vendor policy on third-party subscription routing change often), so it's a manual process, not a scheduled job:

- Before shipping or editing a lesson that depends on a harness's data, re-verify its entries against current sources (use web search, don't rely on training data) and bump `lastVerified`.
- Add new sources when you change a claim; don't delete old ones unless they're wrong, they help explain why a value is what it is.
- If you can't verify something confidently, leave a note in `summary`/`notes` saying so rather than guessing.

## Harness icons

`public/icons/agents/<harness>/{light,dark}.svg` are borrowed directly from `developers.cloudflare.com/agent-setup/`'s own icon URLs (`https://developers.cloudflare.com/icons/agents/<slug>/{light,dark}.svg`), which only has icons for Claude Code, Codex, and OpenCode, not Pi or a generic fallback. Referenced from `src/data/harnesses.ts`'s optional `icon` field and swapped by `HarnessCard.astro` via `prefers-color-scheme` (no JS). If Cloudflare adds an icon for a harness that's missing one here, re-fetch it from the same URL pattern rather than sourcing a logo elsewhere.

## API, schemas, and migrations

Zod-schema-first (see `plan.agent.md`'s "ship types, not docs" section):

- `src/schemas/*.ts` are the source of truth for API request/response shapes and D1 table shapes. `src/schemas/student.ts` is the first one.
- `migrations/*.sql` are hand-written D1 migrations kept in sync with the schemas by hand (there's no schema-to-SQL generator in use). Apply with `wrangler d1 migrations apply cloudflare-dev-school --local` (dev) or `--remote` (production/preview); this also runs automatically as part of `npm run deploy` and `scripts/preview-env.mjs`.
- `src/lib/openapi.ts` builds the OpenAPI document with `zod-openapi`'s `createDocument`, reusing the same schemas. Served at `/api/openapi.json` via `src/pages/api/openapi.json.ts`.
- API routes live under `src/pages/api/*.ts` as Astro endpoints (`export const POST/GET: APIRoute = ...`), reading bindings via `import { env } from "cloudflare:workers"` (typed in `src/env.d.ts`), the same pattern OpenCode School uses. Astro's built-in CSRF check rejects same-origin-looking `POST` requests without a matching `Origin` header (e.g. plain `curl -X POST`); this is expected, real browser `fetch()` calls send `Origin` automatically. Add `export const prerender = false;` to every API route, they must run per-request, not at build time.

## Enrollment

`src/lib/student-id.ts` and the cipher-reveal/confetti animation in `src/lib/enroll-client.ts` are adapted from opencodeschool/opencode.school (Apache-2.0), per `plan.agent.md`'s "copy OpenCode School's enrollment flow wholesale." Keep the copyright headers when touching these files. The student ID format (`adjective-noun-1234`) and the two word lists are copied verbatim; don't change them without a reason, lessons and docs may reference the format.

`src/lib/enroll-client.ts` dispatches a `cfDevSchool:enrolled` custom event (`ENROLLED_EVENT`) on `document` whenever the student ID is shown, on fresh enrollment or a cached reload. Other client scripts (e.g. `src/lib/harness-picker-client.ts`) listen for this instead of duplicating enrollment/localStorage logic. If a page adds another `initX()` client module that reacts to enrollment, register its listener before calling `initEnrollment()` in the page's `<script>` block, since a returning visitor's cached reveal dispatches the event synchronously.

## Harness selection and `/llms.txt`

Once enrolled, `HarnessPicker.astro` (backed by `src/lib/harness-picker-client.ts`) lets the student pick a harness from `src/data/harnesses.ts` and shows a copyable prompt (`AgentPrompt.astro`) embedding their student ID and `window.location.origin`, so it works unmodified in production, PR previews, and local dev. The chosen harness is cached in localStorage (`cfDevSchool.harnessId`) alongside the student.

`/llms.txt` (`src/pages/llms.txt.ts`, prerendered, format modeled on OpenCode School's) only documents API endpoints that actually exist today. When a ticket adds a new API route students' agents need to know about (interview, progress, etc.), update this file in the same PR, don't let it drift ahead of or behind the real API.

## Dependency pinning

The global `~/.npmrc` sets `min-release-age=7`, so `npm install <pkg>@latest` can fail with `ETARGET` for packages published in the last week. Check `npm view <pkg> time --json` and pin an exact version older than 7 days when this happens. Don't work around it by editing the global npmrc.

## CI/CD

- `.github/workflows/ci.yml`: lint and test run as separate parallel jobs on every PR and on push to `main`.
- `.github/workflows/preview.yml`: per-PR preview Worker at `cloudflare-dev-school-pr-<N>.ziki.workers.dev`, torn down on PR close. Triggered independently of `ci.yml` (no `needs:` between them) so previews don't wait on lint/test. Uses the **shared production resources** strategy (previews share the production D1 database and SESSION KV namespace). As of the enrollment flow (#11), previews now write real student rows into the production D1 database when testing enrollment by hand, this is an accepted tradeoff for now, not a bug. Revisit and switch to per-PR seeded/empty D1 if that becomes a real problem (e.g. once interview/progress data makes stray preview rows more than just noise).
- `.github/workflows/deploy.yml`: deploys to production on push to `main`.
- Required repo secrets: `CLOUDFLARE_API_TOKEN` (scoped to `Workers Scripts:Edit` + `D1:Edit`), `CLOUDFLARE_ACCOUNT_ID`.

## Testing Astro components

`vitest.config.ts` calls `getViteConfig({}, { configFile: false })`. The `{ configFile: false }` MUST be the second argument (`inlineAstroConfig`), not the first (`userViteConfig`), or it's silently ignored. This skips loading `astro.config.mjs` (and its `@astrojs/cloudflare` adapter) for tests, working around an upstream incompatibility between Vitest 4's module runner and the Cloudflare Vite plugin (https://github.com/withastro/astro/issues/15878, unresolved as of this writing). Component tests render `.astro` files via `astro/container`'s `experimental_AstroContainer` and don't need real Worker bindings; if a test ever does need `env.DB`/`env.SESSION`, mock them rather than re-enabling the adapter here.

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
