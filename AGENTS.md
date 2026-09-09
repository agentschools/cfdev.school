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

## Dependency pinning

The global `~/.npmrc` sets `min-release-age=7`, so `npm install <pkg>@latest` can fail with `ETARGET` for packages published in the last week. Check `npm view <pkg> time --json` and pin an exact version older than 7 days when this happens. Don't work around it by editing the global npmrc.

## CI/CD

- `.github/workflows/ci.yml`: lint and test run as separate parallel jobs on every PR and on push to `main`.
- `.github/workflows/preview.yml`: per-PR preview Worker at `cloudflare-dev-school-pr-<N>.ziki.workers.dev`, torn down on PR close. Triggered independently of `ci.yml` (no `needs:` between them) so previews don't wait on lint/test. Uses the **shared production resources** strategy (previews share the production D1 database and SESSION KV namespace) since there's no schema or real data yet. Revisit and switch to per-PR seeded/empty D1 once a ticket introduces real writes (enrollment, interviews, progress).
- `.github/workflows/deploy.yml`: deploys to production on push to `main`.
- Required repo secrets: `CLOUDFLARE_API_TOKEN` (scoped to `Workers Scripts:Edit` + `D1:Edit`), `CLOUDFLARE_ACCOUNT_ID`.

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
