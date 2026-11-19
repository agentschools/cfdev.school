---
description: "Create an AI Gateway, then configure the application to route all AI requests through it and see the results in the application logs."
agent-instructions: |
  - Pitch everything to the depth the student chose in this course's interview (big picture, how it works, or hands-on); the interview's instructions say what each level gets. For big picture, tokens are "usage" and each code change gets a one-sentence summary.
  - Start from the repository linked in `COURSE.md`, on its `main` branch. Do not scaffold a Worker or rebuild the lab page. Keep the starter's caller IDs (`free`, `pro`, `bot`), the `/api/run` endpoint, and its UI.
  - If they finished the AI Gateway course, shorten AI Gateway setup and the binding change to a quick review. Still run the starter baseline and compare its requests with AI Gateway logs.
  - Keep the AI Gateway ID `support-copilot` and Worker name `ai-spend-control-course`. The dynamic route created later is named `support`; keep these values fixed so code, commands, and repository match.
  - Before the baseline run, ask the student to predict whether AI Gateway will have a log for each button. Before connecting the Worker to AI Gateway, ask what will change in the logs and what will still be missing.
  - Check the baseline and the updated Worker locally with `npm run dev`. The AI binding uses remote Workers AI, so the account must have Workers AI enabled. No deploy is needed for this exercise.
  - Check, by depth: hands-on, why can't a provider invoice or shared API key distinguish new paying users from a background retry loop? Big picture or how it works: someone they work with asks, "we already see the total on the provider invoice, why put AI Gateway in front?" Help them answer using the providers they named.
  - Out of scope: metadata, dynamic routes, and spend limits. Those are the next three exercises.
---

# Add AI Gateway

The starter sends requests directly to Workers AI with a hard coded model string. Workers AI provides usage reporting, but these requests don't appear in AI Gateway logs.

In this exercise, you'll create AI Gateway and connect the application to it. You'll inspect individual requests in AI Gateway logs, including the model, token usage, duration, and estimated cost.

## Create an AI Gateway

First, you'll need to create an gateway using the `cf` cli. You'll want logging to be turned on but caching turned off. This ensures every click creates a new log entry that becomes visible in the app.

Create a gateway named `support-copilot` with the following command:

```sh
cf ai-gateway gateways create --id support-copilot --authentication true \
  --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true \
  --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding
```

In the Cloudflare dashboard, you can view AI Gateway logs by opening **AI** > **AI Gateway** > `support-copilot` > **Logs**. The logs will be empty to start since the starter isn't configured to use AI Gateway yet.

## Configure AI Gateway

When adding the configuration for AI Gateway in code, you'll need to reference it by the name you just created, `support-copilot`. Instead of hard-coding that string in the application, it's better to set it as public text variable. Do this with a text binding by adding the following line in `cloudflare.config.ts`.

```ts title="cloudflare.config.ts"
 env: {
  GATEWAY_ID: bindings.text("support-copilot"),
  //...
},
```

This allows you to reference the value `support-copilot` in your Worker as `env.GATEWAY_ID`.

As mentioned above, this project is already configured to make AI calls to Workers AI. This is configured based on the `AI` binding in `cloudflare.config.ts`.

```ts
env: {
  AI: bindings.ai({ dev: { remote: true } }),
},
```

With the binding in place, the application makes calls with `env.AI.run()`. To ensure that each of these calls runs through the new AI Gateway that you just created, you'll need to pass the AI Gateway configuration as a prop.

In `src/index.ts`, inside the `fetch` handler, update the existing `env.AI.run()` call to add the `gateway` config property:

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
      skipCache: true,
    },
  },
);
```

## View the results

Open the running app, and click **Free user**, **Pro user**, and **Background bot** to send requests. You should now see that each request shows as `anonymous`.

If you inspect the AI Gateway logs in the Cloudflare dashboard, you should see a log for each request that includes:

- the model used
- the request duration
- token usage
- the estimated cost

AI Gateway now records the requests, but you still haven't attached specific labels identifying the callers. The application therefore displays `anonymous` for each successful request. In the next exercise, [Add metadata to AI requests](/courses/see-and-control-ai-spend/add-metadata-to-ai-requests), you'll label requests so you can distinguish between `Free user`, `Pro user`, and `Background bot`.
