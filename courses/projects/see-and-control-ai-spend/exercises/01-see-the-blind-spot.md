---
description: "Put an AI Gateway in front of a multi-caller app, build a live usage receipt on the page, and watch unattributed calls blend into one blind total."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Read this course's interview (GET /api/students/{id}/interviews) and Agent setup's interview first.

  1. Teach the concept first (solid ground before setup):
     - Calibrate to their interview: if they're new to token billing, explain in plain words that model providers meter every request by **tokens** (word-pieces sent in the prompt and returned in the reply, priced per model), and that apps usually authenticate with one shared credential. Because that credential doesn't say *who* inside your app pressed send, human tiers and runaway background jobs all land on one blended invoice.
     - Draw Stage 1 of the course's progressive diagram in chat:
       ```text
       Before:   [ Free · Pro · Background Task ] ──► Your Worker ──► 70B Model (no central logs or cost view)
       Stage 1:  [ Free · Pro · Background Task ] ──► Your Worker ──► AI Gateway (logs total tokens & cost, all "anonymous") ──► 70B Model
       ```
     - Propose a concrete theme and three callers based on their interview answers (for example, `free` users, `pro` users, and a `background-agent` loop on either their existing Worker or a new Worker like `ai-spend-lab`), plus a gateway ID (default `spend-control-gateway`). Ask if they'd like to use those names or tweak them. Wait for their reply.

  2. Build the gateway, the three-caller Worker, and the live usage receipt:
     - Resolve their `<account-id>` (`cf auth whoami` or `cloudflare.config.ts`). If `cf` stops with "More than one account available", ask which account to use and set `accountId` in `cloudflare.config.ts` and `CLOUDFLARE_ACCOUNT_ID` for CLI calls.
     - Create the gateway with `cf ai-gateway gateways create --id <gateway-id> --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding` (or `cf ai-gateway gateways get <gateway-id>` if it already exists; note any existing settings so later updates preserve them).
     - Set up the project:
       - If they chose an existing project, read its `AGENTS.md` to fit its stack and add the `AI` binding (`AI: bindings.ai({ dev: { remote: true } })` in `cloudflare.config.ts` or `"ai": { "binding": "AI", "remote": true }` in Wrangler projects).
       - If they chose a new Worker, scaffold it with `cf init <dir>`, add `AI: bindings.ai({ dev: { remote: true } })` to `worker.env` in `cloudflare.config.ts` (importing `bindings` from `"cf/config"`), run `cf workers types`, and write a short `AGENTS.md`.
     - Implement `POST /api/run` in the Worker so it reads `{ prompt, caller, tier }` from JSON and calls the flagship 70B model through the gateway **without** metadata tags yet (`env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages: [{ role: "user", content: prompt }] }, { gateway: { id: "<gateway-id>", skipCache: true } })`). Have it return `Response.json({ response, model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", logId: env.AI.aiGatewayLogId, attributedTo: "anonymous (no metadata)" })`.
     - On `GET /`, serve a clean, interactive HTML page tailored to their chosen app theme that includes:
       1. Three caller action buttons: one for their first human caller (e.g. **Free tier: quick summary**), one for their second human caller (e.g. **Pro tier: deep analysis**), and one **Run background agent loop (4x)** button that fires 4 rapid automated requests in a loop.
       2. A live **Usage receipt** table on the page that appends each completed request (`Time · Actual caller clicked · What the gateway sees ("anonymous") · Model (70B) · Status · logId`) and shows a running tally of calls.
     - Deploy with `cf deploy` and trigger one request for each of the three callers so live entries exist in the gateway.

  3. Let the student experience the blind spot:
     - Share two clickable links:
       1. Their deployed Worker URL (`https://<worker>.<subdomain>.workers.dev/`) — invite them to click all three caller buttons (especially the 4x background loop) and look at the **Usage receipt** on the page.
       2. Their AI Gateway Logs dashboard URL: `https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>/logs`
     - Point out the productive failure: the gateway now gives them one total across every call, yet both the receipt's "What the gateway sees" column and the Cloudflare dashboard logs show no distinction between a paying customer, a free user, and a background loop hammering the 70B model.
     - Offer a scenario check tailored to their interview profile (or let them reply `"next"` anytime to keep moving):
       - For a builder or developer: why can't a model provider's invoice or a single shared API key tell you whether a sudden 4x traffic jump came from new paying users or a bug in a background loop?
       - For someone in a sales, SE, or customer-facing role: if a customer says *"We already see our monthly total on our OpenAI or Anthropic invoice — why put a gateway in front?"*, how would you frame the difference between seeing the *aggregate total* across providers and seeing *who* is spending it?
       Wait for their reply.

  4. Mark complete:
     - Confirm via `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` that the Worker's `@cf/meta/llama-3.3-70b-instruct-fp8-fast` calls are recorded in the gateway.
     - Connect their answer to the concrete mechanism (skip hollow `"Correct!"` praise), or share a one-line takeaway if they replied `"next"`, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "attribute-every-caller".

  Out of scope here: metadata tags, model routing, and spend limits — those are the next three exercises.
---

# See the blind spot

When teams first ship an AI feature, every caller in the app — free users, paying customers, internal teams, and background jobs — usually shares one model binding or API key. When the monthly bill jumps, Finance asks a simple question Engineering can't answer: *who spent it?*

And the biggest spender often isn't a person. At Cloudflare, a single internal AI code-review agent processed nearly 25 billion tokens in 30 days — running at machine speed with no cost intuition under the same shared infrastructure. Before you can set a budget or optimize models, you need a single checkpoint that sees every request.

## What you'll build

An [AI Gateway](https://developers.cloudflare.com/ai-gateway/) in front of your Worker and a live **Usage receipt** on your app's page with three callers — two human tiers or teams and one automated background loop — all calling a flagship 70B model (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`). You'll fire all three and see why aggregate visibility alone still leaves every caller anonymous.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).

## Stage 1: one checkpoint for every model call

Routing your Worker's calls through AI Gateway gives you a single pane of glass across [Workers AI](https://developers.cloudflare.com/workers-ai/), OpenAI, Anthropic, Bedrock, and other providers. Every request's model, token count, latency, and estimated cost are recorded in one place:

```mermaid
flowchart LR
  subgraph Callers["Three callers in your app"]
    Free["Free / routine caller"]
    Pro["Pro / complex caller"]
    Bot["Background agent loop"]
  end
  Callers --> Worker["Your Worker"]
  Worker -->|"no metadata yet"| Gateway["Stage 1: AI Gateway\nLogs total requests, tokens & cost\n(all callers appear identical)"]
  Gateway --> Model["Llama 3.3 70B"]
```

Passing `{ gateway: { id } }` as the third argument to `env.AI.run()` routes the call through your gateway without changing how your app works:

```ts title="src/index.ts"
const result = await env.AI.run(
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  { messages: [{ role: "user", content: prompt }] },
  {
    gateway: {
      id: "spend-control-gateway",
      skipCache: true,
    },
  },
);

return Response.json({
  response: (result as { response?: string }).response ?? result,
  model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  logId: env.AI.aiGatewayLogId,
  attributedTo: "anonymous (no metadata)",
});
```

## Why a total still isn't attribution

| What you can see after Stage 1 | What is still hidden |
| :--- | :--- |
| Total requests, input/output tokens, and estimated cost across all providers in one dashboard. | Which caller (`free`, `pro`, or `background-agent`) generated the tokens. |
| Whether the flagship 70B model is being called 4x more than yesterday. | Whether a background retry loop or free-tier traffic is eating your margin. |

In the next exercise, you'll label every request on the server so the receipt and dashboard break spend down by caller.
