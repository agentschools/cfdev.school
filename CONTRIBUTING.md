# Contributing

The easiest way to get set up is to ask your coding agent to do it. Clone the repo, open your agent in it, and paste:

```text
Read AGENTS.md, then set up this repo for local development: install dependencies,
start the local Worker, and confirm the homepage and /api/courses work at
http://localhost:8788. Use local bindings only. Don't deploy, don't use --remote,
and don't run verify scripts against production or a PR preview. Then help me
find a small issue to work on.
```

Doing it by hand:

```sh
npm ci
npm run dev:worker   # http://localhost:8788, no Cloudflare account needed
```

Before opening a PR, run `npm run lint` and `npm test`. Open an issue first for anything bigger than a small fix.
