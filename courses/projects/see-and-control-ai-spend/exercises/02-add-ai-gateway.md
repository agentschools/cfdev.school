---
description: "Run the three-caller starter without Gateway, then put AI Gateway in front of it and see the requests it records."
agent-instructions: |
  - Pitch everything to the depth the student chose in this course's interview (big picture, how it works, or hands-on); the interview's instructions say what each level gets. For big picture, tokens are "usage" and each code change gets a one-sentence summary.
  - Start from the repository linked in `COURSE.md`, on its `main` branch. Do not scaffold a Worker or rebuild the lab page. Keep the starter's caller IDs (`free`, `pro`, `bot`), the `/api/run` endpoint, and its UI.
  - If they finished the AI Gateway course, shorten Gateway setup and the binding change to a quick review. Still run the starter baseline and compare its requests with Gateway logs.
  - Keep the Gateway ID `support-copilot` and Worker name `ai-spend-control-course`. The Dynamic Route created later is named `support`; keep these values fixed so code, commands, and repository match.
  - Before the baseline run, ask the student to predict whether Gateway will have a log for each button. Before connecting the Worker to Gateway, ask what will change in the logs and what will still be missing.
  - Check the baseline and the updated Worker locally with `npm run dev`. The AI binding uses remote Workers AI, so the account must have Workers AI enabled. No deploy is needed for this exercise.
  - Check, by depth: hands-on, why can't a provider invoice or shared API key distinguish new paying users from a background retry loop? Big picture or how it works: someone they work with asks, "we already see the total on the provider invoice, why put a gateway in front?" Help them answer using the providers they named.
  - Out of scope: metadata, routes, and spend limits. Those are the next three exercises.
---

# Add AI gateway

In the starter code, each AI call makes calls to Workers AI directly without using AI Gateway. Unfortunately, this means you have no visibility into who is making requests, how much they cost, which model they're using, etc.

In this lesson, you'll create the AI Gateway and configure the application to use it.

## Create a gateway

First, you'll need to create the gateway using the `cf` cli. You'll want logging to be turned on but caching turned off. This ensures every click creates a new log entry that becomes visible in the app.

Create a gateway named `support-copilot` with the following command:

```sh
cf ai-gateway gateways create --id support-copilot --authentication true \
  --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true \
  --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding
```

In the Cloudflare dashboard, you can view the logs by opening **AI** > **AI Gateway** > `support-copilot` > **Logs**. The logs will be empty to start since the starter isn't configured to use the gateway yet.

## Configure the gateway

When adding the configuration for your gateway in code, you'll need to reference it by the name you just created, `support-copilot`. Instead of hard-coding that string in the application, it's better to set it as public text variable. Do this with a text binding by adding the following line in `cloudflare.config.ts`.

```ts title="cloudflare.config.ts"
GATEWAY_ID: bindings.text("support-copilot"),
```

This allows you to reference the value `support-copilot` in your Worker as `env.GATEWAY_ID`.

As mentioned above, this project is already configured to make AI calls to Workers AI. This is configured based on the `AI` binding in `cloudflare.config.ts`.

```ts
env: {
  AI: bindings.ai({ dev: { remote: true } }),
},
```

With the binding in place, the application makes calls with `env.AI.run()`. To ensure that each of these calls runs through the new AI Gateway that you just created, you'll need to pass the gateway configuration as a prop.

Update the existing `env.AI.run()` call to add the `gateway` config property:

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
      skipCache: true,
    },
  },
);
```

## View the results

Open the running app, and click to send a message from each of the three options. The log should show `anonymous` for each successful request, instead of the previous message saying that AI Gateway wasn't configured. Additionally, Gateway Logs now has a row for each click which you can see in the dashboard.

Although you have AI Gateway configured, it's still limited on what visibility you get. Out of the box, you get visibility into the individual logs including:

- what model was used
- how much time it took
- number of tokens
- how much it costed

What you don't have visbility into is what user or persona made the request. To get visibility here, you'll need to add some metadata to each request. In the next exercise, [Attribute every caller](/courses/see-and-control-ai-spend/attribute-every-caller), you'll attach metadata so Gateway can distinguish the callers.
