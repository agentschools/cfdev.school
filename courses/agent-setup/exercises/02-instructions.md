---
description: "Add Cloudflare-flavored guidance to your agent's global instructions file."
agent-instructions: |
  Cover these topics for the harness you're running in:

  1. Most agent harnesses support a global (or "user-scope") instructions
     file that applies to every project, separate from a project-level
     file that only applies to one repo. State the correct location for
     your harness from your profile's `instructionsFile` (GET
     /api/harnesses/{yourHarnessId}), and explain its `notes` if any,
     e.g. how global and project files combine. Don't guess: if your
     harness is `generic`, check its docs.

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

  3. Add a short "Cloudflare Dev School" section to the same file, so any
     future session (in this agent or another) can pick up the student's
     courses, including courses hosted outside this site:

     ## Cloudflare Dev School
     - My Cloudflare Dev School student ID is <their student ID>.
     - For Cloudflare Dev School courses, read <origin>/llms.txt and
       report progress there.

     Fill in their student ID, and use the origin you fetched /llms.txt
     from as <origin>. Tell the student what it's for: next time, they
     can just say "take the course at <url>".

  4. Mention AGENTS.md: increasingly, agent harnesses treat AGENTS.md as
     the de facto standard filename for project-level instructions,
     read directly by Claude Code, Codex, OpenCode, Pi, and others,
     specifically so one file can work across every tool a project uses
     instead of a different file per tool. Recommend AGENTS.md for any
     new project-level instructions file over a harness-specific name.
     If your harness reads AGENTS.md only with caveats (your profile's
     `instructionsFile.notes` says so, e.g. Claude Code reads it only as
     a fallback when no CLAUDE.md exists, and its global file is always
     ~/.claude/CLAUDE.md), explain those caveats and the workaround the
     notes give, briefly.

  This exercise has no automated verification step (an agent can't
  directly confirm what's in the student's home directory from here).
  Ask the student to show you the section they added, or describe it,
  before marking complete. Use the quiz if they opted in, or just
  confirm conversationally otherwise.
---

# Instructions

Most agent harnesses support a global (or "user-scope") instructions file that applies to every project, separate from a project-level file that only applies to one repo. Check your harness's own docs for the exact location, it varies by tool.

## Add Cloudflare-flavored guidance

Open (or create) your harness's global instructions file and add a short section with a few defaults for working with Cloudflare. Treat this as a starting point, not a rulebook, edit it to match how you actually like to work:

```markdown
## Working with Cloudflare

- Prefer the `cf` CLI or the Cloudflare API over the dashboard when a task can be done either way.
- Favor Cloudflare Workers over Cloudflare Pages for new static sites.
- Use `.env` files for secrets and environment variables locally, not `.dev.vars`.
```

## Remember Dev School

Your agent also adds a short section with your student ID and this site's address, so a future session, in this agent or another, can find your progress. That's what lets you take a course hosted anywhere just by telling your agent "take the course at" and its URL:

```markdown
## Cloudflare Dev School

- My Cloudflare Dev School student ID is smooth-operator-4629.
- For Cloudflare Dev School courses, read https://<this site>/llms.txt and report progress there.
```

## AGENTS.md is a cross-tool standard

Increasingly, agent harnesses treat `AGENTS.md` as the de facto standard filename for project-level instructions. It's read directly by Claude Code, Codex, OpenCode, Pi, and others, specifically so one file can work across every tool a project uses instead of a different file per tool. If your harness supports it, prefer `AGENTS.md` for any new project-level instructions file over a harness-specific name.
