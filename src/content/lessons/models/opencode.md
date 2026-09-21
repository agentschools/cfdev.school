---
lessonSlug: models
harness: opencode
title: "Models"
description: "Choose and pay for models in OpenCode."
order: 1
quiz: true
agentInstructions: |
  Cover these topics for OpenCode specifically:

  1. The cost vs. capability tradeoff: OpenCode is model-agnostic with 75+
     provider support, so this choice matters more here than in
     single-vendor harnesses. State-of-the-art models cost more but need
     less course-correction; cheaper or free models are fine for smaller
     tasks.

  2. Billing and subscriptions: OpenCode itself is free, you pay providers
     directly. Explain the supported subscription paths: ChatGPT Plus,
     GitHub Copilot, and GitLab Duo all work with zero extra setup, since
     those vendors permit third-party routing. Claude Pro/Max does NOT
     work this way: Anthropic explicitly prohibits routing a Claude
     subscription through OpenCode, and OpenCode removed the plugins that
     used to do this as of v1.3.0. For Claude models, the only supported
     paths are an Anthropic API key or OpenCode's own Zen gateway
     (pay-as-you-go). OpenCode Go ($5 first month, then $10/month) is
     OpenCode's own subscription for a curated set of capable open models.
     Recommend: use whichever subscription you already have if it's on
     the supported list (ChatGPT Plus, Copilot, GitLab Duo), otherwise
     OpenCode Go is a reasonable low-cost starting point.

  3. Context windows: mention the shared context-window guidance.

  4. Mention Cloudflare AI Gateway/Workers AI briefly as another provider
     option OpenCode can connect to, not required for this course.

  Do not suggest a workaround for using a Claude Pro/Max subscription in
  OpenCode. It isn't supported, and community plugins that attempted it
  violate Anthropic's terms.

  This lesson has no file-system verification step. Confirm understanding
  conversationally (or via the quiz, if the student opted in) before
  marking it complete.
---

OpenCode is model-agnostic, with support for 75+ providers, so which model and which provider you pick matters more here than in a single-vendor harness. The same general rule applies everywhere: more capable models need less hand-holding but cost more; cheaper or free models are fine for smaller, well-specified tasks.

## Subscription vs. API billing

OpenCode itself is free and open source; you pay whichever model provider you connect. A few paths are worth knowing:

- **ChatGPT Plus, GitHub Copilot, and GitLab Duo** all work in OpenCode with zero extra setup, if you already have one of those subscriptions, use it.
- **Claude Pro/Max does not work this way.** Anthropic's terms explicitly prohibit routing a Claude subscription through third-party tools like OpenCode, and OpenCode removed the plugins that used to attempt this as of version 1.3.0. For Claude models in OpenCode, your only supported options are an Anthropic API key (pay-per-token) or OpenCode's own Zen gateway (pay-as-you-go).
- **OpenCode Go** ($5 for the first month, then $10/month) is OpenCode's own subscription, giving access to a curated set of capable open-weight models.

If you already have one of the supported subscriptions, use it. Otherwise, OpenCode Go is a reasonable low-cost way to get started without managing per-token API billing directly.

## Context windows

The usual guidance applies: larger, more capable models tend to offer bigger context windows, smaller or cheaper ones offer less, and a full context window means older conversation history gets summarized or dropped. Keep sessions focused on one task and start fresh sessions for unrelated work.

## Cloudflare as a model provider

OpenCode's provider list includes options for routing through [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/), useful if you want a single Cloudflare bill across multiple providers via [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/). Not required for this course, just an option if you already have a Cloudflare account.
