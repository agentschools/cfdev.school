---
description: "Create an AI Gateway, route a Worker's model calls through it with custom metadata, and inspect the live request logs."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Teaching approach (use this flexible rhythm across the course, adapting to the student's lead):
  - **Teach the "why" and mental model first**: Before asking the student for config names or running CLI commands, explain what problem the feature solves, how it changes the request path, and any new terms (like *gateway* and *metadata* tags), pitched to their interview answers (GET /api/students/{id}/interviews). Never rely on the web page's video clip to explain a concept; you can drop a one-line optional link to `<origin>/courses/ai-gateway/see-every-request` (or `/media/courses/ai-gateway/see-every-request.mp4`), but teach everything directly in chat.
  - **Show a compact Before/After diagram in chat**: Draw a short ASCII diagram in chat showing how requests flow without vs. with AI Gateway so visual and text learners both get the mental model immediately.
  - **Never link a dead `GET /` Worker**: If you give the student a `.workers.dev` URL, clicking it in a browser must work. When scaffolding a new Worker for this course, serve an interactive HTML playground on `GET /` alongside `POST /ask` so the student can send prompts, switch teams, toggle cache bypass, and see the live response + `logId` in their browser.
  - **Let the student drive and explore**: Keep features live while the student tries them, and link them directly to their Cloudflare Dashboard when visual inspection adds value.

  1. Teach the concept first (before setup):
     - Explain what an AI gateway is: a proxy checkpoint between your application and the AI models it calls. Without it, your app calls OpenAI, Anthropic, or Workers AI directly and you can't easily see per-team spend, cache repeat answers, swap models without redeploying, or block bad prompts in one place.
     - Show a compact Before/After flow in chat, tailored to the provider they picked in question 2 of the interview (e.g. `env.AI.run()` for Workers AI, or pointing an SDK's `baseURL` at `https://gateway.ai.cloudflare.com/v1/<account-id>/<gateway-id>/<provider>`):
       ```text
       Before:  Your App ──────────────────────────────► Model Provider (no central logs or controls)
       After:   Your App ──(prompt + metadata)──► AI Gateway ──► Workers AI / OpenAI / Anthropic
                                                      │
                                           Logs · Cache · Limits · Routes · Guardrails
       ```
     - Explain **metadata** (tags): up to 5 flat key-value labels (like `{ user: "alex", team: "interns" }`) that your server attaches to each request so you can filter logs, attribute cost, and route traffic by team or user even when the whole app shares one model credential.
     - Then, in the same message, ask the student if they'd like to use an existing Worker or create a new interactive lab Worker, and ask what gateway ID and two team names they want to use (or offer defaults: `dev-school-gateway`, `interns`, and `escalations`). Wait for their reply.

  2. Create the gateway and interactive lab Worker:
     - Resolve their `<account-id>` first (`cf auth whoami` or `cloudflare.config.ts`). If `cf` stops with "More than one account available", ask which account to use and set `accountId` in `cloudflare.config.ts` and `CLOUDFLARE_ACCOUNT_ID` for CLI calls.
     - Create the gateway with `cf ai-gateway gateways create --id <gateway-id> --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding` (or `cf ai-gateway gateways get <gateway-id>` if it already exists; if they reuse an existing gateway, note any settings it already has, such as `authentication` or `workers_ai_billing_mode`, because later exercises' `gateways update` commands replace the whole configuration and must carry them over).
     - If they don't have an existing Worker for this course, scaffold one with `cf init <dir>` (e.g. `ai-gateway-lab`), add `AI: bindings.ai({ dev: { remote: true } })` to `worker.env` in `cloudflare.config.ts` (importing `bindings` from `"cf/config"`), and run `cf workers types`. Mention in one sentence why `dev: { remote: true }` is set: even in local dev, calls go through their real AI Gateway and Workers AI on Cloudflare.
     - In `src/index.ts`, implement two routes:
       - `POST /ask`: reads `{ prompt, user, team, skipCache }` from JSON, calls `env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", { messages: [{ role: "user", content: prompt }] }, { gateway: { id: "<gateway-id>", metadata: { user, team }, skipCache: Boolean(skipCache) } })` wrapped in a `try / catch` (returning `{ error: String(err), logId: env.AI.aiGatewayLogId }` with status `429`/`424` on gateway errors), and returns `Response.json({ response, logId: env.AI.aiGatewayLogId, metadata: { user, team } })`.
       - `GET /`: serves a clean, self-contained HTML lab page where the student can type a prompt, pick a `team` from a `<select>` (using their two team names), toggle a `Bypass cache (skipCache)` checkbox, click **Ask through the gateway**, and see the model's answer, the returned `logId`, and the attached `metadata` tags right on the page. (If the student brought their own Worker, make sure `GET /` either serves a working page or explains how to call `/ask` so clicking the Worker URL never returns a dead 404.)
     - Show the student the key `env.AI.run(..., { gateway: { id, metadata } })` code and point out that `user` and `team` are attached on the server, where a caller can't spoof another team's tag.
     - Deploy with `cf deploy` and send two initial `POST /ask` requests (one per team) so the gateway has live log entries ready to inspect.

  3. Have the student try their lab page and inspect the Cloudflare Dashboard:
     - Share two clickable links with the student:
       1. Their live lab Worker URL (`https://<worker>.<subdomain>.workers.dev/`) — invite them to open it and send a question under either team.
       2. Their direct AI Gateway Logs dashboard URL: `https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>/logs`
     - Give them a quick dashboard exploration mission: open the Logs link, click one of their recent requests to expand it, and look at what the gateway captured (the model used, token counts, duration, cost estimate, and their custom `metadata` tags).
     - Also ask the comprehension check in the same turn so they can reply once they've looked: why should a real app attach `user` and `team` metadata on the server rather than trusting tags sent from the browser? Wait for their reply.

  4. Mark complete:
     - Confirm via `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` that requests for both teams appear in the gateway logs with `metadata`.
     - Gently correct anything off in their answer, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "cache-responses".

  Out of scope here: routes, caching, rate limits, spend limits, and Guardrails/DLP — those are the next exercises.
---

# See every request

<figure>
<video controls playsinline preload="none" width="1920" height="1080" crossorigin="anonymous" poster="/media/courses/ai-gateway/see-every-request-poster.jpg">
<source src="/media/courses/ai-gateway/see-every-request.mp4" type="video/mp4">
<track kind="captions" src="/media/courses/ai-gateway/see-every-request-captions.vtt" srclang="en" label="English">
<a href="/media/courses/ai-gateway/see-every-request.mp4">Watch the demo clip</a>.
</video>
<figcaption>Routing a model request through AI Gateway and inspecting its log and metadata. <a href="/media/courses/ai-gateway/see-every-request.mp4">Direct video link</a></figcaption>
</figure>

Before you can control your AI traffic, you need to see it. Routing calls through [AI Gateway](https://developers.cloudflare.com/ai-gateway/) records the provider, model, input and output tokens, duration, and estimated cost for every request, while server-attached `metadata` (up to five flat key-value pairs like `user` and `team`) lets you filter logs, break down spend, and route traffic even when your whole app shares one gateway credential.

## What you'll build

An AI Gateway in your Cloudflare account and an interactive lab Worker that calls a [Workers AI](https://developers.cloudflare.com/workers-ai/) model through the gateway, tags each request with `user` and `team` metadata, and displays the model's answer alongside `env.AI.aiGatewayLogId` so you can inspect the matching record in your Cloudflare dashboard.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).

## Where AI Gateway sits: before and after

Without a gateway, each part of your application calls model providers directly, leaving you with no single place to see usage, attach team tags, or enforce policies. With AI Gateway, every request passes through a proxy checkpoint on Cloudflare's network first:

```mermaid
flowchart TD
  subgraph Before["Before: Direct model calls"]
    AppDirect["Your Worker or App"] -->|"direct API call"| ProviderDirect["Workers AI · OpenAI · Anthropic"]
  end
  subgraph After["After: Through AI Gateway"]
    App["Your Worker or App"] -->|"prompt + metadata"| Gateway["Cloudflare AI Gateway\nLogs · Cache · Limits · Routes · Guardrails"]
    Gateway --> WorkersAI["Workers AI"]
    Gateway --> External["OpenAI · Anthropic · Google"]
  end
```

In a Worker using the [Workers AI binding](https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/), you pass a `gateway` object as the third argument to `env.AI.run()`:

```ts title="src/index.ts"
const result = await env.AI.run(
  "@cf/meta/llama-3.1-8b-instruct-fp8",
  { messages: [{ role: "user", content: prompt }] },
  {
    gateway: {
      id: "dev-school-gateway",
      metadata: { user, team },
    },
  },
);

return Response.json({
  response: (result as { response?: string }).response ?? result,
  logId: env.AI.aiGatewayLogId,
  metadata: { user, team },
});
```

If you call OpenAI, Anthropic, or another provider from an SDK, it's the same idea: point `baseURL` at `https://gateway.ai.cloudflare.com/v1/<account-id>/<gateway-id>/<provider>` and pass metadata in the `cf-aig-metadata` header.
