---
description: "Move model selection into a versioned AI Gateway route that tiers routine and free-tier calls to a low-cost open-source model while keeping complex calls on 70B with automatic fallback."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on "attribute-every-caller"; check GET /api/progress/{studentId} first. Always refer to this feature simply as **Routes** (or a **route** in AI Gateway).

  1. Teach the concept first (solid ground before setup):
     - Connect to what they uncovered in Exercise 2: even after you can see every caller's spend, your bill keeps climbing if every caller defaults to a frontier or 70B model for every task (*frontier-by-default*). A short summary or free-tier request doesn't need the same model as deep reasoning.
     - Explain how **Routes** in AI Gateway let you tier models intentionally without hardcoding model names in your app: your Worker calls a named route (`"dynamic/spend-tier"`) and passes the same `metadata` tags from Exercise 2. The gateway evaluates a versioned decision graph that sends routine/free calls to a fast, lower-cost open-source model on Workers AI (~77% cheaper on comparable internal workloads at Cloudflare) and keeps complex/pro calls on the 70B model with an automatic fallback if the primary model fails.
     - Mention in two sentences how payment flexibility pairs with routing when calling third-party providers (like OpenAI or Anthropic): teams can use **Unified Billing** to experiment across providers on one Cloudflare bill (provider token rates passed through at cost, plus a 5% fee on purchased credits) or **Bring Your Own Keys (BYOK)** when they have a direct vendor contract.
     - Redraw the progressive diagram from Exercise 2 and add Stage 3 (the gateway route):
       ```text
       Stage 3:  [ Callers ] ──► Your Worker ("dynamic/spend-tier" + metadata) ──► AI Gateway Route
                                                                                      ├── tier == "free" ──► Gemma 4 26B (fast & low-cost open-source)
                                                                                      └── tier == "pro"  ──► Llama 3.3 70B ──(on error)──► GPT-OSS 120B
       ```
     - Ask if they'd like to use `@cf/google/gemma-4-26b-a4b-it` for their economical branch and `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (falling back to `@cf/openai/gpt-oss-120b`) for their flagship branch, or pick different Workers AI models. Wait for their reply.

  2. Create the route, update the Worker to call `"dynamic/spend-tier"`, and add a Before vs. After receipt view:
     - Write `route-v1.json` branching on `metadata.tier` (using their free/routine tier value):
       ```json
       [
         { "id": "start", "type": "start", "outputs": { "next": { "elementId": "tier_check" } } },
         {
           "id": "tier_check",
           "type": "conditional",
           "properties": { "conditions": { "metadata.tier": { "$eq": "free" } } },
           "outputs": { "true": { "elementId": "economical" }, "false": { "elementId": "flagship" } }
         },
         {
           "id": "economical",
           "type": "model",
           "properties": { "provider": "workers-ai", "model": "@cf/google/gemma-4-26b-a4b-it", "timeout": 30000, "retries": 0 },
           "outputs": { "success": { "elementId": "end" }, "fallback": { "elementId": "end" } }
         },
         {
           "id": "flagship",
           "type": "model",
           "properties": { "provider": "workers-ai", "model": "@cf/meta/llama-3.3-70b-instruct-fp8-fast", "timeout": 60000, "retries": 0 },
           "outputs": { "success": { "elementId": "end" }, "fallback": { "elementId": "backup" } }
         },
         {
           "id": "backup",
           "type": "model",
           "properties": { "provider": "workers-ai", "model": "@cf/openai/gpt-oss-120b", "timeout": 60000, "retries": 0 },
           "outputs": { "success": { "elementId": "end" }, "fallback": { "elementId": "end" } }
         },
         { "id": "end", "type": "end", "outputs": {} }
       ]
       ```
     - Create and deploy v1 of the route with `cf ai-gateway dynamic-routing create <gateway-id> --name spend-tier --elements @route-v1.json` and save the returned route `id` (UUID).
     - In the Worker, replace the hardcoded `"@cf/meta/llama-3.3-70b-instruct-fp8-fast"` string in `env.AI.run()` with `"dynamic/spend-tier"`, and update the `GET /` **Usage receipt** so it shows a side-by-side **Before (all 70B) vs. After (tiered route)** cost comparison whenever requests run.
     - Deploy the Worker once with `cf deploy`, send one `free` request and one `pro` request, and confirm in `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` that `free` ran on `@cf/google/gemma-4-26b-a4b-it` while `pro` ran on `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

  3. Swap the economical model in v2 with zero Worker redeploy:
     - Write `route-v2.json` swapping the `economical` node's model to `@cf/ibm-granite/granite-4.0-h-micro`, create version 2 (`cf ai-gateway dynamic-routing versions create <route-id> --gateway-id <gateway-id> --elements @route-v2.json`), and deploy it (`cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id <gateway-id> --version-id <version-id>`). Note that route deployments take ~30–60 seconds to propagate.
     - Send a `free` request (retrying after ~30 seconds if needed) and confirm in `cf ai-gateway logs list` that `@cf/ibm-granite/granite-4.0-h-micro` answered **without touching or redeploying the Worker**.
     - Share clickable links to their Worker URL (`GET /`) and their AI Gateway Routes dashboard (`https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>`) so they can compare the `free` vs. `pro` calls live.
     - Offer a scenario check tailored to their interview profile (or let them reply `"next"` anytime to keep moving):
       - For a builder or developer: why does moving model selection and provider fallbacks into a versioned gateway route make it safer to test a new open-source model across multiple services?
       - For someone in a sales, SE, or customer-facing role: if a customer objects *"Isn't putting AI Gateway and Unified Billing in front of our models just another form of vendor lock-in?"*, how would you explain how gateway routing, Unified Billing (5% fee on credits for one-bill experimentation), and BYOK actually make switching models and providers easier?
       Wait for their reply.

  4. Mark complete:
     - Confirm via `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` that both branches of `"dynamic/spend-tier"` have logged requests.
     - Connect their answer to the concrete mechanism (skip hollow `"Correct!"` praise), or share a one-line takeaway if they replied `"next"`, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "cap-runaway-loops".

  Out of scope here: percentage-split A/B routes and dollar spend caps — you'll cap the runaway agent in the next exercise.
---

# Match models to the job

Seeing who spent what reveals the most common reason AI bills balloon: **frontier-by-default**. When a model name is hardcoded in your application, every request — whether it's a complex pro workflow or a free-tier user summarizing a one-line note — hits the same expensive model, because testing or switching models requires code changes, new provider contracts, and app redeployments.

At Cloudflare, routing secondary tasks to open-source models on [Workers AI](https://developers.cloudflare.com/workers-ai/) cut inference costs by roughly 77% compared to running everything on proprietary frontier models (saving an estimated ~$2.4M/year on a single internal security workload).

## What you'll build

A versioned [route](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/) (`dynamic/spend-tier`) in AI Gateway that inspects your `metadata.tier` tag, sends `free` / routine requests to a fast open-source model, and keeps `pro` requests on the 70B model with an automatic backup model on failure. Then you'll publish version 2 of the route to swap models with zero Worker redeploy.

## Prerequisites

- You've completed [Attribute every caller](/courses/see-and-control-ai-spend/attribute-every-caller) and still have that Worker and gateway.

## Stage 3: tier models in the gateway, not in application code

Instead of hardcoding `"@cf/meta/llama-3.3-70b-instruct-fp8-fast"` in your Worker, you call `"dynamic/spend-tier"` and let the gateway's versioned route pick the model from `metadata`:

```mermaid
flowchart LR
  subgraph Callers["Three callers in your app"]
    Free["Free / routine caller"]
    Pro["Pro / complex caller"]
    Bot["Background agent loop"]
  end
  Callers --> Worker["Your Worker\nenv.AI.run('dynamic/spend-tier')"]
  Worker -->|"{ caller, tier, task }"| Gateway["Stage 2: AI Gateway\nAttribution & logs"]
  Gateway --> Route{"Stage 3: Route\nmetadata.tier == free?"}
  Route -->|"true (routine)"| Fast["Gemma 4 26B → Granite 4.0\n(swap in v2 with 0 redeploy)"]
  Route -->|"false (pro / agent)"| Flagship["Llama 3.3 70B"]
  Flagship -->|"on error / timeout"| Backup["GPT-OSS 120B (fallback)"]
```

In your Worker, the model name changes to the route name — a one-line diff:

```ts title="src/index.ts"
const result = await env.AI.run(
  "dynamic/spend-tier",
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

## Experimenting across providers without lock-in

When your route points at third-party model providers (like OpenAI, Anthropic, Google, or Bedrock) alongside Workers AI, AI Gateway gives you two ways to handle billing:

| Approach | When to use it | How billing works |
| :--- | :--- | :--- |
| **[Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/)** | Trying models across multiple providers without signing separate vendor contracts first. | Load prepaid credits on one Cloudflare bill; provider per-token rates pass through at cost with a 5% fee on credits purchased. |
| **[Bring Your Own Keys (BYOK)](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/)** | Committing to a provider where you already have a direct enterprise contract or committed spend. | Store your provider keys centrally in AI Gateway's Secrets Store; the provider bills you directly while you keep full gateway visibility and routing. |

Your `free` and `pro` callers are now right-sized, but your background agent is still running on the 70B branch with no ceiling. In the final exercise, you'll isolate and cap it.
