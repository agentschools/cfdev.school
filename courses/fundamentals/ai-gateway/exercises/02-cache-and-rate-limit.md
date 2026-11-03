---
description: "Turn on exact-match response caching, see when to skip the cache, and cap request volume with a gateway rate limit."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the gateway and Worker from "see-every-request"; check GET /api/progress/{studentId} first. Keep it fast: use `cf dev` (whose remote AI binding already hits the live gateway on their account) or their deployed Worker so you don't wait on unnecessary deploys.

  1. Video clip (check question 4 of the `ai-gateway` interview):
     - If they chose "show me the clips as we go": share `<origin>/media/courses/ai-gateway/cache-and-rate-limit.mp4`. Open `<origin>/courses/ai-gateway/cache-and-rate-limit` in your browser panel if you have one, or render `[![Watch the demo clip](<origin>/media/courses/ai-gateway/cache-and-rate-limit-poster.jpg)](<origin>/media/courses/ai-gateway/cache-and-rate-limit.mp4)` and offer to open it in their browser. Tell them what to watch for: turning on caching in the gateway, seeing `MISS` then `HIT` with a big latency drop and `$0` model cost, skipping cache per request, and fixed vs. sliding rate limits.
     - If they chose "just link them": drop a one-line link to `<origin>/media/courses/ai-gateway/cache-and-rate-limit.mp4`.
     - If they chose "skip videos": don't mention or link the video.
  2. Predict before enabling cache: tell the student that AI Gateway's default cache key hashes the request body and model, *not* `metadata`. Ask them: if `riley` (on `interns`) and `sam` (on `escalations`) send the exact same prompt while caching is on, what will happen on Sam's request, and when would that be a problem? Wait for their answer. Confirm: Sam gets Riley's cached answer immediately, which is great for shared FAQs and bad for personalized prompts unless you pass `skipCache: true` or a custom `cacheKey`.
  3. Enable caching and `skipCache`:
     - Ask the student what cache TTL (in seconds, at least 60, e.g. `300` for 5 minutes) they want on their gateway. Wait briefly if they haven't already said.
     - Update the gateway with `cf ai-gateway gateways update <gateway-id> --collect-logs true --cache-ttl <ttl> --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding`.
     - In `src/index.ts`, allow `{ prompt, user, team, skipCache }` in the request JSON and pass `skipCache: Boolean(skipCache)` inside the `gateway` options of `env.AI.run()`.
  4. Verify caching:
     - Send the exact same prompt twice with `skipCache: false` (wait ~3 seconds between them so the cache write finishes), and a third time with `skipCache: true`.
     - Check `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` and show the student that the second request has `"cached": true` (and much lower duration / zero model cost), while the `skipCache: true` request went back to the model (`"cached": false`).
  5. Rate limiting:
     - Explain the difference between a `fixed` window (resets on the clock) and a `sliding` window (counts the last N seconds whenever a request arrives), and how request rate limits differ from dollar spend limits (which can be scoped by metadata keys like `team` or `agent_id`).
     - Set a tight sliding rate limit on the gateway to see it enforce a ceiling: `cf ai-gateway gateways update <gateway-id> --collect-logs true --cache-ttl <ttl> --cache-invalidate-on-update true --rate-limiting-interval 60 --rate-limiting-limit 2 --rate-limiting-technique sliding`. Wait ~15-30 seconds for the setting to propagate.
     - Send 3 to 4 distinct prompts (or pass `skipCache: true`) in quick succession until the gateway rejects a request with a rate-limit error (HTTP 429 / rate limit exceeded).
     - Immediately reset the rate limit to `0` (disabled) or a high limit (`--rate-limiting-interval 0 --rate-limiting-limit 0`) and `--cache-ttl 0` so the next exercise's routing tests always reach the models.
  6. Comprehension check: ask the student what the difference is between a request rate limit and a dollar spend limit, and when they'd use `skipCache: true`. Wait for their reply and gently correct anything off.
  7. Mark complete: only after verifying both a cached hit (`"cached": true` in the gateway logs) and a rate-limited request (and restoring the gateway settings), mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "route-and-fall-back".

  Out of scope here: semantic caching (AI Gateway caching is exact-match only) and prepaid Unified Billing credit purchases.
---

# Cache and rate limit

<figure>
<video controls playsinline preload="none" width="1920" height="1080" crossorigin="anonymous" poster="/media/courses/ai-gateway/cache-and-rate-limit-poster.jpg">
<source src="/media/courses/ai-gateway/cache-and-rate-limit.mp4" type="video/mp4">
<track kind="captions" src="/media/courses/ai-gateway/cache-and-rate-limit-captions.vtt" srclang="en" label="English">
<a href="/media/courses/ai-gateway/cache-and-rate-limit.mp4">Watch the demo clip</a>.
</video>
<figcaption>Serving repeat prompts from the AI Gateway cache and capping request volume with rate limits. <a href="/media/courses/ai-gateway/cache-and-rate-limit.mp4">Direct video link</a></figcaption>
</figure>

The cheapest, fastest model call is the one you don't have to make. And any AI endpoint on the internet needs a ceiling so a runaway loop or traffic spike doesn't burn through your quota.

## What you'll build

Exact-match [response caching](https://developers.cloudflare.com/ai-gateway/features/caching/) and per-request `skipCache` support on your gateway, followed by a [request rate limit](https://developers.cloudflare.com/ai-gateway/features/rate-limiting/) that stops a burst of calls with `429 Too Many Requests`.

## Prerequisites

- You've completed [See every request](/courses/ai-gateway/see-every-request) and still have that Worker and gateway.

## Exact-match caching

When caching is enabled on your gateway (or per call with `cacheTtl`), AI Gateway hashes the provider, model, and request body. If an identical request arrives before the TTL expires, the gateway returns the stored response immediately without calling the model provider:

```ts title="src/index.ts"
const result = await env.AI.run(
  "@cf/meta/llama-3.1-8b-instruct-fp8",
  { messages: [{ role: "user", content: prompt }] },
  {
    gateway: {
      id: "dev-school-gateway",
      metadata: { user, team },
      cacheTtl: 300,
      skipCache: Boolean(skipCache),
    },
  },
);
```

Because the default cache key matches on the request body and **not** on `metadata`, two different users sending the exact same prompt will share a cached answer. That's ideal for shared questions like documentation search or FAQs. For personalized prompts, pass `skipCache: true` or set a custom `cacheKey` that includes the user ID.

## Why it matters

- **Zero model cost on repeats:** a cache hit doesn't call the upstream model, so it costs `$0` in model tokens and returns in tens of milliseconds instead of seconds.
- **Per-request escape hatch:** your gateway can cache by default while your code opts out on personalized or time-sensitive calls with `skipCache: true`.
- **Two kinds of ceilings:** request rate limits cap how many requests a minute the gateway accepts (`fixed` or `sliding` window), while [spend limits](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) cap dollars spent and can be scoped to a `team`, `user`, or `agent_id` in metadata.
