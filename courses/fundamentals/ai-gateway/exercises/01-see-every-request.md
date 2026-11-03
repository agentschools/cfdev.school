---
description: "Create an AI Gateway, route a Worker's model calls through it with custom metadata, and inspect the live request logs."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Keep the pace brisk: this whole course is designed to finish in under 30 minutes, so keep explanations to two or three sentences and avoid unnecessary redeploys. Read the student's interviews first (GET /api/students/{id}/interviews).

  1. Video clip (check question 4 of the `ai-gateway` interview first):
     - If they chose "show me the clips as we go": share `<origin>/media/courses/ai-gateway/see-every-request.mp4` (where `<origin>` is the site you fetched `/llms.txt` from). If you have a built-in browser panel tool (like `openchamber_web`'s `browser.open`), open `<origin>/courses/ai-gateway/see-every-request` in it; in Markdown chat, render `[![Watch the 90-second demo](<origin>/media/courses/ai-gateway/see-every-request-poster.jpg)](<origin>/media/courses/ai-gateway/see-every-request.mp4)` and offer to open it in their system browser (`open` on macOS, `xdg-open` on Linux, `start` on Windows). Tell them what to watch for: a two-line change routes requests through the gateway, and every call shows up in the logs with tokens, latency, cost, and custom metadata.
     - If they chose "just link them": include a one-line link to `<origin>/media/courses/ai-gateway/see-every-request.mp4` and move straight to step 2.
     - If they chose "skip videos": do not mention or link the video.
  2. Walk through the body's architecture diagram ("Where AI Gateway sits") in two or three sentences, tailored to their provider preference from question 2 of the interview: whether an app calls Workers AI through `env.AI.run()` or OpenAI/Anthropic via an SDK `baseURL`, the request goes through AI Gateway first, which logs and governs it before forwarding to the provider.
  3. Choose: in one message, ask the student for:
     - a gateway ID (lowercase letters, numbers, and dashes, e.g. `dev-school-gateway`), and
     - two team names to tag requests with in metadata (default: `interns` and `escalations`).
     Wait for their reply.
  4. Create the gateway and Worker:
     - Create the gateway with `cf ai-gateway gateways create --id <gateway-id> --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding`. (If it already exists from an earlier run, `cf ai-gateway gateways get <gateway-id>` confirms it.) If `cf` stops with "More than one account available", ask which account to use or read `cf auth whoami`, and set `accountId` in `cloudflare.config.ts` and `CLOUDFLARE_ACCOUNT_ID` for CLI calls.
     - Scaffold a new Worker with `cf init <dir>` (e.g. `ai-gateway-lab`), add `AI: bindings.ai({ dev: { remote: true } })` to `worker.env` in `cloudflare.config.ts` (importing `bindings` from `"cf/config"`), and run `cf workers types`. Explain in one sentence why `dev: { remote: true }` is set: local dev calls the real model and real AI Gateway on their Cloudflare account.
     - Write a minimal `POST /ask` handler in `src/index.ts` (~25 lines, like the body's example) that reads `{ prompt, user, team }` from the JSON body, calls `env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", { messages: [{ role: "user", content: prompt }] }, { gateway: { id: "<gateway-id>", metadata: { user, team } } })`, and returns `Response.json({ response, logId: env.AI.aiGatewayLogId, metadata: { user, team } })`. Point out that `team` and `user` are attached on the server, where the caller can't forge another user's tag.
     - Deploy the Worker once with `cf deploy` so it's live on their account, and keep `cf dev` handy for fast iteration.
  5. Verify before completing. YOU must:
     - send two `POST /ask` requests (against the deployed URL or `cf dev`) with different `team` and `user` values (e.g. `interns` and `escalations`) and confirm each returns a non-empty `response` and a `logId`;
     - wait a few seconds for log ingestion, then run `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` and confirm both requests appear with their model, token counts, duration, cost estimate, and `metadata`. Show the student the log output.
     Don't trust the student saying it worked.
  6. Comprehension check: ask the student why metadata like `team` or `user` should be attached by their Worker on the server rather than trusted from a browser header. Wait for their reply and gently correct anything off.
  7. Mark complete: only after verification succeeds, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "cache-and-rate-limit".

  Out of scope here: dynamic routes, caching, rate limits, and Guardrails/DLP — those are the next three exercises.
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

Before you can control your AI traffic, you need to see it. When your app calls a model directly, those requests don't leave a central trail of who asked, how long the model took, or what it cost.

## What you'll build

An [AI Gateway](https://developers.cloudflare.com/ai-gateway/) in your Cloudflare account and a Worker with an `/ask` route that calls a [Workers AI](https://developers.cloudflare.com/workers-ai/) model through the gateway, tags each request with `user` and `team` metadata, and returns the gateway's log ID.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).

## Where AI Gateway sits

Without a gateway, your application talks straight to each model provider. With AI Gateway, every request passes through a proxy on Cloudflare's network first:

```text
Without AI Gateway:

  Your Worker or App ───────────────────────────────────► Model Provider
  (holds API keys, hardcodes the model,                   (Workers AI, OpenAI,
   no central logs, cache, or limits)                      Anthropic, ...)

With AI Gateway:

  Your Worker or App ──► Cloudflare AI Gateway ─────────► Model Provider
  (sends prompt +        ├── Logs & metadata (who, cost)  ├── Workers AI
   who's asking)         ├── Cache & rate limits          ├── OpenAI / Anthropic
                         ├── Dynamic routes & fallbacks   └── Any other provider
                         └── Guardrails & DLP
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
});
```

If you call OpenAI, Anthropic, or another provider from an SDK, it's the same idea: point `baseURL` at `https://gateway.ai.cloudflare.com/v1/<account-id>/<gateway-id>/<provider>` and pass metadata in the `cf-aig-metadata` header.

## Why it matters

- **Immediate visibility:** every request records the provider, model, input and output tokens, duration, and estimated cost, with its log ID on `env.AI.aiGatewayLogId`.
- **Attribution across one gateway:** your app uses one binding or gateway credential, while server-attached `metadata` (up to five flat key-value pairs like `user` and `team`) lets you filter logs, break down spend, and route traffic by who is asking.
