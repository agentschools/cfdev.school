---
description: "Move model choice out of your code into a dynamic route that sends routine tasks to a small model and keeps hard ones on a big model with a fallback, then swap a model without redeploying."
agent-instructions: |
  - Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on). For big picture, the models are "big" and "small", and the dynamic route is "a rule in AI Gateway that picks the model".
  - Call the feature a "dynamic route" throughout the exercise. That's the docs' and the `cf` CLI's name for it.
  - If they finished the AI Gateway course, they've built a dynamic route before: shorten "Create the dynamic route" to the difference (it branches on the task for every caller) and spend the time on "Other ways to pick a model".
  - Before "Create the dynamic route", ask which of their tasks are routine enough for the small model (the starter's default: `quick-summary` is routine; `deep-analysis` is not). Use `quick-summary` in the dynamic route's `$in` list so the next exercise's requests still match.
  - Use `@cf/openai/gpt-oss-20b` as the small model and backup, and `@cf/openai/gpt-oss-120b` as the big model. For the no-redeploy swap, use `@cf/ibm-granite/granite-4.0-h-micro`. Check the current Workers AI model catalog before changing these model IDs.
  - In "Call the dynamic route", change only the first argument of the existing `env.AI.run()` call. Every caller uses the dynamic route; model selection belongs in its configuration. The starter already reads AI Gateway logs and renders the receipt.
  - Before "Swap a model with no redeploy", ask the student to predict: will the Worker need a redeploy for Free user to get the new model?
  - In "View the results" and "Swap a model with no redeploy", confirm which model answered in `cf ai-gateway logs list --gateway-id support-copilot --per-page 5 --order-by created_at --order-by-direction desc`, not only on the lab page. Dynamic route deployments take about 30 to 60 seconds to go live; retry before assuming something's wrong. In testing, requests served through a dynamic route showed a cost of `0` in AI Gateway logs for Workers AI models; if the student sees that, say so rather than treating it as free.
  - Check, by depth: hands-on, why is it safer to try a new model across several services by publishing a dynamic route version than by editing each service? Big picture or how it works: someone they work with asks "isn't putting AI Gateway in front of our models just another form of lock-in?" How would they answer, using the providers they named in the interview?
  - Out of scope: percentage splits and A/B tests, and capping the bot. That's the next exercise.
---

# Choose models dynamically

Right now, every request is using the same model regardless of what work is being done or what tier the user is on. Ideally, simple tasks like creating a one-line summary should use a simpler and cheeper model than tasks that run deep analysis.

Instead of adding hard-coded logic in the application code itself, AI Gateway's [routing](https://developers.cloudflare.com/ai-gateway/features/routing/) allows you to define that logic in AI Gateway. This allows you to update which model gets used for which jobs without having to deploy code.

In this exercise, you'll create a [dynamic route](https://developers.cloudflare.com/ai-gateway/features/routing/dynamic-routing/) named `dynamic/support` that reads each request's `task` label. A `quick-summary` tasks will use a smaller model while everything else uses a bigger model. You'll also define a backup model if the bigger one fails.

## Create the dynamic route

A dynamic route is a small flow of steps. You can define and check condition, call a model, and fall back to another one if it fails. You can chave two ways to create the dynamic route.

1. a visual builder in the Cloudflare dashboard
2. the `cf` CLI including JSON representation

Here, you'll use CLI option with a JSON configuration that determines the model to be used based on the `task`. It also
defines a `fallback` for the bigger model if it errors or times out. For reference, follow the [JSON configuration](https://developers.cloudflare.com/ai-gateway/features/routing/dynamic-routing/json-configuration/) doc for full details.

Create `route-v1.json` in your project with the following code:

```json title="route-v1.json"
[
  {
    "id": "start",
    "type": "start",
    "outputs": { "next": { "elementId": "task_check" } }
  },
  {
    "id": "task_check",
    "type": "conditional",
    "properties": {
      "conditions": { "metadata.task": { "$in": ["quick-summary"] } }
    },
    "outputs": {
      "true": { "elementId": "small" },
      "false": { "elementId": "big" }
    }
  },
  {
    "id": "small",
    "type": "model",
    "properties": {
      "provider": "workers-ai",
      "model": "@cf/openai/gpt-oss-20b",
      "timeout": 30000,
      "retries": 0
    },
    "outputs": {
      "success": { "elementId": "end" },
      "fallback": { "elementId": "end" }
    }
  },
  {
    "id": "big",
    "type": "model",
    "properties": {
      "provider": "workers-ai",
      "model": "@cf/openai/gpt-oss-120b",
      "timeout": 60000,
      "retries": 0
    },
    "outputs": {
      "success": { "elementId": "end" },
      "fallback": { "elementId": "backup" }
    }
  },
  {
    "id": "backup",
    "type": "model",
    "properties": {
      "provider": "workers-ai",
      "model": "@cf/openai/gpt-oss-20b",
      "timeout": 60000,
      "retries": 0
    },
    "outputs": {
      "success": { "elementId": "end" },
      "fallback": { "elementId": "end" }
    }
  },
  { "id": "end", "type": "end", "outputs": {} }
]
```

Then, create the dynamic route using this JSON file:

```sh
cf ai-gateway dynamic-routing create support-copilot --name support --elements @route-v1.json
```

Note the dynamic route's `id` in the output. Make note of this. You'll need it to publish the next version.

## Call the dynamic route

Now, you'll need to update the `env.AI.run()` call to use `"dynamic/support"` instead of a hard-coded model:

```diff title="src/index.ts"
 await env.AI.run(
-  MODEL,
+  "dynamic/support",
```

Every caller will now use the dynamic route. The Worker supplies the metadata, and the dynamic route chooses the model: `quick-summary` goes to the small model, while `deep-analysis` and the bot's `ticket-review` go to the big model.

## View the results

With `npm run dev` running, reload the lab page and try all three callers. The **Free user** button sends `quick-summary` to GPT-OSS 20B, while **Pro user** sends `deep-analysis` and **Background bot** sends `ticket-review` to GPT-OSS 120B. If the big model fails, its backup answers instead. Compare the model in the receipt with the matching entry in AI Gateway logs.

## Swap a model with no redeploy

Each change to a dynamic route is a new version, and you choose which version is live. Copy `route-v1.json` to `route-v2.json` and change the `small` step's model to `@cf/ibm-granite/granite-4.0-h-micro`. Then create the version and deploy it:

```sh
cf ai-gateway dynamic-routing versions create <route-id> --gateway-id support-copilot --elements @route-v2.json
cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id support-copilot --version-id <version-id>
```

The first command prints the new version's `version_id`. A deployment takes about 30 to 60 seconds to go live. Then click **Free user** again. The AI Gateway log shows Granite 4.0 micro, and you haven't changed your Worker. To undo it, deploy version 1 again the same way.

## Other ways to pick a model

A dynamic route is for when you want to decide the rules yourself. AI Gateway's [routing](https://developers.cloudflare.com/ai-gateway/features/routing/) has two other ways to keep model names out of your code:

**[Auto Router](https://developers.cloudflare.com/ai-gateway/features/routing/auto-router/)**

Use `cloudflare/auto` as the model, and AI Gateway picks a model for each request based on task difficulty and model cost. Choose this when you want lower cost without writing routing rules, and you're comfortable with Cloudflare managing the list of models it selects from.

**[Model aliases](https://developers.cloudflare.com/ai-gateway/features/routing/model-aliases/)**

Give one or more models a stable name, like `custom/support-fast`, and change the models behind it later. Choose this when you want to swap models without changing application code and don't need conditions.

**Dynamic routes**

Define versioned conditions, percentage splits, limits, and fallbacks. Choose this when different callers or tasks need different models, as in this exercise.

If your dynamic routes call models outside Workers AI, from OpenAI, Anthropic, or Google, you pay those providers through [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) (one Cloudflare bill) or with [your own keys](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/), and the dynamic route works the same way.

Every caller now uses AI Gateway's model-selection rules. However, the bot can still call the big model as often as it likes. In the last exercise, [Cap AI usage](/courses/see-and-control-ai-spend/cap-ai-usage), you'll limit the bot's big-model requests in the dynamic route.
