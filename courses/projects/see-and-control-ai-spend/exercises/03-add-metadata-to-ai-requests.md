---
description: "Label every request with who's behind it, run a mix of traffic, and find the two places your AI spend is leaking."
agent-instructions: |
  - Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on).
  - If they finished the AI Gateway course, they've attached metadata before: shorten "Label every request" to the diff and spend the time on the investigation.
  - Before "Label every request", show the starter's metadata values (`caller`: `free` / `pro` / `bot`; `tier`: `free` / `pro` / `background`; `task`: `quick-summary` / `deep-analysis` / `ticket-review`). Ask whether they want to change button labels or prompts. Keep these IDs and metadata values unchanged so the dynamic route in the next exercise matches.
  - In "Label every request", distinguish validating a demo caller ID from authenticating a user. For a real app, explain how to derive identity from an authenticated session or trusted job configuration and look up tier server-side.
  - In "View the results", let the student investigate the two leaks. Ask them to click the buttons themselves (a couple of Free user requests, one Pro user request, and Background bot), then guess the two leaks from the lab page before you show them anything. Wait for their guess. Only then pull the last few entries with `cf ai-gateway logs list --gateway-id support-copilot --per-page 10 --order-by created_at --order-by-direction desc` and compare. If they can't open a browser, send the traffic yourself and still ask for the guess first.
  - Don't compute prices yourself. If they want numbers, point them at the cost column in AI Gateway logs, which is AI Gateway's own estimate. For big picture, the two leaks are the story ("one bot nobody watches" and "free users on the expensive model"), not the cents.
  - In "View the results", confirm in AI Gateway logs that each request has the exact `caller`, `tier`, and `task` values shown in the receipt.
  - Check, by depth: hands-on, why must the labels be attached in the Worker rather than taken from the browser? Big picture or how it works: when a company ships AI to its own customers, every request is part of the cost of serving them. How would they use labels by customer, tier, and feature to explain "one big AI bill" to someone they work with, like a finance team, a product manager, or a customer?
  - Out of scope: dynamic routes and spend limits. Those are the next two exercises.
---

# Add metadata to AI requests

AI Gateway now sees every request, but it can't see the details of who made the request. There are user specific details that would be useful here: who made the requet, which tier their on, etc.

AI Gateway can accept custom metadata in each request. In this exercise, you'll update the code to attach custom metadata for:

- who the user is (`caller`)
- which tier their on (`tier`)
- what task their performing (`task`)

## Label every request

AI Gateway calls these labels [custom metadata](https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/): up to five key-value pairs per request, saved with its log entry. You can filter logs by them, break down spend by them, and, later in this course, route and cap traffic by them.

The starter defines each caller's `tier` and `task` in `src/demo-data.ts`. The browser sends a demo caller ID, and the Worker checks that it matches a known caller before looking up its metadata.

That validation does not authenticate a user. In a real application, derive caller identity from an authenticated session or trusted job configuration, then look up the tier server-side. Don't let a browser-supplied label decide which user's usage to record or which model they can access.

In `run()`, just above the `env.AI.run()` call, build metadata from the Worker's own caller table:

```ts title="src/index.ts"
const metadata = {
  caller,
  tier: CALLERS[caller].tier,
  task: CALLERS[caller].task,
};
```

Then, add `metadata` to the existing `gateway` options, using the object you just created:

```ts title="src/index.ts"
await env.AI.run(
  MODEL,
  {
    messages: [{ role: "user", content: CALLERS[caller].prompt }],
    max_tokens: 256,
  },
  {
    gateway: {
      id: env.GATEWAY_ID,
      collectLog: true,
      metadata,
      skipCache: true,
    },
  },
);
```

## View the results

Open the lab page and reload. Send a mix of requests, and you'll see the chart now has a bar for each caller including the metadata: `caller`, `tier`, and `task`.

Right now, the same model is being used for each AI call regardless of what tier the user is on or what type of task they are trying to solve. In the next exercise, [Choose models dynamically](/courses/see-and-control-ai-spend/choose-models-dynamically), you'll see how to optimize your model usage by using different models for different requests based on the metadata.
