---
lessonSlug: models
title: "Models"
description: "Choose the right model for your agent and your budget."
order: 1
quiz: true
agentInstructions: |
  Cover these topics for the harness you're running in. Use your harness
  profile (GET /api/harnesses/{yourHarnessId}), especially its
  `subscriptionBilling` and `models` fields, for the specifics.

  1. The cost vs. capability tradeoff: the most capable models (current
     flagship models from Anthropic and OpenAI, and comparable models from
     other labs) produce better code and reason through harder problems,
     but cost more per request. Cheaper or free models are fine for small,
     well-specified tasks but tend to need more course-correction on
     anything complex, which often costs more time than the money saved.
     Show the student how to see and switch the current model in your
     harness (most use a `/model` command; check yours). Model lineups
     change often, so don't present specific model names or prices as
     current unless your profile or the vendor's docs confirm them.

  2. Subscription vs. API billing: most harnesses support two ways to pay
     for models: a flat monthly subscription (e.g. a ChatGPT or Claude
     plan) or pay-per-token API billing. Recommend a subscription plan as
     the default starting point for interactive use, it's usually the
     better value and avoids surprise bills. Explain that free tiers
     specifically tend to default to weaker models, and that this often
     costs more in wasted time than a paid plan would have cost in money.
     Then explain how billing works in your harness specifically, from
     your profile's `subscriptionBilling.summary`: which subscription
     logins it supports, whether a subscription login actually draws on
     the plan's limits when used from this harness, and how an API key
     changes that. Call out the common surprise for your harness, e.g. in
     Claude Code a stray ANTHROPIC_API_KEY in the environment silently
     switches to per-token billing (`/status` shows which is active). If
     your harness is `generic` or its profile doesn't cover the student's
     provider, say so plainly rather than guessing, and point them to that
     provider's own pricing page.

     Never suggest routing a Claude Pro/Max subscription through any
     harness other than Claude Code. Anthropic's terms prohibit it, and
     don't offer community plugins or workarounds that do it.

  3. Context windows: what they are (the amount of text, in tokens, a
     model can "see" at once, including the conversation, file contents,
     and tool output), that larger flagship models typically offer
     100K-1M+ token windows while smaller/cheaper models are often much
     smaller (8K-32K), and that hitting the limit can cause the agent to
     lose track of earlier context or slow down. Practical guidance: keep
     sessions focused on one task, and start a fresh session for unrelated
     work.

  4. Mention Cloudflare as an option: Cloudflare AI Gateway is a proxy that
     routes requests to providers like OpenAI and Anthropic through a
     single Cloudflare bill via Unified Billing, useful if the student
     already has a Cloudflare account and wants to consolidate billing.
     Workers AI runs a curated set of open-source models directly on
     Cloudflare's network. Neither is required for this course, mention
     them as options, not requirements.

  This lesson has no file-system verification step. Confirm understanding
  conversationally (or via the quiz, if the student opted in) before
  marking it complete.
---

The model behind your agent is the single biggest factor in how useful it'll be to you. More capable models write better code, catch more mistakes, and need less hand-holding, but they cost more per request. Cheaper or free models can be fine for small, well-defined tasks, but on anything nontrivial they often need more back-and-forth to get right, which can end up costing more in your time than a better model would have cost in money.

## Subscription vs. pay-per-token

Most agent harnesses let you pay one of two ways: a flat monthly subscription tied to the model vendor's own app (like a ChatGPT or Claude plan), or pay-per-token API billing. For everyday interactive coding, a subscription plan is usually the better starting point: it's predictable, and it's typically better value than paying per token for the same amount of use. Pay-per-token billing makes more sense for automation, CI, or workloads where a human isn't in the loop deciding when to send the next message.

Free tiers exist on most harnesses, but they usually default to the vendor's weakest available models. That's fine for learning the tool itself, but if you find yourself fighting the model to get simple things right, that's a sign it's time to either add a paid subscription or switch to a stronger model on your current plan.

## Context windows

Every model has a context window: the amount of text it can consider at once, measured in tokens (roughly ¾ of a word). This includes your messages, any files the agent has read, and its own previous responses. Flagship models today typically offer context windows from 100,000 tokens up to a million or more, which is enough for long sessions without much thought. Smaller or cheaper models often have much smaller windows (8,000-32,000 tokens), which can fill up quickly.

When a context window fills up, agents typically either summarize older parts of the conversation to make room, or start losing track of earlier instructions. If your agent starts behaving as if it's forgotten something you told it earlier, that's usually a context problem, not a reasoning problem. Keeping sessions focused on one task, and starting fresh sessions for unrelated work, goes a long way.

## Cloudflare as a model provider

If you already have a Cloudflare account, two options are worth knowing about, though neither is required for this course:

- **[AI Gateway](https://developers.cloudflare.com/ai-gateway/)** is a proxy in front of providers like OpenAI, Anthropic, and others. With [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/), you can pay for multiple providers through one Cloudflare bill instead of managing a separate account with each one.
- **[Workers AI](https://developers.cloudflare.com/workers-ai/)** runs a curated set of open-source models directly on Cloudflare's network.

Check your harness's own documentation for how to point it at a custom provider or gateway.
