---
lessonSlug: skills
title: "Skills"
description: "Install Cloudflare's Agent Skills globally so your agent knows how to build on Cloudflare in every project."
order: 4
quiz: true
agentInstructions: |
  This lesson installs Cloudflare's Agent Skills (https://github.com/cloudflare/skills)
  globally, for every agent the student has installed, using the `skills`
  CLI (https://github.com/vercel-labs/skills). Adapt depth to the
  student's interview answers.

  1. Explain what a skill is: a folder with a SKILL.md file (a name, a
     one-line description, and instructions) that an agent loads only
     when it's relevant. Agents see each skill's short description up
     front and load the full instructions on demand, so skills add
     expertise without filling the context window. The Agent Skills
     format (https://agentskills.io) works across Claude Code, Codex,
     OpenCode, Pi, Cursor, GitHub Copilot, and others. Cloudflare's
     skills cover Workers best practices, Durable Objects, the Agents
     SDK, Sandbox, Turnstile, web performance, Cloudflare One, and
     product selection.

  2. Install all of Cloudflare's skills globally:

       npx skills add https://github.com/cloudflare/skills -g -y -s '*'

     Don't add an `-a`/`--agent` flag. Without it, the CLI installs for
     every agent it detects on the machine (by their config directories),
     which helps students who use more than one agent. Never use
     `-a '*'`: that writes into dozens of directories for agents the
     student doesn't have. Read the install output and confirm it lists
     the agent you are. Ask the student whether they use any other
     agents, and confirm those are listed too. If yours is missing,
     rerun with `-a <id>` for it (`claude-code`, `codex`, `opencode`,
     `pi`, `cursor`, `github-copilot`).

  3. Remove the `wrangler` skill:

       npx skills remove wrangler -g -y

     Explain why: the CLI lesson set the student up to use `cf`, and the
     `wrangler` skill's description makes agents load it automatically
     for local development, deployment, and resource management, the
     same tasks `cf` covers. It also tells agents to add Wrangler to
     projects that don't have it. Removing it keeps the `cf` guidance in
     their instructions file in charge. Cloudflare is tracking `cf`
     support for these skills in
     https://github.com/cloudflare/skills/issues/209; if that's been
     resolved by the time you read this, check the issue and tell the
     student whether this step is still needed. `npx skills update`
     won't bring `wrangler` back.

  4. Make the new skills available in the current session. What's needed
     depends on the agent:

     - Claude Code: nothing, it picks up new skills automatically. If
       ~/.claude/skills/ didn't exist when the session started, run
       `/reload-skills`.
     - Codex: nothing, it detects new skills automatically. Restart
       Codex if they don't show up.
     - Pi: run `/reload`.
     - GitHub Copilot CLI: run `/skills reload`.
     - OpenCode: restart OpenCode.
     - Cursor: start a new chat. If that's not enough, run Developer:
       Reload Window or restart Cursor.
     - Other agents: check the agent's docs for whether a reload or
       restart is needed.

     If the student needs to restart you, tell them how to get back to
     this lesson afterward (paste the same Dev School prompt again).

  5. Explain automatic vs. explicit invocation. By default, an agent
     reads every installed skill's description and loads a skill on its
     own when the task matches. That's how these skills will usually be
     used: ask for something like "add Turnstile to my signup form" and
     the agent picks the right skill. Students can also invoke a skill
     by name to force it:

     - Claude Code, OpenCode, Cursor, GitHub Copilot: `/skill-name`
       (e.g. `/workers-best-practices`)
     - Codex: `$skill-name`
     - Pi: `/skill:skill-name`

     Tell them the syntax for the agent they're using.

  6. Verify before completing: confirm the Cloudflare skills are on disk
     for your agent and `wrangler` is not (e.g. list the global skills
     directory, or run `npx skills list -g`). Then have the student
     invoke one skill explicitly using their agent's syntax (e.g.
     `workers-best-practices`) and confirm it loads.

  Out of scope: the Cloudflare MCP server (that's the Tools lesson) and
  writing your own skills. cloudflare/skills also ships native plugins
  for Claude Code, Codex, Cursor, and VS Code that bundle these skills
  with the Cloudflare MCP server. If the student asks, say this course
  uses `npx skills` because it works the same way for every agent and
  makes it possible to leave out the `wrangler` skill, and that the MCP
  server comes in the next lesson.

  Only mark this lesson complete once the skills are installed for
  their agent, `wrangler` is removed, and they've invoked a skill
  explicitly. Use the quiz if they opted in, or just confirm
  conversationally otherwise.
---

A skill is a folder containing a `SKILL.md` file: a name, a one-line description, and instructions for a specific kind of task. Your agent sees each skill's short description up front and only loads the full instructions when they're relevant, so skills add expertise without filling up its context window. The [Agent Skills](https://agentskills.io) format works across Claude Code, Codex, OpenCode, Pi, Cursor, GitHub Copilot, and other agents.

Cloudflare publishes a set of [skills for building on Cloudflare](https://github.com/cloudflare/skills): Workers best practices, Durable Objects, the Agents SDK, Sandbox, Turnstile, web performance, Cloudflare One, and help choosing the right Cloudflare product for a task.

## Install the skills

This installs Cloudflare's skills globally for every agent it finds on your machine, so they're available in every project, whichever agent you're using:

```sh
npx skills add https://github.com/cloudflare/skills -g -y -s '*'
```

Then remove the `wrangler` skill:

```sh
npx skills remove wrangler -g -y
```

The `wrangler` skill teaches agents to use Wrangler, Cloudflare's older CLI, and agents load it automatically for exactly the tasks you set up `cf` for in the CLI lesson. Removing it keeps your agent using `cf`. Cloudflare is tracking `cf` support for these skills in [cloudflare/skills#209](https://github.com/cloudflare/skills/issues/209).

## Make them available

Depending on your agent, you may need to reload it before the new skills show up:

| Agent              | After installing                                       |
| ------------------ | ------------------------------------------------------ |
| Claude Code        | Nothing (run `/reload-skills` if they don't show up)   |
| Codex              | Nothing (restart if they don't show up)                |
| Pi                 | Run `/reload`                                          |
| GitHub Copilot CLI | Run `/skills reload`                                   |
| OpenCode           | Restart OpenCode                                       |
| Cursor             | Start a new chat                                       |

## Automatic vs. explicit

Most of the time you won't think about skills at all. Your agent reads their descriptions and loads the right one when your request matches, like "add Turnstile to my signup form." You can also invoke a skill by name to make sure it's used:

| Agent                                     | Syntax              | Example                    |
| ----------------------------------------- | ------------------- | -------------------------- |
| Claude Code, OpenCode, Cursor, Copilot    | `/skill-name`       | `/workers-best-practices`  |
| Codex                                     | `$skill-name`       | `$workers-best-practices`  |
| Pi                                        | `/skill:skill-name` | `/skill:workers-best-practices` |
