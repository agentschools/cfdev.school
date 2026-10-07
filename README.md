# Cloudflare Dev School

Cloudflare Dev School teaches people how to build on Cloudflare using whatever AI-powered coding agent they already have installed, Claude Code, Codex, OpenCode, Pi, or something else entirely. No account, no email, just an agent and a prompt.

It's modeled closely on [OpenCode School](https://opencode.school), copying its enrollment flow and public API shape wherever it makes sense.

The school is organized into courses, each a short series of exercises the student's agent teaches. The first version has two: Agent setup (an interview, then models, instructions, CLI, skills, and tools), and Workers basics, which deploys a Worker to the student's own Cloudflare account and then adds a Workers KV binding to it. The courses live in [`courses/`](./courses) as plain Markdown.

Anyone can write a course in the same format and host it anywhere, as a git repo or a single Markdown file. Students take it by giving their agent its URL, and their progress counts on Dev School like it does for the built-in courses. The site's `/authors` page has a prompt that has an author's own agent help them plan, write, and test one.

See [`AGENTS.md`](./AGENTS.md) for the stack, scripts, and conventions. Plans and decisions live in GitHub issues.
