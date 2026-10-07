# Cloudflare Dev School

Cloudflare Dev School teaches people how to build on Cloudflare using whatever AI-powered coding agent they already have installed, Claude Code, Codex, OpenCode, Pi, or something else entirely. No account, no email, just an agent and a prompt.

It's modeled closely on [OpenCode School](https://opencode.school), copying its enrollment flow and public API shape wherever it makes sense.

The school is organized into courses, each a short series of exercises the student's agent teaches. The first version has two: Agent setup (an interview, then models, instructions, CLI, skills, and tools), and Workers basics, which deploys a Worker to the student's own Cloudflare account and then adds a Workers KV binding to it. The courses live in [`courses/`](./courses) as plain Markdown.

See [`AGENTS.md`](./AGENTS.md) for the stack, scripts, and conventions, and [`plan.agent.md`](./plan.agent.md) for the current scope and design decisions.
