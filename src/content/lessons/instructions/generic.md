---
lessonSlug: instructions
harness: generic
title: "Instructions"
description: "Add Cloudflare-flavored guidance to your agent's global instructions file."
order: 2
quiz: true
agentInstructions: |
  Cover these topics, adapted to whatever harness the student is
  actually using (you already know this from context):

  1. Most agent harnesses support a global (or "user-scope") instructions
     file that applies to every project, separate from a project-level
     file that only applies to one repo. Find and state the correct
     location for the student's specific harness, don't guess, check its
     docs if you aren't certain.

  2. Help the student create or open that global file and add a short
     "Working with Cloudflare" section with a few defaults they want to
     carry across projects. Offer this as a starting point, not gospel,
     and encourage them to edit it to match their own preferences:

     ## Working with Cloudflare
     - Prefer the cf CLI or the Cloudflare API over the dashboard
       when a task can be done either way.
     - Favor Cloudflare Workers over Cloudflare Pages for new static
       sites.
     - Use .env files for secrets and environment variables locally,
       not .dev.vars.

  3. Mention AGENTS.md: increasingly, agent harnesses treat AGENTS.md as
     the de facto standard filename for project-level instructions,
     read directly by Claude Code, Codex, OpenCode, Pi, and others,
     specifically so one file can work across every tool a project uses
     instead of a different file per tool. If the student's harness
     supports it (check its docs), recommend AGENTS.md for any new
     project-level instructions file over a harness-specific name.

  This lesson has no automated verification step (an agent can't
  directly confirm what's in the student's home directory from here).
  Ask the student to show you the section they added, or describe it,
  before marking complete. Use the quiz if they opted in, or just
  confirm conversationally otherwise.
---

Most agent harnesses support a global (or "user-scope") instructions file that applies to every project, separate from a project-level file that only applies to one repo. Check your harness's own docs for the exact location, it varies by tool.

## Add Cloudflare-flavored guidance

Open (or create) your harness's global instructions file and add a short section with a few defaults for working with Cloudflare. Treat this as a starting point, not a rulebook, edit it to match how you actually like to work:

```markdown
## Working with Cloudflare

- Prefer the `cf` CLI or the Cloudflare API over the dashboard when a task can be done either way.
- Favor Cloudflare Workers over Cloudflare Pages for new static sites.
- Use `.env` files for secrets and environment variables locally, not `.dev.vars`.
```

## AGENTS.md is a cross-tool standard

Increasingly, agent harnesses treat `AGENTS.md` as the de facto standard filename for project-level instructions. It's read directly by Claude Code, Codex, OpenCode, Pi, and others, specifically so one file can work across every tool a project uses instead of a different file per tool. If your harness supports it, prefer `AGENTS.md` for any new project-level instructions file over a harness-specific name.
