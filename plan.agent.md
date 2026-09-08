# Cloudflare Dev School — Agent Plan

This is the agent-refined plan for Cloudflare Dev School, expanding on `plan.human.md` with decisions made during a grilling session. Where this doc and `plan.human.md` disagree, this doc wins.

Cloudflare Dev School is a web app that teaches people how to build on Cloudflare using their AI-powered agentic tool of choice. It's modeled closely on OpenCode School, an existing open-source project we also created and maintain (along with Pi School, a Pi-flavored fork of the same idea). Copying OpenCode School's structure, content, design patterns, and enrollment flow wholesale is expected, not just allowed.

## Repo and domain

- Repo: private for now (`github.com/zeke/cloudflare-dev-school`), designed to be open-sourced later. License: MIT.
- Domain: buy `cloudflaredevschool.com` via the Cloudflare Registrar API if it's available. Until then, ship at a `workers.dev` subdomain.
- Deployed on Cloudflare Workers, single Worker/app (not a multi-service architecture).

## Signup and enrollment

v1 copies OpenCode School's enrollment flow exactly: no account, no email, no password. A student lands on the homepage, clicks enroll, and gets a randomly generated student ID (adjective-noun format, same word lists/format as OpenCode School), revealed with the same confetti + cypher-reveal animation.

Cloudflare OAuth login (via Cloudflare's self-managed OAuth clients) is an explicitly deferred, future layer. Not needed for v1, not blocking anything. If we build it later, start with a bare-minimum scope (e.g. account-read) and expand scopes only as needed.

Abuse prevention (rate limiting, ID enumeration, spam enrollment) is a known open risk with an anonymous, unauthenticated enrollment flow. We're accepting that risk for v1 and will revisit only if it becomes an actual problem.

## Supported AI agent harnesses

v1 explicitly supports:

- Claude Code
- OpenAI Codex
- OpenCode
- Pi

Plus a generic/fallback path so a student using *any* other agent harness can still complete the school. Nobody should be turned away. Gemini and other harnesses can be added later with the same data-collection process (see AI tools research below), just not prioritized in v1 homepage cards.

Homepage should reference https://developers.cloudflare.com/agent-setup/ (and its `/prompt.md`) as the source of truth for staying aligned with Cloudflare's own official recommendations on tooling.

### AI tools research

Build structured data profiles per harness:

- default name/location of the global instructions file (`CLAUDE.md`, `AGENTS.md`, etc.)
- CLI command name
- Skills file support and install location
- global config file location (MCP config, etc.)
- supported models, with cost/speed/accuracy/context-window/vision/tool-use data

This data goes stale fast. Keeping it fresh is a **manual** process, not an automated system, some combination of a repo script, a skill, and/or notes in the project's `AGENTS.md`. No cron jobs or scheduled Workers for this.

## Student journey

1. Homepage: overview, supported harness cards, prominent "enroll, free forever, no credit card" CTA.
2. Enroll: no account needed, matches OpenCode School exactly (see Signup above).
3. Confetti + cypher reveal of the randomly generated student ID.
4. Student picks a harness (Claude Code, Codex, OpenCode, Pi, or "something else").
5. Student is given an agent prompt to copy/paste into their chosen harness.
6. Pasting the prompt kicks off the interview (see Interview below), which the agent conducts, storing answers via the Dev School API.
7. Lessons.
8. Certificate of completion: a durable, public, shareable URL with a dynamically generated Open Graph image (renders well when shared to social media or iMessage).
9. Exercises: mini-projects, one per Cloudflare product/feature, build-and-deploy challenges.

## Interview

Modeled on OpenCode School's interview. The agent auto-detects the student's OS. Questions include:

- Technical background, Cloudflare experience, learning goals (OpenCode School baseline)
- **Familiarity with Cloudflare**: used only to inform how the agent talks to the student (tone, depth of explanation). Not used to skip lessons or branch database logic in v1.
- **Name (optional)**: asked once during the interview, explicitly framed as optional. If the student completes lessons/exercises with no name on file, the agent gently offers once more to add it, since the certificate is meant to be resume-shareable. Never mandatory.
- **Quiz opt-in**: asks if the student wants to be quizzed at the end of each lesson. Recommend trying it, but make clear it's skippable at any time, per-quiz or entirely, via a profile preference.

## Lessons

Same five lessons as the human plan: Models, Instructions, CLI, Skills, Tools.

### Lesson: Models

Tailored per harness (OpenCode, Claude Code, Codex, Pi, plus generic fallback content for unsupported harnesses).

Needs deep research before writing final content:

- Whether OpenAI currently allows third-party harnesses (OpenCode, Pi, etc.) to authenticate against a ChatGPT monthly subscription plan rather than pay-per-token API billing, and whether Anthropic currently disallows the equivalent for Claude.
- Current pricing/quality comparison: monthly subscription plans vs. API-token billing, for the purposes of recommending the better "bang for your buck" starting point. Emphasize that free tiers on these tools tend to use lower-quality models and lead to wasted time course-correcting, and that paid subscription plans are usually the best value.

This research needs to be current, not relying on stale training data, since pricing and policy here change often.

### Lesson: Instructions

Guide students through adding Cloudflare-flavored guidance to their global instructions file. Research the correct default file name/location per harness before writing this lesson (part of the AI tools research above).

### Lesson: CLI

Install and authenticate Wrangler. Just auth in this lesson; build/deploy usage is covered later via exercises.

### Lesson: Skills

Install https://github.com/cloudflare/skills globally, non-interactively, via `npx skills add https://github.com/cloudflare/skills` (verify the exact non-interactive flag before shipping this content).

Research needed: which harnesses require a full quit/restart vs. a simple reload for newly installed global skills to become available, so the lesson can give accurate per-harness guidance.

### Lesson: Tools

Install https://github.com/cloudflare/mcp, the token-efficient MCP server for the whole Cloudflare API (2500 endpoints, ~1k tokens, powered by Code Mode). Explain what Code Mode is and why it keeps the model's context window from getting polluted with tool definitions.

## Quizzes

Generated dynamically from lesson content during the conversation (unless the codebase has specific per-lesson quiz question overrides). Not scored, not stored anywhere, purely a learning aid. Always skippable, one quiz or all of them, and can be turned off entirely via a profile preference at any time.

## Exercises

Mini-projects, one per Cloudflare product/feature, same spirit as OpenCode School. Verification is conversational: the agent uses the student's own local Wrangler auth (already set up in the CLI lesson) to check on the student's behalf when that makes sense, or simply uses judgment from the conversation to determine the exercise is done. No separate verification system, no Cloudflare OAuth requirement for this.

## Certificate of completion

A durable, public URL per student (not gated by auth) that anyone can visit to confirm the student completed the school. Includes a dynamically generated Open Graph image so links preview nicely on social media and messaging apps. Displays the student's name if they've provided one, otherwise the student ID/handle.

## Public API

Same shape as OpenCode School's API: public, versioned, documented via OpenAPI, endpoints for enrollment, lessons, exercises, progress. Student browsers cache their enrollment/progress in local storage and hit the API for updates as needed.

`llms.txt` closely follows OpenCode School's format: instructions for the agent on how the system works, how to discover the API schema, and how to read/write student data.

### Type design approach

Following the "ship types, not docs" methodology (https://shiptypes.com/), adapted for a single-Worker app (the RPC/service-binding half of that methodology doesn't apply here since there's only one service):

- Zod schemas are the single source of truth for data shapes.
- Use `zod-openapi` (or equivalent Zod-OpenAPI tooling) to derive the OpenAPI spec from the schemas, rather than hand-writing/maintaining OpenAPI docs separately.
- TypeScript types are derived from the same schemas (`z.infer`).
- Prose docs are reserved for *why* and *when*, not *what*; the schema is the contract.

## Data storage

**D1**, not KV. Reasoning: enrollment/progress/quiz/exercise data is inherently relational (one student, many progress records), and D1 gives us transactions for multi-row consistency (e.g. "mark lesson complete + update overall progress %" atomically), ad-hoc SQL querying for support/debugging, schema migrations, and foreign key constraints, all of which pair naturally with the Zod-schema-first approach above. Schema modeled after OpenCode School's actual schema (inferred from its public git source), formalized into D1 migrations.

## Design

Primary visual reference: the public, unauthenticated marketing/docs face of https://developers.cloudflare.com/, specifically its desktop layout, logo top-left, sidebar nav, top-right menu items. Research any other public Cloudflare design-system material available before finalizing.

Make sure any Cloudflare property used for inspiration is recently updated; don't copy stale/deprecated designs.

Color scheme: Cloudflare brand colors, clean and minimalistic.

Responsive: works on desktop and mobile (mobile-specific nav treatment TBD during implementation).

Dark/light mode: honors system preference, live-updates if the student changes their OS theme while using the site.

Components: Kumo (Cloudflare's official, actively-maintained component library) plus React, **only if it fits cleanly with Astro's islands architecture**. Kumo isn't essential, the actual requirement is following official Cloudflare design patterns. If Kumo and Astro don't play well together, fall back to plain React/whatever fits, still following Cloudflare's visual patterns.

## Stack

- Cloudflare for all the things (Workers, D1, etc.)
- Astro for the app, structure modeled after OpenCode School's codebase
- Kumo + React for interactive components, conditional on Astro compatibility (see Design above)

## Architecture

- Zod-schema-first type design (see Type design approach above)
- Test-driven development, small testable increments
- GitHub Actions: tests + linting on every PR
- GitHub Actions: preview deployments per PR (https://github.com/zeke/preview-deployments-skill)
- GitHub Actions: deploy to production on merge to `main`

## Reference material

OpenCode School (ours, copy wholesale):
- https://opencode.school
- https://opencode.school/llms.txt
- https://opencode.school/api/openapi.json
- https://github.com/opencodeschool/opencode.school

Pi School (ours, another OpenCode School fork, for the Pi harness):
- https://github.com/zeke/pi-school

OAuth (future, not v1):
- https://login-with-cloudflare.ziki.boo
- https://github.com/zeke/login-with-cloudflare

Skills:
- https://opencode.school/lessons/skills
- https://skills.sh
- https://agentskills.io
- https://github.com/cloudflare/skills
- https://kumo-ui.com/skill/
- https://github.com/zeke/preview-deployments-skill

MCP / Code Mode:
- https://github.com/cloudflare/mcp
- https://blog.cloudflare.com/code-mode/
- https://blog.cloudflare.com/code-mode-mcp/

Type design:
- https://shiptypes.com/

## Open questions / deferred decisions

- Mobile nav treatment for the `developers.cloudflare.com`-inspired sidebar layout.
- Abuse prevention for anonymous enrollment (rate limiting, ID guessing) — revisit only if it becomes a real problem.
- Exact non-interactive install flag for the `skills` CLI — verify before writing the Skills lesson.
- Per-harness restart/reload requirements after global skill install — needs research.
- Current (not stale) research on OpenAI vs. Anthropic policy on subscription-plan API access for third-party harnesses.

## Planning process

This plan was produced by grilling `plan.human.md` (https://www.aihero.dev/skills-grill-me). Next steps: install `setup-matt-pocock-skills`, `to-spec`, and `to-tickets` from `mattpocock/skills` at the repo level, configure GitHub Issues as the tracker, then run `/to-spec` to turn this plan into a spec issue, followed by `/to-tickets` to break it into buildable tickets.
