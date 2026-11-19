---
description: "Attach user-type metadata so AI Gateway can distinguish Free users, Pro users, and the Background bot."
agent-instructions: |
  - Depth: big picture, use the chart to identify who generates requests; how it works, explain trusted labels; hands-on, distinguish input validation from authentication.
  - In "View the results", before interpreting the chart, ask: "Which user type generated the most requests in Requests by metadata?" If the student can't use the browser, send the traffic and show the results yourself.
  - Offer a clickable Logs link at `https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/support-copilot/logs`, using setup's account ID. Include the body's menu path if you can't confirm it in the browser. Dashboard inspection is optional.
---

# Add metadata to AI requests

AI Gateway now sees every request, but it doesn't know whether it came from a Free user, Pro user, or Background bot.

In this exercise, you'll attach [custom metadata](https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/) containing one property, `user_type`, with a value of `free`, `pro`, or `bot`.

## Label every request

AI Gateway allows for up to five key-value pairs in metadata per request. In the dashboard, you can use this metadata to filter logs and break down spend. Later in this course, you'll use the metadata to have different user types use different models.

The browser sends the selected `user_type`, and the Worker checks that it matches a key in `USER_TYPES` from `src/demo-data.ts` before attaching it as metadata. This validates a demo choice; it doesn't authenticate a user. In a real application, derive metadata from trusted account or job information rather than accepting a user type claimed by the browser.

In `src/index.ts`, replace the existing `const metadata = {};` immediately after `const { userType } = input;` with:

```ts title="src/index.ts"
const metadata = {
  user_type: userType,
};
```

Then, add `metadata` to the existing `gateway` options, using the object you just created:

```ts title="src/index.ts"
const result = await env.AI.run(
  MODEL,
  {
    messages: [{ role: "user", content: USER_TYPES[userType].prompt }],
    max_tokens: 8,
  },
  {
    returnRawResponse: true,
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

Reload the application to start a fresh chart. Click **Free user** twice, **Pro user** once, and **Background bot** once. The bot button sends 4 requests. In **Usage receipt**, **User type** identifies the button and **Request metadata** now shows `user_type=free`, `user_type=pro`, or `user_type=bot` instead of `anonymous`.

Compare the counts in **Requests by metadata** and the models in the **Model** column. The chart covers only requests made during this page session, not all traffic through the gateway.

The receipt's **Request metadata** column shows what the application sends. Use the logs command from [Add AI Gateway](/courses/see-and-control-ai-spend/add-ai-gateway#view-the-results) to confirm the matching requests have the same `user_type` values. For an optional dashboard view, open **AI** > **AI Gateway** > `support-copilot` > **Logs** in the same account. Use its cost column for AI Gateway's estimate rather than calculating prices from the chart.

Right now, the same model is used for every user type. In the next exercise, [Choose models dynamically](/courses/see-and-control-ai-spend/choose-models-dynamically), you'll route requests to different models based on `user_type`.
