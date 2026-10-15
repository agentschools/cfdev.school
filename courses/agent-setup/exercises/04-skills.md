---
description: "Install Cloudflare's Agent Skills globally so your agent knows how to build on Cloudflare in every project."
agent-instructions: |
  This exercise installs Cloudflare's Agent Skills (https://github.com/cloudflare/skills)
  globally, for every agent the student has installed, using the `skills`
  CLI (https://github.com/vercel-labs/skills). Adapt depth to the
  student's interview answers.

  1. Explain what a skill is, without getting into file names or folder
     layout: a packaged set of instructions that teaches an agent how to
     do a specific kind of task. The agent keeps only each skill's name
     and one-line description in mind, and loads the full instructions
     when a task calls for them, so skills add expertise without filling
     the context window. The Agent Skills format (https://agentskills.io)
     is an open standard, so the same skill works across Claude Code,
     Codex, OpenCode, Pi, Cursor, GitHub Copilot, and others.

  2. Explain what Cloudflare's skills cover. Mention the `cloudflare`
     skill first: it helps the agent pick the right Cloudflare products
     for what the student describes, even when they don't name a
     product, and then points it to the more specific skills and docs.
     The rest cover Workers best practices, Durable Objects, the Agents
     SDK, Sandbox, Next.js on Workers, Email Service, Turnstile, web
     performance, Basin and K2 data pipelines, and Cloudflare One. Tie
     one or two of them to what the student said they want to build in
     the interview, rather than reading out the whole list.

  3. Install all of Cloudflare's skills globally:

       npx -y skills add cloudflare/skills --skill '*' --yes --global

     Don't add an `--agent` flag. Without it, the CLI installs for every
     agent it detects on the machine (by their config directories),
     which helps students who use more than one agent. Never use
     `--agent '*'`: that writes into dozens of directories for agents
     the student doesn't have. Read the install output and confirm it
     lists the agent you are. Ask the student whether they use any other
     agents, and confirm those are listed too. If yours is missing,
     rerun with `--agent <id>` for it (`claude-code`, `codex`,
     `opencode`, `pi`, `cursor`, `github-copilot`).

  4. Make the new skills available in the current session. Use your
     harness profile's `skills.restartBehavior` (GET
     /api/harnesses/{yourHarnessId}). If your harness is `generic`,
     check its docs for whether a reload or restart is needed. If the
     student needs to restart you, tell them how to get back to this
     exercise afterward (paste the same Dev School prompt again).

  5. Explain how skills get used. By default it's automatic: the agent
     compares the student's request against every installed skill's
     description and loads a skill on its own when the task matches.
     That's how these skills will usually be used: ask for something
     like "add Turnstile to my signup form" and the agent picks the
     right skill without being told. Agents can miss a relevant skill,
     so students can also invoke one by name to make sure it's used.
     Tell them the syntax for their agent, from your profile's
     `skills.explicitInvocation` (e.g. `/workers-best-practices` in
     Claude Code, `$workers-best-practices` in Codex,
     `/skill:workers-best-practices` in Pi).

  6. Verify before completing: confirm the Cloudflare skills are on disk
     for your agent (e.g. `npx skills list --global`). Then have the
     student invoke one skill explicitly using their agent's syntax
     (e.g. `workers-best-practices`) and confirm it loads.

  Out of scope: the Cloudflare MCP server (that's the Tools exercise) and
  writing your own skills. cloudflare/skills also ships native plugins
  for Claude Code, Codex, Cursor, and VS Code that bundle these skills
  with the Cloudflare MCP server. If the student asks, say this course
  uses `npx skills` because it works the same way for every agent, and
  that the MCP server comes in the next exercise.

  Only mark this exercise complete once the skills are installed for
  their agent and they've invoked a skill explicitly. Use the quiz if
  they opted in, or just confirm conversationally otherwise.
---

# Skills

A skill is a packaged set of instructions that teaches your agent how to do a specific kind of task. Your agent keeps only a short description of each skill in mind, and loads the full instructions when a task calls for them, so skills add expertise without filling up its context window. [Agent Skills](https://agentskills.io) is an open standard, so the same skill works in Claude Code, Codex, OpenCode, Pi, Cursor, GitHub Copilot, and other agents.

## Cloudflare skills

Cloudflare publishes a set of [skills for building on Cloudflare](https://github.com/cloudflare/skills). They give your agent current guidance on Cloudflare's products, so it relies less on whatever it picked up in training.

- `cloudflare`: helps your agent choose the right Cloudflare products for what you describe, even when you don't name a product, then points it to the right skill or docs.
- `workers-best-practices`: writing, reviewing, and configuring production Workers.
- `durable-objects`: stateful coordination like chat rooms, games, and bookings, with RPC, SQLite storage, alarms, and WebSockets.
- `agents-sdk`: stateful AI agents with scheduling, RPC, MCP servers, email, and streaming chat.
- `sandbox-stable`, `sandbox-next`, `sandbox-migrate-to-next`: running untrusted code in isolated sandboxes with the Sandbox SDK.
- `nextjs-on-cloudflare`: building, migrating, and deploying Next.js apps on Workers.
- `cloudflare-email-service`: sending and routing email.
- `turnstile-spin`: adding Turnstile bot protection to your forms, including the server-side check.
- `web-perf`: auditing page speed, Core Web Vitals, and render-blocking resources.
- `basin`, `k2`: streaming data into analytics tables and durable logs.
- `cloudflare-one`, `cloudflare-one-migrations`: Zero Trust networking and security, and migrating to it from other vendors.

## Install the skills

This installs Cloudflare's skills globally for every agent it finds on your machine, so they're available in every project, whichever agent you're using:

```sh
npx -y skills add cloudflare/skills --skill '*' --yes --global
```

## Load the skills

Depending on your agent, you may need to reload it before the new skills show up:

| Agent              | After installing                                     |
| ------------------ | ---------------------------------------------------- |
| Claude Code        | Nothing (run `/reload-skills` if they don't show up) |
| Codex              | Nothing (restart if they don't show up)              |
| Pi                 | Run `/reload`                                        |
| GitHub Copilot CLI | Run `/skills reload`                                 |
| OpenCode           | Restart OpenCode                                     |
| Cursor             | Start a new chat                                     |

## Use the skills

Most of the time you won't think about skills at all. Your agent compares your request against the descriptions of the skills you've installed, and loads the right one on its own when there's a match. Ask for something like "add Turnstile to my signup form" and it will reach for the `turnstile-spin` skill without being told.

Agents can miss a relevant skill, though. To make sure one is used, invoke it by name:

| Agent              | Syntax              | Example                         |
| ------------------ | ------------------- | ------------------------------- |
| Claude Code        | `/skill-name`       | `/workers-best-practices`       |
| Codex              | `$skill-name`       | `$workers-best-practices`       |
| Pi                 | `/skill:skill-name` | `/skill:workers-best-practices` |
| GitHub Copilot CLI | `/skill-name`       | `/workers-best-practices`       |
| OpenCode           | `/skill-name`       | `/workers-best-practices`       |
| Cursor             | `/skill-name`       | `/workers-best-practices`       |

## Where you'll use this

Skills come in whenever you build. Your agent can load one on its own when it recognizes a skill that fits, or you can invoke one explicitly, which is the surest way to get it used. When you write your first Worker in [Deploy a Worker](/courses/workers/deploy-a-worker), `workers-best-practices` fits, and in the [Durable Objects](/courses/durable-objects) course, `durable-objects` does. Invoke one yourself whenever you want to be sure it's used, or when an answer looks out of date.
