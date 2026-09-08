# Cloudflare Dev School — Agent Notes

This repo is Cloudflare Dev School, a web app that teaches people how to build on Cloudflare using their AI-powered agent harness of choice. It's modeled on OpenCode School.

- `plan.human.md`: the original human-written plan.
- `plan.agent.md`: the agent-refined plan, produced by grilling `plan.human.md`. Where the two disagree, `plan.agent.md` wins.
- The app itself hasn't been scaffolded yet. No stack-specific build/test/lint commands exist yet; add them here once the app is bootstrapped.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on this repo, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout (one `CONTEXT.md` + `docs/adr/` at the repo root, created lazily as decisions get made). See `docs/agents/domain.md`.

## Keep this file current

This file must be revised whenever the stack, scripts, or conventions change, once the app is scaffolded, add real build/test/lint commands here. Don't let it drift from what's actually true about the repo.
