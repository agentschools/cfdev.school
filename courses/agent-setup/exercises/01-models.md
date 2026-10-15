---
description: "Get to know the models your agent can use, when each one is worth it, and the best-value way to pay for them."
agent-instructions: |
  This exercise is about the models available in the harness you're
  running in, not models in general. Use your harness profile
  (GET /api/harnesses/{yourHarnessId}): `models` (each with `bestFor`,
  context window, and API price) and `subscriptionBilling` (its `plans`
  list and `summary`). The profile can lag behind the vendor, so check
  what your harness actually offers too: most have a `/model` command
  that lists the models available to the student's account. If the two
  disagree, go with what the harness shows and say so.

  1. The models they have. Show the student the models their harness
     offers on their plan, as a short list: name, what it's for (from
     `bestFor`), and how to switch to it. Then show them how to see and
     change the current model themselves (`/model` in most harnesses;
     check yours). Have them actually run it.

  2. When each is worth it. Explain the tradeoffs with their models as
     the examples, not abstract tiers:
     - Bigger models plan better, catch more of their own mistakes, and
       need less correction on hard or unfamiliar problems. They're
       slower, and they use up a subscription's limits faster (or cost
       more per token on an API key).
     - Smaller, faster models are great for quick, well-defined edits,
       and the wait matters more than the depth there.
     - A good default habit: stay on the harness's default or a mid-size
       model, step up when a task is big, risky, or going in circles, and
       step down for small, mechanical changes.
     For Claude Code, that's Sonnet for everyday coding, Opus for complex
     work, Fable for the hardest and longest tasks (it can bill usage
     credits on some plans, and Claude Code asks first), and Haiku for
     quick, simple ones. For Codex, that's GPT-6.1 Sol for most work,
     Astra for the hardest, and Luna for focused, cheap tasks (and on the
     Free and Go plans). For harnesses that aren't tied to one lab, like
     OpenCode and Pi, the models depend on which provider they sign in
     with, so start from that: ask, or check what's configured.

  3. Paying for them. Recommend a subscription for interactive use: a
     flat price and no surprise bills, usually better value than paying
     per token. If they're new and don't have one, the best value is
     Claude Pro (for Claude Code) or ChatGPT Plus (for Codex), both
     $20/month with generous usage limits; ChatGPT's free plan also works
     in Codex, with lower limits and the smaller Luna model. Then explain
     how it works in their harness from `subscriptionBilling.plans`:
     which plans it can sign in with (`signIn`), and whether that usage
     draws on the plan's own limits (`countsAgainstPlan`). The important
     cross-harness facts:
     - OpenAI allows ChatGPT plans in third-party harnesses (OpenCode,
       Pi), and usage counts against the plan.
     - Anthropic doesn't allow Claude Pro/Max plans in harnesses other
       than Claude Code. Where a harness still offers a Claude login, it
       bills separately, so there's no plan benefit. Never suggest
       routing a Claude subscription through another harness, and don't
       offer plugins or workarounds that do it.
     Call out the common surprise for their harness, e.g. in Claude Code
     a stray ANTHROPIC_API_KEY in the environment silently switches to
     per-token billing (`/status` shows which is active). If their harness
     is `generic` or the profile doesn't cover their provider, say so
     plainly and point them to that provider's own pricing page.

  4. Context windows, briefly: the amount of text, in tokens, a model can
     consider at once, including the conversation, files it read, and
     tool output. Current flagship models have windows around a million
     tokens, but quality still drops in very long sessions. Practical
     habit: one task per session, and a fresh session for unrelated work.

  5. Mention Cloudflare as an option, briefly: AI Gateway gives one API
     for models from Anthropic, OpenAI, Google, and xAI (Grok), plus
     open-weights models like Kimi, GLM, and DeepSeek, all paid for
     through the student's Cloudflare account with Unified Billing. It
     isn't required for this course.

  This exercise has no file-system verification step. Before marking it
  complete, have the student switch models once with their harness's
  command and switch back, and confirm understanding conversationally (or
  via the quiz, if they opted in).
---

# Models

The model behind your agent is the biggest factor in how useful it'll be. Your agent can probably use several, and picking the right one for the task, and paying for it the right way, makes a real difference.

## The models in your agent

Each agent offers its own lineup, usually from fast and cheap to slow and most capable. In [Claude Code](https://code.claude.com/docs/en/model-config), that's Haiku, Sonnet, Opus, and Fable. In [Codex](https://developers.openai.com/codex/models), it's Luna, GPT-6.1 Sol, and Astra. Agents that aren't tied to one lab, like OpenCode and Pi, offer whatever models the providers you sign in with have.

Most agents let you see and switch models with a `/model` command. Your agent will show you yours.

## Bigger isn't always better

More capable models plan better, catch more of their own mistakes, and need less hand-holding on hard problems. They're also slower, and they use up your plan's limits faster. Smaller models are quick and great for small, well-defined changes.

A good habit: stick with your agent's default for most work, switch up for big or tricky tasks (or when it's going in circles), and switch down for quick, mechanical ones.

## Paying for it

For everyday coding, a subscription is usually the best value: a flat monthly price and no surprise bills. If you're new to this, start with [Claude Pro](https://claude.com/pricing) for Claude Code or [ChatGPT Plus](https://developers.openai.com/codex/pricing) for Codex. Both are $20/month with generous usage limits. ChatGPT's free plan works in Codex too, with lower limits.

Plans don't work everywhere. OpenAI lets you use a ChatGPT plan in other agents like OpenCode and Pi. Anthropic doesn't allow Claude plans outside Claude Code. [What's an agent?](/agents) lists how you pay for each supported agent.

## Context windows

Every model has a context window: the amount of text it can consider at once, measured in tokens (roughly ¾ of a word). It includes your messages, files the agent has read, and its own previous responses. Today's flagship models handle around a million tokens, but they still do best when a session stays focused. If your agent starts acting like it forgot something you said earlier, start a fresh session for the next task.

## Cloudflare as a model provider

If you already have a Cloudflare account, [AI Gateway](https://developers.cloudflare.com/ai-gateway/) is worth knowing about, though it isn't required for this course. Its [REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/) reaches models from Anthropic, OpenAI, Google, and xAI (Grok), plus open-weights models like Kimi, GLM, and DeepSeek, all through the same endpoints. With [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/), you load credits into your Cloudflare account and pay for all of them there, with no separate provider accounts or API keys.

## Where you'll use this

The model you picked does the work in every course from here. A short, well-defined exercise like [Deploy a Worker](/courses/workers/deploy-a-worker) is a good fit for your default. A bigger build that spans several exercises, like [Build a guestbook](/courses/build-a-guestbook), is where switching to a more capable model can pay off.
