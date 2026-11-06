---
description: "Attach server-verified caller and tier metadata to every request, run a mixed traffic burst, and uncover the two cost leaks hiding in your logs."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on "see-the-blind-spot"; check GET /api/progress/{studentId} first.

  1. Teach the concept first (solid ground before setup):
     - Remind the student what just happened in Stage 1: the gateway recorded every call, but couldn't tell a paying customer apart from a looping background job.
     - Explain how **metadata** tags close that gap: your Worker attaches up to five flat key-value labels (such as `caller`, `tier`, and `task`) to each request before sending it to AI Gateway. Because your server sets those labels from its own session or job context, the dashboard and receipt can break spend down by person, team, customer tier, or named agent.
     - Redraw the pipeline from Exercise 1 and add Stage 2 (server-attached metadata):
       ```text
       Stage 1:  [ Callers ] ──► Your Worker ──► AI Gateway (1 blended "anonymous" total) ──► 70B Model
       Stage 2:  [ Callers ] ──► Your Worker ──(+ metadata: caller, tier, task)──► AI Gateway (spend broken down by caller & tier) ──► 70B Model
       ```
     - Show the metadata keys you'll attach for their three callers (e.g. `{ caller: "human", tier: "free", task: "summary" }`, `{ caller: "human", tier: "pro", task: "analysis" }`, and `{ caller: "agent", tier: "internal", task: "auto-review" }`) and ask if they'd like to add a tenant or team name of their own. Wait for their reply.

  2. Add server-side metadata, update the live receipt, and run a mixed traffic investigation:
     - In the Worker's `POST /api/run` handler, map the incoming action to server-controlled `metadata` (`{ caller, tier, task }`) and pass `metadata` inside `{ gateway: { id: "<gateway-id>", metadata, skipCache: true } }`. Return `metadata` and an estimated token/cost breakdown in the JSON response.
     - Update the `GET /` HTML page's **Usage receipt** so it:
       1. Shows each request's `metadata` tags (`caller`, `tier`, `task`) instead of `"anonymous"`.
       2. Renders a live **Spend breakdown by caller** summary bar above the receipt showing each caller's share of requests and estimated 70B token spend.
     - Deploy with `cf deploy`. Then fire a realistic mixed burst of traffic against the deployed Worker (for example: 1 `pro` request, 2 `free` requests with short one-line prompts, and 5 rapid `agent` requests simulating a retry loop on the same item) so the gateway logs have a clear mystery to inspect.
     - Share clickable links to their deployed Worker URL (`GET /`) and their AI Gateway Logs dashboard (`https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>/logs`).
     - Invite them to trigger a burst on their page (or inspect the logs you just generated) and spot the **two margin leaks** now visible in the breakdown:
       1. Which caller is generating the most calls without a human at the keyboard?
       2. Which caller is paying flagship 70B model prices for short, routine work?
     - Also offer a role-personalized scenario hook in the same turn (or let them reply `"next"` anytime to keep moving):
       - For a builder or developer: why must `caller` and `tier` metadata be attached inside your Worker on the server rather than trusted from a browser request header?
       - For someone in a sales, SE, or customer-facing role: when a company ships AI features to its own end users, AI tokens become Cost of Goods Sold (COGS) — how does tagging requests by `{ customerId, tier, feature }` change a conversation with a Product or Finance buyer whose "$40,000 AI bill" is actually "$26,000 spent by free-tier users"?
       Wait for their reply.

  3. Mark complete:
     - Run `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 8 --order-by created_at --order-by-direction desc` and confirm log entries appear with `metadata` for their human tiers and `agent`.
     - Connect their answer to the concrete mechanism (skip hollow `"Correct!"` praise), or share a one-line takeaway if they replied `"next"`, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "match-models-to-the-job".

  Out of scope here: routing calls to different models and setting dollar spend limits — those are the next two exercises.
---

# Attribute every caller

Routing calls through AI Gateway gave you a single total, like seeing a $4,000 charge on a shared corporate credit card. To know whether that spend is healthy customer growth, free-tier users eating your product margin, or a background bot stuck in a loop, every request needs to carry a label stating who is behind it.

In one real example from Cloudflare's own AI Gateway rollout, adding attribution immediately revealed that a single employee had spent $2,000 on frontier models while the entire data science team spent $400 — and when companies ship AI to external customers, tagging by customer tier often turns a mystery "$40,000 AI bill" into "free-tier users cost us $26,000 of it."

## What you'll build

Server-attached `metadata` tags (`caller`, `tier`, and `task`) on every `env.AI.run()` call, plus a live **Spend breakdown by caller** view on your app's page. Then you'll run a mixed burst of traffic and inspect your receipt and gateway logs to uncover two hidden cost leaks.

## Prerequisites

- You've completed [See the blind spot](/courses/see-and-control-ai-spend/see-the-blind-spot) and still have that Worker and gateway.

## Stage 2: server-attached metadata tags

 AI Gateway lets your Worker attach up to five key-value pairs in `gateway.metadata`. Building on Stage 1's diagram, your Worker now stamps each request on the server before it reaches the gateway:

```mermaid
flowchart LR
  subgraph Callers["Three callers in your app"]
    Free["Free / routine caller"]
    Pro["Pro / complex caller"]
    Bot["Background agent loop"]
  end
  Callers --> Worker["Your Worker\nstamps server-verified metadata"]
  Worker -->|"{ caller, tier, task }"| Gateway["Stage 2: AI Gateway\nBreaks down spend & logs\nby caller, tier, and task"]
  Gateway --> Model["Llama 3.3 70B"]
```

Attach `metadata` inside your Worker where a browser client can't spoof another user's or tier's label:

```ts title="src/index.ts"
const metadata = {
  caller: isAgent ? "agent" : "human",
  tier: isAgent ? "internal" : userTier, // "free" | "pro" | "internal"
  task: taskName,                        // "summary" | "analysis" | "auto-review"
};

const result = await env.AI.run(
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  { messages: [{ role: "user", content: prompt }] },
  {
    gateway: {
      id: "spend-control-gateway",
      metadata,
      skipCache: true,
    },
  },
);
```

## Two scopes, same tagging pattern

Depending on who uses your app, the same five metadata slots answer two different business questions:

| Scope | What you tag | What the breakdown reveals |
| :--- | :--- | :--- |
| **Internal people & agents** | `{ caller: "agent", team: "eng", app: "pr-review" }` | Which team or runaway background bot is driving the monthly bill. |
| **External customer-facing AI (COGS)** | `{ customerId: "acme", tier: "free", feature: "summary" }` | Cost per customer and tier so Product can see whether free users are unprofitable. |

Once you can see *who* is spending and *what* they're asking for, you'll notice everyone is still calling the flagship 70B model for every task. Next, you'll fix that in the gateway without rewriting your app.
