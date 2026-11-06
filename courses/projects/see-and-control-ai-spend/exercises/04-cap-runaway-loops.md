---
description: "Set a metadata-scoped dollar spend limit on your background agent, trigger a runaway loop to watch it trip or downgrade, and verify human users keep working uninterrupted."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on "match-models-to-the-job"; check GET /api/progress/{studentId} first.

  1. Teach the concept first (solid ground before setup):
     - Explain why routing alone doesn't stop a runaway loop: a human eventually closes their laptop, but an autonomous agent or background job in a retry loop runs at machine speed until something stops it.
     - Explain why **how** you cap spend matters:
       1. **Dollars, not just request counts**: a rate limit counts requests, where 100 calls to a large model cost far more than 100 calls to a small open-source model. **Spend limits** set a ceiling in dollars over a time window.
       2. **Scoped by metadata (blast-radius isolation)**: a single company-wide cap freezes paying customers when one bot misbehaves. Scoping a spend limit to `metadata.caller == "agent"` isolates the ceiling to the background agent alone.
       3. **Block or automatic downgrade**: when a caller hits its dollar ceiling (`429 Spend limit exceeded`), you can either stop that bot or fall back to an economical open-source model so critical drafts or summaries keep flowing at a fraction of the cost.
       4. **Eventual consistency**: because a request's token cost is tallied as the request finishes, a simultaneous burst near the cap can briefly overshoot before the next requests are blocked — like a credit-card limit that updates as charges post.
     - Redraw the progressive diagram from Exercise 3 and add Stage 4 (the metadata-scoped spend limit):
       ```text
       Stage 4:  [ Callers ] ──► Your Worker ──(+ metadata)──► AI Gateway
                                                                 ├── [ Spend Limit: caller == "agent" ($ cap) ]
                                                                 │      └── over budget? ──► 429 Block or Downgrade to 8B (only this bot)
                                                                 └── [ Route: dynamic/spend-tier ]
                                                                        ├── tier == "free" ──► Economical open-source model
                                                                        └── tier == "pro"  ──► 70B Flagship (untouched when bot trips!)
       ```
     - Ask the student what should happen in their app when the background agent blows past its dollar budget: **hard-block the agent (`429`)** or **automatically downgrade the agent to the economical open-source model** so work continues cheaply? Wait for their reply.

  2. Configure the agent-scoped dollar spend limit and wire the Worker handler:
     - Remember that `cf ai-gateway gateways update` replaces the whole gateway configuration (`PUT`). First run `cf ai-gateway gateways get <gateway-id>` so you carry over any existing settings.
     - Enable a tiny dollar spend limit (`$0.00001` per 30-day window) scoped specifically to `metadata.caller == "agent"`:
       `cf ai-gateway gateways update <gateway-id> --body '{"collect_logs":true,"cache_ttl":0,"cache_invalidate_on_update":true,"rate_limiting_interval":0,"rate_limiting_limit":0,"rate_limiting_technique":"sliding","spend_limits":{"enabled":true,"rules":[{"id":"background-agent-budget","enabled":true,"limitType":"cost","limit":0.00001,"window":2592000,"technique":"fixed","metadata":{"caller":{"mode":"filter","values":["agent"]}}}]}}'`
     - Update the Worker's `POST /api/run` handler to match the student's choice when AI Gateway returns a spend-limit error (`Spend limit exceeded`):
       - If they chose **hard block**: catch the error and return `Response.json({ status: "blocked-by-spend-limit", error: String(err), logId: env.AI.aiGatewayLogId, metadata }, { status: 429 })`.
       - If they chose **automatic downgrade**: catch the spend-limit error on the primary call and immediately retry the request against the economical open-source model (`@cf/google/gemma-4-26b-a4b-it`) with a separate fallback tag (`{ caller: "agent-downgraded", tier: "free", task: metadata.task }`), returning `Response.json({ status: "downgraded-after-spend-limit", model: "@cf/google/gemma-4-26b-a4b-it", response, logId: env.AI.aiGatewayLogId, metadata })`.
     - Update the `GET /` **Usage receipt** so blocked or downgraded agent rows highlight clearly alongside a **Before vs. After governance summary**.
     - Deploy with `cf deploy`. Spend limit rules take ~45–60 seconds to propagate, and cost is recorded as a request completes: send one `caller: "agent"` request to consume the `$0.00001` budget, wait ~45–60 seconds, then send another `caller: "agent"` request and confirm it hits the `background-agent-budget` rule (returning `429` or triggering the downgrade), while a `caller: "human", tier: "pro"` request immediately after succeeds (`200`) on the 70B route.

  3. Let the student test blast-radius isolation live:
     - Leave the spend limit active while the student replies, and share their live Worker URL (`GET /`) and AI Gateway dashboard link (`https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>/logs`).
     - Invite them to click **Run background agent loop** on their page (watching the bot get capped or downgraded on the receipt) and then click **Pro tier** right next to it to see paying human traffic sail through untouched.
     - Offer a scenario check tailored to their interview profile (or let them reply `"next"` anytime to finish the course):
       - For a builder or developer: why can a simultaneous burst of requests briefly overshoot a dollar spend limit before the next call is blocked, and how does scoping limits by `metadata` keep one noisy tenant or bot from taking down the rest of your app?
       - For someone in a sales, SE, or customer-facing role: if an engineering leader objects *"We can't put hard dollar caps on AI Gateway because it'll break our developers or customer features mid-day"*, how would you walk them through watching usage first, scoping limits per agent or tier, and using downgrade fallbacks instead of a blunt company-wide block?
       Wait for their reply.

  4. Mark complete:
     - Confirm via `cf ai-gateway gateways get <gateway-id>` and your live test responses that `background-agent-budget` triggered on `caller: "agent"` while `tier: "pro"` succeeded.
     - Reset the temporary `$0.00001` ceiling (`"spend_limits":{"enabled":false,"rules":[]}`) or raise it to a realistic dollar budget (e.g. `$10`) if they want to keep using the app, and let the student know.
     - Connect their answer to the concrete mechanism (skip hollow `"Correct!"` praise), or share a one-line takeaway if they replied `"next"`, and mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes.

  Out of scope here: exporting gateway logs to R2 via Logpush for multi-year SIEM/BI retention and governing MCP tool calls via Cloudflare Access MCP Portals.
---

# Cap runaway loops

Visibility and model tiering lower your everyday burn rate, but they don't stop a bug. When a background agent gets stuck in a retry loop at 2:00 AM, it doesn't notice the bill climbing. And if your only safeguard is a single gateway-wide rate limit or a hard cap on your provider account, that one runaway bot takes down every paying customer using your app.

In this final exercise, you'll give your background agent its own dollar budget in [AI Gateway](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) — isolating its blast radius so it blocks or downgrades to a cheap open-source model when its budget runs out, while human users keep working uninterrupted.

## What you'll build

A metadata-scoped dollar [spend limit](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) (`metadata.caller == "agent"`) on your gateway and a handler in your Worker that either blocks the runaway loop with `429` or downgrades it to a lower-cost model, while proving that `pro` and `free` human requests continue to succeed.

## Prerequisites

- You've completed [Match models to the job](/courses/see-and-control-ai-spend/match-models-to-the-job) and still have that Worker, gateway, and route.

## Stage 4: the complete spend-control pipeline

Adding a metadata-scoped spend limit in front of your route completes the four-stage architecture. Every request is now logged, attributed by caller and tier, checked against per-caller dollar budgets, and routed to the right model:

```mermaid
flowchart LR
  subgraph Callers["Three callers in your app"]
    Free["Free / routine caller"]
    Pro["Pro / complex caller"]
    Bot["Background agent loop"]
  end
  Callers --> Worker["Your Worker\nstamps { caller, tier, task }"]
  Worker --> Gateway["Stage 1 & 2: AI Gateway\nLogs & attribution"]
  Gateway --> Limit{"Stage 4: Spend limit\ncaller == agent over $ cap?"}
  Limit -->|"over budget"| Cap["429 Block or Downgrade\n(only the runaway agent)"]
  Limit -->|"under budget / human"| Route{"Stage 3: Route\nmetadata.tier == free?"}
  Route -->|"true"| Fast["Economical open-source model"]
  Route -->|"false"| Flagship["Llama 3.3 70B + fallback"]
```

A spend limit rule is defined in dollars (`"limitType": "cost"`) and scoped to any metadata key your Worker attaches:

```json title="Spend limit rule (scoped to caller = agent)"
{
  "id": "background-agent-budget",
  "enabled": true,
  "limitType": "cost",
  "limit": 50,
  "window": 2592000,
  "technique": "fixed",
  "metadata": {
    "caller": { "mode": "filter", "values": ["agent"] }
  }
}
```

## Key guardrails to keep in mind

| Question | How AI Gateway handles it |
| :--- | :--- |
| **Why dollars instead of request rate limits?** | 100 calls to a 70B or frontier model cost far more than 100 calls to an 8B model. Finance and engineering both budget in dollars. |
| **What happens when a budget is hit?** | AI Gateway returns `429 Too Many Requests` (`Spend limit exceeded`) for that rule's scope. You can stop the caller or catch `429` and fall back to a cheaper open-source model so work continues. |
| **Is the dollar cap exact to the penny on a traffic spike?** | Spend limits are **eventually consistent**: token cost is recorded as each request finishes, so a simultaneous burst near the cap can briefly overshoot before subsequent calls are blocked. |
| **Where do logs go if compliance or Finance needs multi-year BI retention?** | [AI Gateway Logpush](https://developers.cloudflare.com/ai-gateway/observability/logging/logpush/) exports full request, token, cost, and metadata logs to [Cloudflare R2](https://developers.cloudflare.com/r2/) with zero egress fees. |
