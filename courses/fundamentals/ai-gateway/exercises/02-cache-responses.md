---
description: "Turn on exact-match response caching so repeat questions return in milliseconds for $0, and opt out per request with skipCache."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the gateway and interactive lab Worker from "see-every-request"; check GET /api/progress/{studentId} first. Do not rely on the video clip to teach; you can mention `<origin>/courses/ai-gateway/cache-responses` as an optional reference, and teach everything directly in chat.

  1. Teach the concept and ask the student to predict (before enabling cache):
     - Explain how AI Gateway caching works: when exact-match caching is enabled, the gateway hashes the provider, endpoint, model, provider auth header, and full request body (`messages` and any parameters), so only an exact repeat matches. On a **cache miss**, it calls the model and stores the response for your TTL; on a **cache hit**, it returns the stored response directly from Cloudflare's edge in tens of milliseconds for `$0` in model tokens.
     - Point out a critical design detail: the default cache key covers the request itself, **not** `metadata`.
     - Ask the student to predict: if `riley` (on `interns`) and `sam` (on `escalations`) send the exact same question while caching is on, what happens on Sam's request—and when would that be helpful vs. dangerous? Also ask what cache TTL (in seconds, at least 60, e.g. `300` for 5 minutes) they'd like to turn on. Wait for their reply.

  2. Enable caching and let the student see a live cache hit:
     - Confirm their prediction: Sam gets Riley's cached answer immediately, which is great for shared FAQs or classification prompts, and dangerous if the prompt or response contains user-specific data (where you should pass `skipCache: true` or a custom `cacheKey` that includes the user ID).
     - `cf ai-gateway gateways update` replaces the gateway's whole configuration (the API is a `PUT`), so any setting left out of the command is reset. Before the first update in this exercise, run `cf ai-gateway gateways get <gateway-id>` and, if it shows settings the commands below don't include (for example `authentication`, `workers_ai_billing_mode`, `dlp`, or `logpush`), add them to the update with `--body` so you don't turn them off.
     - Enable caching on the gateway with their chosen TTL:
       `cf ai-gateway gateways update <gateway-id> --collect-logs true --cache-ttl <ttl> --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding`
     - Make sure their Worker passes `skipCache: Boolean(skipCache)` inside the `gateway` options of `env.AI.run()` (already wired up if they used the interactive lab Worker from Exercise 1).
     - Send the exact same prompt twice with `skipCache: false` (waiting ~3 seconds between them so the cache write finishes), and a third time with `skipCache: true`.
     - **Important: leave caching ON** so the student can experience it themselves. Invite the student to:
       1. Click **Ask through the gateway** twice with the same prompt on their lab page (and then once with **Bypass cache** checked) to feel the speed difference.
       2. Check their gateway Logs dashboard (`https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>/logs`) and look for the cached indicator on the repeat request—comparing its duration and `$0` cost to the uncached requests.
     - In the same message, ask the comprehension check: when should an app pass `skipCache: true` vs. a custom per-user `cacheKey`? Wait for their reply.

  3. Mark complete:
     - Confirm via `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 5 --order-by created_at --order-by-direction desc` that the logs show both `"cached": true` and `"cached": false` (on the `skipCache: true` call).
     - Reset `--cache-ttl 0` on the gateway now that the student has tried it (`cf ai-gateway gateways update <gateway-id> --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding`) and tell the student you turned caching back off so later exercises always hit the live models.
     - Gently correct anything off in their answer, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "cap-requests-and-spend".

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

Exact-match [response caching](https://developers.cloudflare.com/ai-gateway/features/caching/) on your gateway and a `skipCache` option on your Worker's `/ask` route. You'll send the same prompt twice to see a cache hit in the gateway logs and dashboard, then bypass the cache for a fresh answer.

## Prerequisites

- You've completed [See every request](/courses/ai-gateway/see-every-request) and still have that Worker and gateway.

## Exact-match caching and `skipCache`

When caching is enabled on your gateway (or per call with `cacheTtl`), AI Gateway [hashes](https://developers.cloudflare.com/ai-gateway/features/caching/#how-the-cache-key-works) the provider, endpoint, model, provider auth header, and full request body. If an identical request arrives before the TTL expires, the gateway returns the stored response without calling the provider:

```ts title="src/index.ts"
const result = await env.AI.run(
  "@cf/google/gemma-4-26b-a4b-it", // any affordable Workers AI chat model
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
