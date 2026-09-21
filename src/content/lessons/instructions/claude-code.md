---
lessonSlug: instructions
harness: claude-code
title: "Instructions"
description: "Add Cloudflare-flavored guidance to Claude Code's global instructions file."
order: 2
quiz: true
agentInstructions: |
  Cover these topics for Claude Code specifically:

  1. The global instructions file is ~/.claude/CLAUDE.md. It applies to
     every project you open with Claude Code, unlike a project-level
     CLAUDE.md (or AGENTS.md), which only applies to that one repo.

  2. Help the student create or open ~/.claude/CLAUDE.md and add a short
     "Working with Cloudflare" section with a few defaults they want to
     carry across projects. Offer this as a starting point, not gospel,
     and encourage them to edit it to match their own preferences:

     ## Working with Cloudflare
     - Always use JSONC for Workers configs (wrangler.jsonc), not TOML.
     - Prefer Wrangler or the Cloudflare API over the dashboard when a
       task can be done either way.
     - Favor Cloudflare Workers over Cloudflare Pages for new static
       sites.
     - Use .env files for secrets and environment variables locally,
       not .dev.vars.

  3. CLAUDE.md vs. AGENTS.md, and why it matters even for a Claude-only
     student: explain that as of Claude Code 2.1.277 (2026-09-18), Claude
     Code also reads AGENTS.md, but only at the PROJECT level, and only
     as a fallback when no CLAUDE.md exists in that project. The global
     file from step 1 has no AGENTS.md equivalent, it's always
     ~/.claude/CLAUDE.md. Recommend AGENTS.md as the better choice for
     any new PROJECT-level instructions file, since it's the de facto
     standard filename most other agents (Codex, OpenCode, and many
     others) read directly, while CLAUDE.md is Claude-specific. If they
     also need Claude-only project instructions on top of a shared
     AGENTS.md, the documented pattern is a one-line CLAUDE.md containing
     `@AGENTS.md` plus whatever Claude-specific content follows.

  4. Mention the caveats briefly, don't dwell: AGENTS.md support isn't
     available on Amazon Bedrock, Vertex, or Foundry, in a session with
     telemetry disabled, or on the very first session after installing
     or upgrading Claude Code. In those cases the @AGENTS.md import in a
     CLAUDE.md is the portable fallback.

  This lesson has no automated verification step (an agent can't
  directly confirm what's in the student's home directory from here).
  Ask the student to show you the section they added, or describe it,
  before marking complete. Use the quiz if they opted in, or just
  confirm conversationally otherwise.
---

Claude Code's global instructions file is `~/.claude/CLAUDE.md`. Unlike a project-level `CLAUDE.md`, it applies to every project you open with Claude Code, so it's the right place for preferences you want everywhere, not just one repo.

## Add Cloudflare-flavored guidance

Open (or create) `~/.claude/CLAUDE.md` and add a short section with a few defaults for working with Cloudflare. Treat this as a starting point, not a rulebook, edit it to match how you actually like to work:

```markdown
## Working with Cloudflare

- Always use JSONC for Workers configs (`wrangler.jsonc`), not TOML.
- Prefer Wrangler or the Cloudflare API over the dashboard when a task can be done either way.
- Favor Cloudflare Workers over Cloudflare Pages for new static sites.
- Use `.env` files for secrets and environment variables locally, not `.dev.vars`.
```

## CLAUDE.md vs. AGENTS.md

As of Claude Code 2.1.277 (September 18, 2026), Claude Code also reads `AGENTS.md`, but only at the **project** level, and only as a fallback: if a `CLAUDE.md` (or `CLAUDE.local.md`) already exists anywhere in the working directory or a parent, Claude reads that instead and ignores `AGENTS.md`. The global file you just edited has no `AGENTS.md` equivalent, it's always `~/.claude/CLAUDE.md`.

That project-level distinction still matters, though. `AGENTS.md` is the closest thing to a cross-tool standard filename, read directly by Codex, OpenCode, and many other agents, while `CLAUDE.md` only works with Claude Code. For any new project's instructions file, especially one you might also open with another agent, `AGENTS.md` is the better choice. If you need Claude-specific instructions on top of a shared `AGENTS.md`, the documented pattern is a one-line `CLAUDE.md` containing `@AGENTS.md`, with any Claude-only content added below it.

A few situations still fall back to `CLAUDE.md` only: Claude Code on Amazon Bedrock, Vertex, or Foundry; sessions with telemetry disabled; and the very first session after installing or upgrading Claude Code. The `@AGENTS.md` import in a `CLAUDE.md` works everywhere, so it's the portable choice if any of those apply to you.
