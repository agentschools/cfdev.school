# Your first contribution

This walkthrough gets Cloudflare Dev School running with synthetic local data,
then helps you make a small, reviewable change. Start with
[CONTRIBUTING.md](../CONTRIBUTING.md) for prerequisites and cloning instructions.

## Run the school

From your cloned repository, with Node.js 22.12.0 or newer:

```sh
npm ci
npm run dev:worker
```

Wait for `Ready on http://localhost:8788`, then open that address. The command
builds the app and applies the SQL files in `migrations/` to local D1 state in
`.wrangler/state`. You do not need a Cloudflare account, login, token, or secrets.
Starting from a separate clone or worktree gives you separate local state.

Try enrolling on the local homepage, choose a color, and open Agent setup.
Enrollment and progress stay in the local simulated bindings; your browser also
stores its local student ID. Use only fictional answers for testing. A private
browser window is useful for trying a fresh visitor experience.

In a second terminal, confirm the catalog responds:

```sh
curl --fail http://localhost:8788/api/courses
```

The returned exercise Markdown URLs should start with `http://localhost:8788`.
For a fuller check of enrollment, interviews, progress, and the live WebSocket:

```sh
BASE_URL=http://localhost:8788 npm run verify:interview
```

Keep that explicit local URL. Production and PR previews share real student
data and are not suitable for this walkthrough.

## Make one small change

1. Search existing issues and pick a narrow problem, such as an unclear
   instruction or broken link. Describe larger ideas in an issue first.
2. Create a branch from `main`: `git switch -c docs/clarify-an-exercise`.
3. Read the relevant part of [AGENTS.md](../AGENTS.md). For content, start with
   a file in `courses/`; for a new course, read `src/content/authors.md`.
4. Edit the file and verify factual claims with official sources. Keep headings
   in sentence case and preserve any third-party attribution.
5. Stop and restart `npm run dev:worker` to rebuild your change, then visit the
   affected page locally. For rapid content iteration, use `npm run dev` and
   the local URL it prints; return to `dev:worker` for API smoke tests.
6. Run `npm run lint`, `npm test`, and `npm run build`. Inspect `git diff` and
   `git status --short`; include only your intended source changes.

You can use a coding agent to help. Give it the issue, the relevant files, and
`AGENTS.md`; ask it to explain and verify the change. Review its output yourself
and keep credentials and real student data out of the conversation.

## Prepare your review

Describe what a reader or student experienced before and after the change,
link the issue, and list your checks. Include local screenshots for visual
changes, using synthetic data. Keep the PR focused and leave unfinished work
as a draft.

Before publishing, read the
[current preview workflow caveat](../CONTRIBUTING.md#submit-a-focused-pr): even
a draft PR currently triggers a deployment and production D1 migrations.
Coordinate safe publication with maintainers. Local development does not require
running deployment commands.

## If something goes wrong

- **Unsupported Node version:** check `node --version`; the minimum in
  `package.json` is 22.12.0. If an older shell is still active after switching
  Node, open a new terminal and retry `npm ci`.
- **Missing tables:** use `npm run dev:worker` from the repository root. It runs
  local migrations with the same state path used by the Worker. Do not try to
  fix local setup by running a remote migration.
- **Port in use:** stop the other local server or use another checkout after
  freeing port 8788. Do not run multiple `dev:worker` instances on that port.
- **Changes do not appear:** restart `dev:worker`, which serves a built
  snapshot. Make sure your browser is on the local URL.
- **URLs point at production:** use the unmodified `dev:worker` script; its
  `--local-upstream localhost:8788` option keeps generated links local.
- **Still stuck:** report your OS, Node/npm versions, command, and redacted
  error in an issue. Never paste credentials or real student records.
