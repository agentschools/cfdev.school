---
description: "Move model selection out of your Worker and into a versioned dynamic route that branches on metadata, falls back on failure, and updates without redeploying your app."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the gateway and Worker from "cache-and-rate-limit"; check GET /api/progress/{studentId} first.

  1. Video clip (check question 4 of the `ai-gateway` interview):
     - If they chose "show me the clips as we go": share `<origin>/media/courses/ai-gateway/route-and-fall-back.mp4`. Open `<origin>/courses/ai-gateway/route-and-fall-back` in your browser panel if you have one, or render `[![Watch the demo clip](<origin>/media/courses/ai-gateway/route-and-fall-back-poster.jpg)](<origin>/media/courses/ai-gateway/route-and-fall-back.mp4)` and offer to open it in their browser. Tell them what to watch for: replacing the hardcoded model name with `dynamic/support`, routing `interns` vs. `escalations` to different models based on metadata, and swapping a model in the gateway without redeploying the app.
     - If they chose "just link them": drop a one-line link to `<origin>/media/courses/ai-gateway/route-and-fall-back.mp4`.
     - If they chose "skip videos": don't mention or link the video.
  2. Choose the route: tell the student their Worker will stop naming a specific model and instead call `dynamic/support`. Ask which Workers AI model they want for the economical branch (e.g. `@cf/meta/llama-3.1-8b-instruct-fp8`) and which for the capable branch (e.g. `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, with `@cf/openai/gpt-oss-120b` as its fallback), or if they want to use those defaults. Wait for their reply.
  3. Create and deploy the dynamic route:
     - Write a `route-v1.json` file with this `elements` array (using their team name and chosen models):
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
     - Run `cf ai-gateway dynamic-routing create <gateway-id> --name support --elements @route-v1.json`. Point out that creating the route also creates and deploys version 1 (`"active": true`). Save the returned route `id` (UUID) for step 6.
  4. Update the Worker to call `"dynamic/support"`:
     - In `src/index.ts`, change the first argument of `env.AI.run()` from `"@cf/meta/llama-3.1-8b-instruct-fp8"` to `"dynamic/support"`. Show the student that one-line diff: the Worker no longer knows or cares which model serves the request.
     - Deploy the updated Worker once with `cf deploy` so their live Worker is on `"dynamic/support"`.
  5. Verify routing by team:
     - Send a `POST /ask` request with `team: "interns"` and another with `team: "escalations"`.
     - Wait a few seconds, then run `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` and show the student that the gateway routed `interns` to the economical model and `escalations` to the capable model — same Worker code, different metadata, different model.
  6. Swap a model with zero app redeploy:
     - Ask the student to predict: if we change the interns' model in the dynamic route to `@cf/ibm-granite/granite-4.0-h-micro`, do we need to run `cf deploy` on the Worker? Wait for their reply.
     - Create `route-v2.json` with `@cf/ibm-granite/granite-4.0-h-micro` on the `economical` node, then create and deploy version 2 of the route:
       `cf ai-gateway dynamic-routing versions create <route-id> --gateway-id <gateway-id> --elements @route-v2.json`
       Then deploy its `version_id`:
       `cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id <gateway-id> --version-id <version-id>`
       Note: route deployments can take ~30-60 seconds to propagate to the edge.
     - Send the `team: "interns"` request again (retrying after ~30 seconds if the log still shows the v1 model) and confirm in `cf ai-gateway logs list` that `@cf/ibm-granite/granite-4.0-h-micro` served the request without redeploying the Worker.
  7. Comprehension check: ask the student what happens when the primary model on the `capable` branch returns an error or times out, and why moving model selection into a dynamic route helps when a new model launches. Wait for their reply and gently correct anything off.
  8. Mark complete: only after verifying both branches and the zero-redeploy v2 route change in the gateway logs, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "block-bad-prompts".

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

When a model name is hardcoded in your application, every model upgrade, tier rule, or provider outage requires a code change and a deployment across every service that calls it.

## What you'll build

A versioned [Dynamic Route](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/), `dynamic/support`, that sends `interns` to a fast economical model and `escalations` to a larger model with an automatic fallback. Then you'll deploy a new version of the route and watch the model change without redeploying your Worker.

## Prerequisites

- You've completed [Cache and rate limit](/courses/ai-gateway/cache-and-rate-limit) and still have that Worker and gateway.

## Moving model choice into the gateway

Instead of naming a specific model, your Worker asks for `"dynamic/support"` and passes who's asking in `metadata`:

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

Inside AI Gateway, `dynamic/support` evaluates your routing rules and picks the model:

```text
dynamic/support
  ├── metadata.team == "interns"  ──► @cf/meta/llama-3.1-8b-instruct-fp8
  └── otherwise ("escalations")   ──► @cf/meta/llama-3.3-70b-instruct-fp8-fast
                                        └── on failure ──► @cf/openai/gpt-oss-120b
```

## Why it matters

- **Policy lives in the gateway, not the app:** free vs. paid users, interns vs. escalations, or A/B percentage splits are configured in one place and recorded in the gateway logs.
- **Zero-redeploy model swaps and rollbacks:** every route edit is saved as a version. Trying a new model or rolling back to a previous version takes one deployment in the gateway, with no application release.
- **Built-in fallback:** if the primary model on a branch errors or times out, the gateway follows the route's fallback edge to a backup model or provider automatically.
