# Contributing to Cloudflare Dev School

You can help with course content, documentation, accessibility, design, bug
reports, and code. You do not need a Cloudflare account or production credentials
to develop this app locally.

## Find a starting point

Search [existing issues](https://github.com/agentschools/cloudflare-dev-school/issues)
and PRs first. For a small fix, explain the problem in your PR; for a new course,
feature, or broad change, open an issue to agree on the scope before building.
Plans and decisions live in GitHub issues.

New here? Follow the [newcomer guide](docs/newcomer-guide.md) to run the app and
make a first change. A typo, broken link, unclear exercise step, or reproducible
bug report is a useful contribution. Ask for context in the relevant issue when
you need it.

## Set up locally

Install Git and **Node.js 22.12.0 or newer**, including npm. Use a current Node
release supported by the project's dependencies. Fork the repository if you
do not have push access, then clone your fork instead of the URL below.

```sh
git clone https://github.com/agentschools/cloudflare-dev-school.git
cd cloudflare-dev-school
npm ci
git switch -c docs/my-first-change
npm run dev:worker
```

Open <http://localhost:8788>. `dev:worker` builds the app, applies migrations
**locally**, and starts the Worker with D1, session KV, and Durable Objects
simulated locally. State persists in this checkout's ignored `.wrangler/state`.
No Cloudflare login, API token, account ID, or `.env` file is required. Keep
local bindings local; do not add `remote: true` or use `--remote` for this setup.
See [Cloudflare's local D1 guide](https://developers.cloudflare.com/d1/best-practices/local-development/).

For faster page/content iteration, `npm run dev` starts Astro's development
server (normally <http://localhost:4321>; use the URL it prints). Use
`dev:worker` for API/progress verification; stop and restart it after changes
because it runs a built snapshot. Stop either server with Ctrl-C.

## Understand the project

Read [AGENTS.md](AGENTS.md) for architecture and detailed conventions. It applies
to people and coding agents. In particular:

- `courses/`: built-in course and exercise Markdown. The authoring reference is
  `src/content/authors.md`, also available at `/authors` on your local server.
- `src/pages/`: Astro pages and API endpoints; `src/components/` and
  `src/lib/`: shared UI and application logic.
- `src/schemas/`: Zod contracts; `migrations/`: D1 SQL migrations.
- `src/data/harnesses.ts`: verified harness facts; `src/pages/llms.txt.ts`:
  instructions for students' agents.
- Use sentence case in headings, support mobile and light/dark mode, and verify
  Cloudflare claims against official documentation. Student-facing exercises
  teach the `cf` CLI; this repository's development scripts use Wrangler.

Preserve upstream copyright and license headers, including the Apache-2.0
enrollment adaptations. Only submit material you have permission to contribute.
Do not put credentials, real student IDs, interview answers, or other private
data in issues, PRs, screenshots, fixtures, or agent prompts.

## Check your changes

```sh
npm run lint
npm test
npm run build
```

Tests use local fixtures and in-memory SQLite, without Cloudflare credentials.
Check changed pages locally on mobile-sized and desktop viewports, in light
and dark mode; check keyboard interaction for UI changes. For API changes, run
the relevant smoke tests in a second terminal while `dev:worker` is running:

```sh
BASE_URL=http://localhost:8788 npm run verify:interview
BASE_URL=http://localhost:8788 npm run verify:exercise
BASE_URL=http://localhost:8788 npm run verify:exercise-kv
BASE_URL=http://localhost:8788 npm run verify:external-course
```

These create synthetic student data in your local database. Keep `BASE_URL`
pointed at localhost and retain this disposable data locally. Do not use the
production site or a PR preview for contributor smoke tests: previews currently
share production D1 and session KV. Do not run `npm run deploy`,
`npm run preview:deploy`, or `npm run preview:destroy` as part of local setup.

## Submit a focused PR

1. Start a branch from current `main` and keep unrelated changes separate.
2. Explain the problem, what changed, and which issue it addresses. For UI
   changes, include screenshots with synthetic local data.
3. Include commands you ran and their results, plus anything you could not
   verify. Add meaningful regression tests for behavior changes.
4. Open a draft while work or decisions remain; respond to review and let
   maintainers handle merge and deployment.

**Current publication caveat:** opening or updating any PR, including a draft,
triggers the preview workflow, which applies migrations to production D1.
Coordinate with maintainers before publishing if production changes are not
authorized. Draft status alone does not disable that workflow. Do not change
preview infrastructure as an incidental part of a documentation contribution.

Be respectful and constructive in discussion. Community conduct policy and
project licensing are being proposed separately; preserve existing third-party
terms while those decisions are reviewed.
