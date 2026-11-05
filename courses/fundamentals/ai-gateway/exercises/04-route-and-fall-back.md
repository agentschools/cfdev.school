---
description: "Move model selection out of your Worker and into a versioned gateway route that branches on metadata, falls back on failure, and updates without redeploying your app."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the gateway and Worker from "cap-requests-and-spend"; check GET /api/progress/{studentId} first. Always refer to this feature simply as **Routes** (or a **route** in AI Gateway). Do not rely on the video clip to teach; you can mention `<origin>/courses/ai-gateway/route-and-fall-back` as an optional reference, and teach everything directly in chat.

  1. Teach what Routes are and why they exist (before building):
     - Explain the problem with hardcoding a model name (like `"@cf/meta/llama-3.1-8b-instruct-fp8"` or `"gpt-4o"`) inside application code: every time a better model launches, a provider has an outage, or you want different tiers (like a fast, cheap model for `interns` and a larger reasoning model for `escalations`), you have to edit code and redeploy every service that calls the model.
     - Explain how **Routes** in AI Gateway solve this: your app asks the gateway for a named route (`"dynamic/support"`) and passes `metadata`. Inside AI Gateway, the route is a versioned decision graph that can:
       1. **Branch on metadata** (e.g. `metadata.team == "interns"` → fast model; otherwise → capable model).
       2. **Fall back automatically** if a primary model times out, errors, or hits a rate limit (even across different providers like OpenAI → Anthropic → Workers AI).
       3. **Deploy new versions or roll back** in the gateway with zero application redeploys.
     - Draw a compact route diagram in chat so the student can see the flow:
       ```text
       Worker calls "dynamic/support"
                     │
          [ metadata.team == "interns"? ]
              ├── true  ──► Llama 3.1 8B (fast & economical)
              └── false ──► Llama 3.3 70B (capable)
                                 │ (on error / timeout)
                                 ▼
                            GPT-OSS 120B (automatic fallback)
       ```
     - Ask the student if they want to use those default models for their two branches and fallback (`@cf/meta/llama-3.1-8b-instruct-fp8`, `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, and `@cf/openai/gpt-oss-120b`), or pick different Workers AI models. Wait for their reply.

  2. Create the route and point the Worker at `"dynamic/support"`:
     - Write `route-v1.json` with this `elements` array (using their team name and chosen models):
       ```json
       [
         { "id": "start", "type": "start", "outputs": { "next": { "elementId": "team_check" } } },
         {
           "id": "team_check",
           "type": "conditional",
           "properties": { "conditions": { "metadata.team": { "$eq": "interns" } } },
           "outputs": { "true": { "elementId": "economical" }, "false": { "elementId": "capable" } }
         },
         {
           "id": "economical",
           "type": "model",
           "properties": { "provider": "workers-ai", "model": "@cf/meta/llama-3.1-8b-instruct-fp8", "timeout": 30000, "retries": 0 },
           "outputs": { "success": { "elementId": "end" }, "fallback": { "elementId": "end" } }
         },
         {
           "id": "capable",
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
     - Create the route with `cf ai-gateway dynamic-routing create <gateway-id> --name support --elements @route-v1.json` (which creates the route and deploys version 1). Save the returned route `id` (UUID) for step 3.
     - In `src/index.ts`, change the first argument of `env.AI.run()` from `"@cf/meta/llama-3.1-8b-instruct-fp8"` to `"dynamic/support"`. Show the student that one-line diff: the Worker no longer names a model at all.
     - Deploy the updated Worker once with `cf deploy`, send one request for `interns` and one for `escalations`, and confirm in `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` that each team was served by its branch's model.
     - Share the direct dashboard links to their gateway's Routes and Logs (`https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>`) and invite them to switch between `interns` and `escalations` on their lab page to see the route pick different models.
     - Ask the student to predict: if we swap the `interns` branch in the route to `@cf/ibm-granite/granite-4.0-h-micro`, do we need to touch or redeploy the Worker? Wait for their reply.

  3. Swap a model with zero Worker redeploy and verify:
     - Create `route-v2.json` with `@cf/ibm-granite/granite-4.0-h-micro` on the `economical` node, then create and deploy version 2 of the route:
       `cf ai-gateway dynamic-routing versions create <route-id> --gateway-id <gateway-id> --elements @route-v2.json`
       Then deploy its `version_id`:
       `cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id <gateway-id> --version-id <version-id>`
       Note: route deployments can take ~30-60 seconds to propagate to the edge.
     - Send a `team: "interns"` request (retrying after ~30 seconds if the log still shows the v1 model) and confirm in `cf ai-gateway logs list` that `@cf/ibm-granite/granite-4.0-h-micro` served the request without redeploying the Worker.
     - Ask the comprehension check: what happens in this route if the primary model on the `escalations` branch errors or times out, and why does keeping routing and fallbacks in the gateway help when you run multiple apps or agents? Wait for their reply.

  4. Mark complete:
     - Gently correct anything off in their answer, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "block-bad-prompts".

  Out of scope here: Auto Router (`cloudflare/auto`, which picks models by analyzing the prompt rather than rules you write) and percentage-split A/B testing (mention in one sentence that percentage nodes work in the same route graph).
---

# Route and fall back

<figure>
<video controls playsinline preload="none" width="1920" height="1080" crossorigin="anonymous" poster="/media/courses/ai-gateway/route-and-fall-back-poster.jpg">
<source src="/media/courses/ai-gateway/route-and-fall-back.mp4" type="video/mp4">
<track kind="captions" src="/media/courses/ai-gateway/route-and-fall-back-captions.vtt" srclang="en" label="English">
<a href="/media/courses/ai-gateway/route-and-fall-back.mp4">Watch the demo clip</a>.
</video>
<figcaption>Routing requests by team metadata and swapping models in AI Gateway without redeploying the app. <a href="/media/courses/ai-gateway/route-and-fall-back.mp4">Direct video link</a></figcaption>
</figure>

When a model name is hardcoded in your application, every model upgrade, tier change, or provider outage requires a code change and a deployment across every service that calls it. Moving model choice into a versioned [route](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/) in AI Gateway lets the gateway pick the model from request metadata, fall back automatically if a primary model fails, and swap or roll back models without touching your application code.

## What you'll build

A gateway route named `dynamic/support` that sends `interns` to a fast economical model and `escalations` to a larger model with an automatic fallback. Then you'll deploy a second version of the route and watch the model change with zero Worker redeploy.

## Prerequisites

- You've completed [Cap requests and spend](/courses/ai-gateway/cap-requests-and-spend) and still have that Worker and gateway.

## Moving model choice into a route

Instead of naming a specific model in code, your Worker calls `"dynamic/support"` and passes who's asking in `metadata`:

```ts title="src/index.ts"
const result = await env.AI.run(
  "dynamic/support",
  { messages: [{ role: "user", content: prompt }] },
  {
    gateway: {
      id: "dev-school-gateway",
      metadata: { user, team },
    },
  },
);
```

Inside AI Gateway, the `support` route evaluates your versioned decision graph: it checks `metadata.team`, routes each team to the right model, falls back to a backup model if the primary model fails or times out, and lets you publish a new version of the route without redeploying your Worker:

```mermaid
flowchart TD
  App["Your Worker\nenv.AI.run('dynamic/support')"] -->|"prompt + metadata"| Start["AI Gateway Route: support"]
  Start --> Check{"metadata.team == interns?"}
  Check -->|"true"| Economical["Llama 3.1 8B\n(swap to Granite in v2 — no app redeploy)"]
  Check -->|"false"| Capable["Llama 3.3 70B"]
  Capable -->|"on error or timeout"| Backup["GPT-OSS 120B (fallback)"]
```
