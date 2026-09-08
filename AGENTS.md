# Cloudflare Dev School — Agent Notes

This repo is Cloudflare Dev School, a web app that teaches people how to build on Cloudflare using their AI-powered agent harness of choice. It's modeled on OpenCode School.

- `plan.human.md`: the original human-written plan.
- `plan.agent.md`: the agent-refined plan, produced by grilling `plan.human.md`. Where the two disagree, `plan.agent.md` wins.
- The app itself hasn't been scaffolded yet. No stack-specific build/test/lint commands exist yet; add them here once the app is bootstrapped.

## Issue tracker

Issues live as GitHub issues on this repo, via the `gh` CLI.

## Planning approach

We're borrowing ideas from Matt Pocock's `mattpocock/skills` (https://github.com/mattpocock/skills), specifically `grill-me`, `to-spec`, and `to-tickets`, without installing them as skills:

- **Grilling**: interrogate a plan or spec one question at a time to surface gaps and contradictions before building.
- **Spec-first**: turn an agreed-upon conversation/plan into a single written decision record (a GitHub issue) before splitting work across sessions.
- **Ticketing**: break a spec into small, independently demoable tickets, each a vertical slice (schema + API + UI + tests), sized to fit one fresh context window, with explicit blocking dependencies between them.

Apply these ideas freely when turning `plan.agent.md` into GitHub issues, but there's no separate tracker config or skill install to maintain here, just plain GitHub issues.

## Keep this file current

This file must be revised whenever the stack, scripts, or conventions change, once the app is scaffolded, add real build/test/lint commands here. Don't let it drift from what's actually true about the repo.
