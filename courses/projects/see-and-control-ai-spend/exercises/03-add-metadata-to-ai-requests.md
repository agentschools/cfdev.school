---
description: "Label every request to AI Gateway with custom metadata fields that includes the user type that generated the request."
agent-instructions: |
  - Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on).
  - If they finished the AI Gateway course, they've attached metadata before: shorten "Label every request" to the diff and spend the time on the investigation.
  - Before "Label every request", show the starter's metadata values (`user_type`: `free` / `pro` / `bot`). Ask whether they want to change button labels or prompts. Keep these IDs and metadata values unchanged so the dynamic route in the next exercise matches.
  - In "Label every request", distinguish validating a demo user type from authenticating a user. For a real app, explain how to derive the user type from trusted account or job information.
  - In "View the results", let the student investigate the two leaks. Ask them to click the buttons themselves (a couple of Free user requests, one Pro user request, and Background bot), then guess the two leaks from the lab page before you show them anything. Wait for their guess. Only then pull the last few entries with `cf ai-gateway logs list --gateway-id support-copilot --per-page 10 --order-by created_at --order-by-direction desc` and compare. If they can't open a browser, send the traffic yourself and still ask for the guess first.
  - Don't compute prices yourself. If they want numbers, point them at the cost column in AI Gateway logs, which is AI Gateway's own estimate. For big picture, the two leaks are the story ("one bot nobody watches" and "free users on the higher-cost model"), not the cents.
  - In "View the results", confirm in AI Gateway logs that each request has the expected `user_type` value shown in the receipt.
  - Check, by depth: hands-on, why must the labels be attached in the Worker rather than taken from the browser? Big picture or how it works: when a company ships AI to its own customers, every request is part of the cost of serving them. How would they use labels by customer, tier, and feature to explain "one big AI bill" to someone they work with, like a finance team, a product manager, or a customer?
  - Out of scope: dynamic routes and spend limits. Those are the next two exercises.
---

# Add metadata to AI requests

AI Gateway now sees every request, but it doesn't know whether it came from a Free user, Pro user, or Background bot.

In this exercise, you'll attach [custom metadata](https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/) containing one property, `user_type`, with a value of `free`, `pro`, or `bot`.

## Label every request

AI Gateway allows for up to five key-value pairs in metadata per request. In the dashboard, you can use this metadata to filter logs and break down spend. Later in this course, you'll use the metadata to have different persons use different models.

The browser sends the selected `user_type`, and the Worker checks that it matches a key in `USER_TYPES` from `src/demo-data.ts` before attaching it as metadata. In a real application, metadata should be derived form trusted user information and not based on request data sent from the browser.

In `src/index.ts`, immediately after `const { userType } = input;`, build metadata from the validated user type:

```ts title="src/index.ts"
const metadata = {
  user_type: userType,
};
```

Then, add `metadata` to the existing `gateway` options, using the object you just created:

```ts title="src/index.ts"
await env.AI.run(
  MODEL,
  {
    messages: [{ role: "user", content: USER_TYPES[userType].prompt }],
    max_tokens: 8,
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

Open the running application and reload the page. Send a mix of requests. The logs should now show `user_type=free`, `user_type=pro`, and `user_type=bot`.

Right now, the same model is used for every user type. In the next exercise, [Choose models dynamically](/courses/see-and-control-ai-spend/choose-models-dynamically), you'll route requests to different models based on `user_type`.
