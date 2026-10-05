# Cloudflare Dev School

Cloudflare Dev School teaches people how to build on Cloudflare using whatever AI-powered coding agent they already have installed, Claude Code, Codex, OpenCode, Pi, or something else entirely. No account, no email, just an agent and a prompt.

It's modeled closely on [OpenCode School](https://opencode.school), copying its enrollment flow, lesson structure, and public API shape wherever it makes sense.

The first version walks students through six short setup lessons (an interview, then models, instructions, CLI, skills, tools) and three exercises: deploying their first Worker to their own Cloudflare account, adding a Workers KV binding to it, then testing changes to it on an isolated Worker Preview.

See [`AGENTS.md`](./AGENTS.md) for the stack, scripts, and conventions, and [`plan.agent.md`](./plan.agent.md) for the current scope and design decisions.
