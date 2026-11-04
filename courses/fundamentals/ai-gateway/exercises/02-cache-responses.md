---
description: "Turn on exact-match response caching so repeat questions return in milliseconds for $0, and opt out per request with skipCache."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the gateway and Worker from "see-every-request"; check GET /api/progress/{studentId} first. Keep it fast: use `cf dev` (whose remote AI binding already hits the live gateway on their account) or their deployed Worker so you don't wait on unnecessary deploys.

  1. Video clip (check question 4 of the `ai-gateway` interview):
     - If they chose "show me the clips as we go": share `<origin>/media/courses/ai-gateway/cache-responses.mp4`. Open `<origin>/courses/ai-gateway/cache-responses` in your browser panel if you have one, or render `[![Watch the demo clip](<origin>/media/courses/ai-gateway/cache-responses-poster.jpg)](<origin>/media/courses/ai-gateway/cache-responses.mp4)` and offer to open it in their browser. Tell them what to watch for: turning on caching in the gateway, seeing `MISS` then `HIT` with latency dropping from 1,742 ms to 45 ms and `$0` model cost, and skipping cache per request.
     - If they chose "just link them": drop a one-line link to `<origin>/media/courses/ai-gateway/cache-responses.mp4`.
     - If they chose "skip videos": don't mention or link the video.
  2. Predict before enabling cache: tell the student that AI Gateway's default cache key hashes the request body and model, *not* `metadata`. Ask them: if `riley` (on `interns`) and `sam` (on `escalations`) send the exact same prompt while caching is on, what will happen on Sam's request, and when would that be a problem? Wait for their answer. Confirm: Sam gets Riley's cached answer immediately, which is great for shared FAQs and bad for personalized prompts unless you pass `skipCache: true` or a custom `cacheKey`.
  3. Enable caching and `skipCache`:
     - Ask the student what cache TTL (in seconds, at least 60, e.g. `300` for 5 minutes) they want on their gateway. Wait briefly if they haven't already said.
     - Update the gateway with `cf ai-gateway gateways update <gateway-id> --collect-logs true --cache-ttl <ttl> --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding`.
     - In `src/index.ts`, allow `{ prompt, user, team, skipCache }` in the request JSON and pass `skipCache: Boolean(skipCache)` inside the `gateway` options of `env.AI.run()`.
  4. Verify before completing. YOU must:
     - send the exact same prompt twice with `skipCache: false` (wait ~3 seconds between them so the cache write finishes), and a third time with `skipCache: true`;
     - run `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` and show the student that the second request has `"cached": true` (with much lower duration and zero model cost), while the `skipCache: true` request went back to the model (`"cached": false`);
     - reset `--cache-ttl 0` on the gateway afterward (`cf ai-gateway gateways update <gateway-id> --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding`) so later exercises always reach the live models.
     Don't trust the student saying it worked.
  5. Comprehension check: ask the student when they should pass `skipCache: true` or a custom `cacheKey` instead of relying on the default cache key. Wait for their reply and gently correct anything off.
  6. Mark complete: only after verifying both a cached hit (`"cached": true` in the gateway logs) and a `skipCache: true` miss, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "cap-requests-and-spend".

  Out of scope here: semantic caching (AI Gateway caching is exact-match only), rate limiting, and spend limits (rate limits and spend limits are the next exercise).
---

# Cache responses

<figure>
<video controls playsinline preload="none" width="1920" height="1080" crossorigin="anonymous" poster="/media/courses/ai-gateway/cache-responses-poster.jpg">
<source src="/media/courses/ai-gateway/cache-responses.mp4" type="video/mp4">
<track kind="captions" src="/media/courses/ai-gateway/cache-responses-captions.vtt" srclang="en" label="English">
<a href="/media/courses/ai-gateway/cache-responses.mp4">Watch the demo clip</a>.
</video>
<figcaption>Serving repeat prompts from the AI Gateway cache in tens of milliseconds for $0. <a href="/media/courses/ai-gateway/cache-responses.mp4">Direct video link</a></figcaption>
</figure>

The cheapest, fastest model call is the one you don't have to make. Support bots, documentation search, and classification endpoints often see the exact same question many times. A gateway cache hit skips the model call completely — returning in tens of milliseconds instead of seconds and costing `$0` in model tokens — while still letting your code opt out on individual requests.

## What you'll build

Exact-match [response caching](https://developers.cloudflare.com/ai-gateway/features/caching/) on your gateway and a `skipCache` option on your Worker's `/ask` route. You'll send the same prompt twice to see a cache hit in the gateway logs, then bypass the cache for a fresh answer.

## Prerequisites

- You've completed [See every request](/courses/ai-gateway/see-every-request) and still have that Worker and gateway.

## Exact-match caching and `skipCache`

When caching is enabled on your gateway (or per call with `cacheTtl`), AI Gateway hashes the provider, model, and request body. If an identical request arrives before the TTL expires, the gateway returns the stored response without calling the provider:

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

Because the default cache key matches on the request body and **not** on `metadata`, two different users sending the exact same prompt will share a cached answer. That's what you want for shared FAQs or classification prompts. For personalized prompts, pass `skipCache: true` or set a custom `cacheKey` that includes the user ID.
