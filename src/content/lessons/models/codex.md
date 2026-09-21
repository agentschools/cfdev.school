---
lessonSlug: models
harness: codex
title: "Models"
description: "Choose and pay for models in Codex."
order: 1
quiz: true
agentInstructions: |
  Cover these topics for Codex specifically:

  1. The cost vs. capability tradeoff: Codex currently defaults to
     GPT-5.3-Codex, OpenAI's flagship coding model. Mention that the model
     Codex uses may change over time, and that switching or checking the
     current model is done via /model.

  2. Billing: codex login opens a ChatGPT browser flow and bills against
     the student's ChatGPT plan (Free, Go $8/mo, Plus $20/mo, Pro
     $200/mo), this is the recommended default, and unlike some other
     harnesses, OpenAI officially endorses this path (the "Codex for OSS"
     program). codex login --with-api-key switches to standard per-token
     OpenAI API billing instead, better suited to CI/automation than
     everyday interactive use. codex login status shows which is active.

  3. Context windows: mention the shared context-window guidance
     (larger windows on flagship models, smaller on cheaper ones,
     compaction/summarization as sessions grow, keep sessions focused).

  4. Mention Cloudflare AI Gateway/Workers AI briefly as an option for
     consolidating billing across providers, not required for this course.

  This lesson has no file-system verification step. Confirm understanding
  conversationally (or via the quiz, if the student opted in) before
  marking it complete.
---

Codex currently defaults to GPT-5.3-Codex, OpenAI's flagship coding model, tuned for agentic coding work. The specific default model can change over time as OpenAI ships new ones; check or switch with `/model`.

## Subscription vs. API billing

Codex is built to run on your ChatGPT plan. Running `codex login` opens a browser sign-in and bills against whatever plan you have: Free, Go ($8/month), Plus ($20/month), or Pro ($200/month). This is the recommended default, and it's worth knowing that OpenAI explicitly endorses this path for third-party harnesses too (their "Codex for OSS" program), so this isn't a workaround, it's how it's meant to be used.

If you'd rather pay per token, `codex login --with-api-key` switches you to standard OpenAI API billing instead. That's usually the better fit for CI pipelines or automation where no one's watching the conversation, not for everyday interactive coding. Run `codex login status` any time to see which route is currently active.

## Context windows

The same general rule applies here as with any model: flagship models offer large context windows (often well over 100,000 tokens), while smaller or cheaper models offer much less. As a session fills its context window, older parts of the conversation tend to get summarized or dropped, so keeping sessions focused on a single task and starting fresh sessions for unrelated work will keep things running smoothly.

## Cloudflare as a model provider

If you want to route OpenAI (or other providers) through a single Cloudflare bill, [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) supports that via [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/). Not required for this course, just an option if you already have a Cloudflare account.
