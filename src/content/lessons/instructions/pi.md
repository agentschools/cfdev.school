---
lessonSlug: instructions
harness: pi
title: "Instructions"
description: "Add Cloudflare-flavored guidance to Pi's global instructions file."
order: 2
quiz: true
agentInstructions: |
  Cover these topics for Pi specifically:

  1. The global instructions file is ~/.pi/agent/AGENTS.md. It applies
     to every project, unlike a project-level AGENTS.md (or CLAUDE.md),
     which Pi discovers by walking up from the current directory and
     only applies to that one repo. All matching files, global and
     project, are concatenated together, not one-wins. A directory
     containing AGENTS.override.md loads that instead of that
     directory's own AGENTS.md/CLAUDE.md.

  2. Help the student create or open ~/.pi/agent/AGENTS.md and add a
     short "Working with Cloudflare" section with a few defaults they
     want to carry across projects. Offer this as a starting point, not
     gospel, and encourage them to edit it to match their own
     preferences:

     ## Working with Cloudflare
     - Always use JSONC for Workers configs (wrangler.jsonc), not TOML.
     - Prefer Wrangler or the Cloudflare API over the dashboard when a
       task can be done either way.
     - Favor Cloudflare Workers over Cloudflare Pages for new static
       sites.
     - Use .env files for secrets and environment variables locally,
       not .dev.vars.

  3. Mention AGENTS.md is a genuine cross-tool standard, not a
     Pi-specific format: Claude Code, Codex, OpenCode, and other agents
     can read the same file (Claude Code added fallback support for it
     in version 2.1.277). If the student also uses another agent on the
     same project, one AGENTS.md is usually enough.

  This lesson has no automated verification step (an agent can't
  directly confirm what's in the student's home directory from here).
  Ask the student to show you the section they added, or describe it,
  before marking complete. Use the quiz if they opted in, or just
  confirm conversationally otherwise.
---

Pi's global instructions file is `~/.pi/agent/AGENTS.md`. It applies to every project you open with Pi, unlike a project-level `AGENTS.md` (or `CLAUDE.md`), which Pi discovers by walking up from your current directory and only applies to that one repo. All matching files, global and project, are concatenated together, not one instead of the other. A directory containing `AGENTS.override.md` loads that instead of that directory's own `AGENTS.md`/`CLAUDE.md`.

## Add Cloudflare-flavored guidance

Open (or create) `~/.pi/agent/AGENTS.md` and add a short section with a few defaults for working with Cloudflare. Treat this as a starting point, not a rulebook, edit it to match how you actually like to work:

```markdown
## Working with Cloudflare

- Always use JSONC for Workers configs (`wrangler.jsonc`), not TOML.
- Prefer Wrangler or the Cloudflare API over the dashboard when a task can be done either way.
- Favor Cloudflare Workers over Cloudflare Pages for new static sites.
- Use `.env` files for secrets and environment variables locally, not `.dev.vars`.
```

## AGENTS.md is a cross-tool standard

`AGENTS.md` isn't specific to Pi. Claude Code, Codex, OpenCode, and other agents can read the very same file (Claude Code added fallback support for it in version 2.1.277). If a project also gets touched by another agent, one shared `AGENTS.md` usually covers everyone, no duplicate files to keep in sync.
