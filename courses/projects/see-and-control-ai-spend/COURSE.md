---
name: see-and-control-ai-spend
description: "See who's driving your AI bill, route routine prompts to cheaper models, and cap runaway background jobs before they blow your budget."
compatibility: "Requires a Cloudflare account (the Workers Free plan works) and the cf CLI, both set up in the Agent setup course. Uses Workers AI, so no provider API keys are needed."
metadata:
  author: Thomas Desmond
---

# See and control AI spend

The cost of implementing AI features in your app can add up fast. When every request (whether by human or agent) calls models with the same API key, you're missing valuable information. To optimize the associated costs, you need to know:

- who spent what
- what models were used
- how many tokens were sent

In this course, you'll start from the [three-caller lab](https://github.com/jamesqquick/ai-spend-control-course/tree/main), which sends requests directly to Workers AI. It has presets to make AI calls from:

- free-user
- pro-user
- background-bot

You'll then update the Worker to send those same requests through [AI Gateway](https://developers.cloudflare.com/ai-gateway/) to get insights, logging, and visibility into the details of each call.

```mermaid
flowchart TD
  App["Your app\nFree users · Paying users · Background bots"] --> Gateway["Cloudflare AI Gateway\nSee who spends what · Set budgets"]
  Gateway -->|"Simple tasks"| Cheap["Fast, low-cost model"]
  Gateway -->|"Complex tasks"| Capable["Frontier model"]
```
