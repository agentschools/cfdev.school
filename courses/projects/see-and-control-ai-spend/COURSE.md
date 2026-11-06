---
name: see-and-control-ai-spend
description: "See who is driving your AI bill across human tiers and background agents, route routine work to lower-cost open-source models, and isolate runaway loops with per-caller dollar budgets."
compatibility: "Requires a Cloudflare account (the Workers Free plan works) and the cf CLI, both set up in the Agent setup course. Uses Workers AI out of the box, with no external API keys required."
metadata:
  author: Thomas Desmond
---

# See and control AI spend

Shipping an AI feature is fast; explaining the bill a month later is hard. When every user tier, internal team, and background job calls models through the same shared API key or binding, your invoice shows one big number and never tells you *who* spent it. Worse, your biggest spender often isn't a person at all — an automated agent stuck in a retry loop or a free tier running on a flagship model for one-line summaries can quietly burn through your budget over a weekend.

In this project course, you'll take an app you already built (or start a small new one shaped around your own use case) with three callers — two human tiers or teams and one automated background task — plus a live usage receipt on the page. Step by step, you'll put a single control point in front of your model calls so you can **see the spend first, then govern it**:

```mermaid
flowchart LR
  Callers["Free · Pro · Background agent"] --> Worker["Your Worker\n(+ caller & tier metadata)"]
  Worker --> Gateway["Cloudflare AI Gateway\n1. Attribute · 2. Route · 3. Cap"]
  Gateway -->|"routine / free"| Fast["Economical open-source model"]
  Gateway -->|"complex / pro"| Flagship["Flagship 70B model + fallback"]
```

| Stage | What breaks without it | What you'll add |
| :--- | :--- | :--- |
| **1. See the blind spot** | Every caller shares one credential, so human requests and runaway background loops blend into one unattributed total. | Route calls through [AI Gateway](https://developers.cloudflare.com/ai-gateway/) and render a live usage receipt on your page. |
| **2. Attribute every caller** | Seeing the total doesn't tell Finance or Product whether free users, paying customers, or a looping bot caused a spike. | Attach server-verified `metadata` (`caller`, `tier`, `task`) and inspect the breakdown to find the two hidden cost leaks. |
| **3. Match models to the job** | Everyone defaults to the largest model for every task, eating margin on simple work. | Move model choice into a versioned [route](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/) that sends routine calls to a fast open-source model on [Workers AI](https://developers.cloudflare.com/workers-ai/) with zero app redeploy. |
| **4. Cap runaway loops** | A company-wide limit freezes paying customers whenever a background agent loops. | Enforce a metadata-scoped dollar [spend limit](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) that caps or downgrades the background agent while human users keep working. |
