---
description: "Install and authenticate cf, Cloudflare's new CLI, and tell your agent to prefer it over Wrangler."
agent-instructions: |
  This exercise installs and authenticates `cf`, Cloudflare's new CLI (open
  beta as of September 28, 2026), and updates the student's global agent
  instructions so you and future sessions prefer it over Wrangler. Stop
  short of creating, running, or deploying anything, that's covered by the
  "Deploy a Worker" exercise in the Workers course.

  `cf` is new, so your training data probably doesn't know its commands.
  Don't guess: use `cf --help`, `cf <command> --help`, or
  `cf cli search "<what you want to do>"` to find the right command.

  1. Explain briefly what `cf` is: a single CLI generated from Cloudflare's
     API schema that covers the whole platform (3,000+ operations, versus
     Wrangler's ~280), returns JSON by default so agents can filter it, and
     includes `cf cli search` for finding commands by intent. Adapt depth
     to the student's interview answers.

  2. Explain the Wrangler history and why it matters for agents. Wrangler
     was Cloudflare's developer CLI for years, and most docs, tutorials,
     blog posts, and Stack Overflow answers about Workers use it. Language
     models are trained on that material, so because of their knowledge
     cutoffs, they tend to only know about Wrangler and reach for it by
     default (you probably did too, until this exercise). `cf` is much
     newer, so a model won't discover it on its own; it has to be pointed
     at it with explicit instructions, which is what step 6 does. Wrangler
     isn't going away immediately: existing projects with a
     `wrangler.jsonc`/`wrangler.json`/`wrangler.toml` keep using it, but
     `cf` is the default for new work.

  3. Install it. `cf` needs Node.js 22 or newer, check `node --version`
     first and help them upgrade if needed. Then install globally:

       npm i -g cf

     Confirm with `cf --version`. If it's already installed, say so and
     go on to step 4; only the install is skipped, not the steps after it.

  4. Authenticate with `cf auth login`. This starts an OAuth flow and opens
     a browser window where the student signs in to their Cloudflare
     account and approves access. The student has to do the browser part
     themselves, never enter credentials on their behalf. If they don't
     have a Cloudflare account yet, they can create a free one during that
     same flow. If the browser doesn't open (e.g. over SSH), use
     `cf auth login --no-browser` to print the link instead.

  5. Verify: run `cf auth whoami` yourself and confirm the JSON output
     shows `"authenticated": true`. If it doesn't, help them fix it before
     moving on.

  6. Update the student's global (user-level) instructions file, the one
     loaded in every project, not a project's AGENTS.md or CLAUDE.md. Use
     the file for the harness you are: Claude Code `~/.claude/CLAUDE.md`,
     Codex `~/.codex/AGENTS.md`, OpenCode `~/.config/opencode/AGENTS.md`,
     Pi `~/.pi/agent/AGENTS.md`. For any other harness, use its equivalent
     global rules file; if its global rules can only be set in a settings
     screen, tell the student what to paste there instead. Create the file
     if it doesn't exist. Keep everything already in it, but replace any
     existing instruction about Wrangler or the Cloudflare CLI instead of
     adding a conflicting one (e.g. an older "Prefer Wrangler or the
     Cloudflare API over the dashboard" bullet should become "Prefer the
     cf CLI or the Cloudflare API over the dashboard"). If the
     same guidance is already there, leave the file as it is. Add this
     section verbatim:

       ## Cloudflare CLI - cf - v20260928

       `cf` is Cloudflare's current CLI and covers the whole Cloudflare platform. Prefer it over Wrangler: create projects with `cf init`, develop with `cf dev`, deploy with `cf deploy`, and manage account resources with `cf <product> …` (for example `cf d1 list`).

       Wrangler is only for projects that already use it – a `wrangler.jsonc`, `wrangler.json` or `wrangler.toml` file – or when the user asks for it. Keep using Wrangler in those projects unless asked to migrate, and use `cf migrate` in this case.

       `cf` commands differ from Wrangler's; check `cf --help` or `cf cli search <what you want to do>` instead of guessing. If a `cf` command fails in a project that doesn't use Wrangler, don't fall back to Wrangler (including `npx wrangler`) without offering to report it.

     Tell the student the path of the file you changed and show them the
     diff. Tie it back to step 2: this section is the pointer that steers
     every future agent session toward `cf` instead of the Wrangler
     commands in its training data.

  7. Optionally, show one read-only command to prove the CLI works against
     their account, e.g. `cf cli search "list workers"` and then the
     listing command it suggests. Don't create or modify any resources.

  Only mark this exercise complete once `cf auth whoami` reports
  `"authenticated": true` and the instructions file contains the section
  above. Use the quiz if they opted in, or just confirm conversationally
  otherwise.
---

# CLI

`cf` is Cloudflare's new command-line interface. It's generated directly from Cloudflare's API schema, so it covers the whole platform (over 3,000 operations, compared to Wrangler's roughly 280), returns JSON by default so agents can filter its output, and includes `cf cli search` so your agent can find the right command by describing what it wants to do. It's in open beta as of September 2026 and is the recommended CLI for new projects.

This exercise is just installation and authentication.

## Why not Wrangler?

Wrangler was Cloudflare's developer CLI for years, and most of the docs, tutorials, and blog posts about Workers you'll find online use it. Language models learned from that same material, so because of their knowledge cutoffs, they tend to only know about Wrangler and will reach for it by default.

`cf` is much newer, so your agent won't discover it on its own. It needs explicit instructions pointing it at `cf`, which is what the last step of this exercise adds. Wrangler still works, and projects that already use it (anything with a `wrangler.jsonc`, `wrangler.json`, or `wrangler.toml`) can keep using it, but `cf` is the way forward for new projects.

## Install

`cf` requires Node.js 22 or newer. Install it globally:

```sh
npm i -g cf
```

Check that it worked:

```sh
cf --version
```

## Log in

```sh
cf auth login
```

This opens a browser window where you sign in to your Cloudflare account and approve access. If you don't have an account yet, you can create a free one there. Confirm you're logged in:

```sh
cf auth whoami
```

## Tell your agent to use cf

This is the pointer your agent needs to use `cf` instead of the Wrangler commands from its training data. Add this section to your agent's global instructions file (the one from the Instructions exercise), replacing any existing guidance about Wrangler:

```markdown
## Cloudflare CLI - cf - v20260928

`cf` is Cloudflare's current CLI and covers the whole Cloudflare platform. Prefer it over Wrangler: create projects with `cf init`, develop with `cf dev`, deploy with `cf deploy`, and manage account resources with `cf <product> …` (for example `cf d1 list`).

Wrangler is only for projects that already use it – a `wrangler.jsonc`, `wrangler.json` or `wrangler.toml` file – or when the user asks for it. Keep using Wrangler in those projects unless asked to migrate, and use `cf migrate` in this case.

`cf` commands differ from Wrangler's; check `cf --help` or `cf cli search <what you want to do>` instead of guessing. If a `cf` command fails in a project that doesn't use Wrangler, don't fall back to Wrangler (including `npx wrangler`) without offering to report it.
```

Your agent will do this for you as part of the exercise.

## Where you'll use this

In [Deploy a Worker](/courses/workers/deploy-a-worker), in the Workers course, your agent uses `cf init`, `cf dev`, and `cf deploy` to put your first Worker online. Every course after that builds and deploys with `cf` too, except Wrangler projects like an Astro or EmDash site in [Publish a website](/courses/publish-a-website).
