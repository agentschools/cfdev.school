---
lessonSlug: models
harness: claude-code
title: "Models"
description: "Choose and pay for models in Claude Code."
order: 1
quiz: true
agentInstructions: |
  Cover these topics for Claude Code specifically:

  1. The cost vs. capability tradeoff: Opus is the most capable and most
     expensive Claude model, Sonnet is the balanced default for most
     coding work, and Haiku is fastest and cheapest for simple tasks.
     Switch models mid-session with /model.

  2. Billing: a Claude Pro ($20/mo), Max 5x ($100/mo), or Max 20x
     ($200/mo) plan covers Claude Code directly against the same usage
     pool as claude.ai, this is the recommended default for interactive
     use. If an ANTHROPIC_API_KEY environment variable is set, Claude Code
     uses it instead of the subscription and switches to per-token API
     billing (current rates: Haiku 4.5 ~$1/$5 per million input/output
     tokens, Sonnet 5 ~$3/$15, Opus 4.8 ~$5/$25); check /status to see
     which is active. Recommend the subscription route for most students.
     Mention that setting ANTHROPIC_API_KEY without meaning to is a common
     source of surprise API bills, run /status if usage feels off.

  3. Context windows: Claude models currently offer roughly 200K token
     context windows. Explain what that means in practice (see the
     shared context-window guidance) and that Claude Code will compact
     older context automatically as the window fills.

  4. Mention Cloudflare AI Gateway/Workers AI briefly as an option if the
     student wants to route Claude (or other providers) through a single
     Cloudflare bill, not required for this course.

  Do not suggest routing a Claude Pro/Max subscription through any tool
  other than Claude Code itself, Anthropic's terms explicitly prohibit
  that, and it doesn't apply here since we're talking about Claude Code's
  own native billing.

  This lesson has no file-system verification step. Confirm understanding
  conversationally (or via the quiz, if the student opted in) before
  marking it complete.
---

Claude Code gives you a choice between three current Claude models, shown just above your prompt: **Opus**, the most capable and most expensive, for hard problems; **Sonnet**, the balanced default most people use for everyday coding; and **Haiku**, the fastest and cheapest, good for simple, well-specified tasks. Switch at any time with `/model`.

## Subscription vs. API billing

Claude Code is designed to run on a Claude subscription. A **Pro** plan ($20/month), **Max 5x** ($100/month), or **Max 20x** ($200/month) all cover Claude Code directly, drawing from the same usage pool as claude.ai on the web. For most students, this is the right way to pay: predictable, and better value than paying per token for equivalent everyday use.

If you have an `ANTHROPIC_API_KEY` set in your environment, Claude Code will use it instead of your subscription, switching you to per-token API billing at standard rates (roughly $1/$5 per million input/output tokens for Haiku 4.5, $3/$15 for Sonnet 5, $5/$25 for Opus 4.8, current as of this writing). Run `/status` any time to see which billing route is active. A stray `ANTHROPIC_API_KEY` left over from another project is a common source of unexpected charges, if a bill looks off, that's the first thing to check.

One note on billing scope: this recommendation is specifically about Claude Code's own native subscription support. Anthropic's terms don't allow routing a Claude Pro/Max login through other tools on Claude Code's behalf, that's a different situation and doesn't affect anything here.

## Context windows

Claude's models currently offer around 200,000 tokens of context, enough for most sessions without much thought. As a session grows, Claude Code automatically summarizes older context to make room, so very long sessions keep working, just with less detail from early in the conversation available. If responses start seeming to ignore something you said a while back, starting a fresh session for your next task is usually the fix.

## Cloudflare as a model provider

If you'd rather route Claude (or other providers) through a single Cloudflare bill, [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) supports that via [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/). This isn't required for this course, just an option if you already have a Cloudflare account.
