---
name: see-and-control-ai-spend
description: "See who's driving your AI bill, from free users to paying customers to background bots, move routine work to cheaper models, and give runaway bots their own budget. Go as deep as you like, from the big picture to the code."
compatibility: "Requires a Cloudflare account (the Workers Free plan works) and the cf CLI, both set up in the Agent setup course. Uses Workers AI, so no provider API keys are needed."
metadata:
  author: Thomas Desmond
---

# See and control AI spend

Shipping an AI feature is fast. Explaining the bill a month later is hard. When every user tier, internal team, and background job calls models with the same key, the invoice shows one big number and never says *who* spent it. And the biggest spender often isn't a person: a bot stuck in a retry loop, or free users getting an expensive model for one-line summaries, can quietly use up a budget over a weekend.

In this project course, you'll take a small app with three callers, two kinds of human users and one background bot, and put a single checkpoint in front of its model calls: [AI Gateway](https://developers.cloudflare.com/ai-gateway/). Then you'll see the spend first, and govern it second:

```mermaid
flowchart LR
  Callers["Free · Pro · Background bot"] --> Worker["Your Worker\n(labels who's calling)"]
  Worker --> Gateway["AI Gateway\n1. See · 2. Attribute · 3. Route · 4. Cap"]
  Gateway -->|"routine tasks"| Small["Small, low-cost model"]
  Gateway -->|"hard tasks"| Big["Big model + fallback"]
```

You choose how technical it gets: the big picture with no code, how it works with the key settings, or hands-on with all the code. Everyone builds the same app; only the explanation changes.
