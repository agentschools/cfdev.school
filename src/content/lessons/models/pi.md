---
lessonSlug: models
harness: pi
title: "Models"
description: "Choose and pay for models in Pi."
order: 1
quiz: true
agentInstructions: |
  Cover these topics for Pi specifically:

  1. The cost vs. capability tradeoff: Pi supports many providers and
     subscription logins via /login (ChatGPT Plus/Pro, Claude Pro/Max,
     GitHub Copilot, xAI) plus API keys for others. More capable models
     need less course-correction but cost more.

  2. Billing, and an important caveat: ChatGPT Plus/Pro login works as
     expected in Pi, OpenAI's "Codex for OSS" program officially endorses
     third-party harnesses using it, and usage counts against the
     student's ChatGPT plan normally. Claude Pro/Max login is different:
     as of an April 2026 Anthropic enforcement change, logging into Claude
     Pro/Max from Pi (or any third-party tool) still technically works,
     but usage now draws from Anthropic's separate pay-per-token "extra
     usage" pool instead of the plan's included limits. In practice that
     means there is currently no cost benefit to using a Claude
     subscription login in Pi over just using an Anthropic API key. Be
     direct about this, it's a common point of confusion. Recommend: for
     OpenAI models, use ChatGPT Plus/Pro via /login as normal; for Claude
     models, an API key is the more predictable choice today.

  3. Context windows: mention the shared context-window guidance.

  4. Mention Cloudflare AI Gateway/Workers AI briefly as another provider
     option, not required for this course.

  This lesson has no file-system verification step. Confirm understanding
  conversationally (or via the quiz, if the student opted in) before
  marking it complete.
---

Pi connects to a wide range of model providers, both through subscription logins (`/login`) and API keys, so which model and which billing route you pick matters here. As always: more capable models need less hand-holding but cost more; cheaper models are fine for smaller tasks.

## Subscription vs. API billing

Pi's `/login` command supports subscription-based auth for ChatGPT Plus/Pro (Codex), Claude Pro/Max, GitHub Copilot, and xAI, plus API keys for everything else.

**For OpenAI models, ChatGPT Plus/Pro login works as expected.** OpenAI's "Codex for OSS" program officially endorses third-party harnesses using a ChatGPT subscription this way, and usage counts against your ChatGPT plan normally, the same as it would in OpenAI's own Codex CLI.

**For Claude models, there's a catch worth knowing about.** As of an April 2026 change, Anthropic now routes third-party tools' Claude Pro/Max logins, including Pi's, through a separate pay-per-token "extra usage" pool instead of your plan's included limits. The login still works, but there's currently no cost benefit to using your Claude subscription in Pi over just setting an Anthropic API key directly, both are billed per token. If you're using Claude models in Pi, an API key is the more predictable choice today.

## Context windows

The usual guidance applies: larger context windows on flagship models, smaller ones on cheaper models, and a full window means older conversation history gets summarized or dropped. Keep sessions focused on one task and start fresh sessions for unrelated work.

## Cloudflare as a model provider

Pi can also connect to [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) and [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) as providers, useful if you want a single Cloudflare bill via [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/). Not required for this course, just an option if you already have a Cloudflare account.
