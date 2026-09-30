---
lessonSlug: instructions
harness: opencode
title: "Instructions"
description: "Add Cloudflare-flavored guidance to OpenCode's global instructions file."
order: 2
quiz: true
agentInstructions: |
  Cover these topics for OpenCode specifically:

  1. The global instructions file is ~/.config/opencode/AGENTS.md. It
     applies to every project, unlike a project-level AGENTS.md
     (discovered by walking up from cwd to the project root), which only
     applies to that one repo. Both global and project files are
     combined, not one-wins. OpenCode falls back to CLAUDE.md /
     ~/.claude/CLAUDE.md only if no AGENTS.md is found at all.

  2. Help the student create or open ~/.config/opencode/AGENTS.md and add
     a short "Working with Cloudflare" section with a few defaults they
     want to carry across projects. Offer this as a starting point, not
     gospel, and encourage them to edit it to match their own
     preferences:

     ## Working with Cloudflare
     - Prefer the cf CLI or the Cloudflare API over the dashboard
       when a task can be done either way.
     - Favor Cloudflare Workers over Cloudflare Pages for new static
       sites.
     - Use .env files for secrets and environment variables locally,
       not .dev.vars.

  3. Mention AGENTS.md is a genuine cross-tool standard, not an
     OpenCode-specific format: Claude Code, Codex, and other agents can
     read the same file (Claude Code added fallback support for it in
     version 2.1.277). If the student also uses another agent on the
     same project, one AGENTS.md is usually enough, and OpenCode reading
     it as the default (with CLAUDE.md only as a fallback) means they
     don't need to change anything for OpenCode's sake.

  This lesson has no automated verification step (an agent can't
  directly confirm what's in the student's home directory from here).
  Ask the student to show you the section they added, or describe it,
  before marking complete. Use the quiz if they opted in, or just
  confirm conversationally otherwise.
---

OpenCode's global instructions file is `~/.config/opencode/AGENTS.md`. It applies to every project you open with OpenCode, unlike a project-level `AGENTS.md` (discovered by walking up from your current directory to the project root), which only applies to that one repo. Both global and project files load together, not one instead of the other. OpenCode falls back to `CLAUDE.md` / `~/.claude/CLAUDE.md` only if no `AGENTS.md` is found at all.

## Add Cloudflare-flavored guidance

Open (or create) `~/.config/opencode/AGENTS.md` and add a short section with a few defaults for working with Cloudflare. Treat this as a starting point, not a rulebook, edit it to match how you actually like to work:

```markdown
## Working with Cloudflare

- Prefer the `cf` CLI or the Cloudflare API over the dashboard when a task can be done either way.
- Favor Cloudflare Workers over Cloudflare Pages for new static sites.
- Use `.env` files for secrets and environment variables locally, not `.dev.vars`.
```

## AGENTS.md is a cross-tool standard

`AGENTS.md` isn't specific to OpenCode. Claude Code, Codex, and other agents can read the very same file (Claude Code added fallback support for it in version 2.1.277). OpenCode already treats `AGENTS.md` as the default and only falls back to `CLAUDE.md` when no `AGENTS.md` exists, so if a project also gets touched by another agent, one shared `AGENTS.md` usually covers everyone, no duplicate files to keep in sync.
