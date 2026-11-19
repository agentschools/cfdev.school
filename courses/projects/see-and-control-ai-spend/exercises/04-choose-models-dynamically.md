---
description: "Create a dynamic route in AI Gateway to dynamically route specific traffic to different models based on the incoming metadata."
agent-instructions: |
  - Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on). For big picture, the models are "higher-cost" and "lower-cost", and the dynamic route is "a rule in AI Gateway that picks the model".
  - Call the feature a "dynamic route" throughout the exercise. That's the docs' and the `cf` CLI's name for it.
  - If they finished the AI Gateway course, they've built a dynamic route before: shorten "Create the dynamic route" to the difference (it branches on `user_type`) and spend the time on "Other ways to pick a model".
  - Before "Create the dynamic route", explain the demo's routing policy: `free` uses the lower-cost model; `pro` and `bot` use the higher-cost model. Keep these values unchanged so the next exercise's requests still match.
  - Use `@cf/openai/gpt-oss-20b` as the lower-cost model and backup, and `@cf/openai/gpt-oss-120b` as the higher-cost model. For the no-redeploy swap, use `@cf/ibm-granite/granite-4.0-h-micro`. Check the current Workers AI model catalog before changing these model IDs.
  - In "Call the dynamic route", change only the `MODEL` constant in `src/index.ts` to `"dynamic/support"`. Every caller uses the dynamic route; model selection belongs in its configuration. The starter already builds receipts from the inference response.
  - Before "Swap a model with no redeploy", ask the student to predict: will the Worker need a redeploy for Free user to get the new model?
  - In "View the results" and "Swap a model with no redeploy", confirm which model answered on the lab page. Dynamic route deployments take about 30 to 60 seconds to go live; retry before assuming something's wrong.
  - Check, by depth: hands-on, why is it safer to try a new model across several services by publishing a dynamic route version than by editing each service? Big picture or how it works: someone they work with asks "isn't putting AI Gateway in front of our models just another form of lock-in?" How would they answer, using the providers they named in the interview?
  - Out of scope: percentage splits and A/B tests, and capping the bot. That's the next exercise.
---

# Choose models dynamically

Right now, every request uses the same model regardless of the user type. In this case, you'll want your application to become more cost effective by changing the model based on the user type.

Instead of adding hard-coded logic in the application code itself, AI Gateway's [routing](https://developers.cloudflare.com/ai-gateway/features/routing/) allows you to define that logic in AI Gateway. This allows you to update which model gets used for which user persona without having to deploy code.

In this exercise, you'll create a [dynamic route](https://developers.cloudflare.com/ai-gateway/features/routing/dynamic-routing/) named `dynamic/support` that reads `user_type` property from the metadata. Based on the `user_type` ,free users will use a lower-cost model, while Pro users and the Background bot will use a higher-cost model. In case the higher-cost model fails, you'll also define a backup model to be used.

## Create the dynamic route

A dynamic route is a small flow of steps that you can use to dynamically assign a specific model to an incoming request. You can define and check conditions, call a model, and fall back to another one if it fails. You have two ways to create the dynamic route.

1. the visual builder in the Cloudflare dashboard
2. the `cf` CLI by passing a JSON representation

Here, you'll use CLI option with a JSON configuration that determines the model to be used based on `user_type`. It also
defines a `fallback` for the higher-cost model if it errors or times out. For reference, follow the [JSON configuration](https://developers.cloudflare.com/ai-gateway/features/routing/dynamic-routing/json-configuration/) doc for full details.

The JSON configuration you'll use here will route requests to different models based on the `user_type` property in the metadata. Specifically, a `user_type` of `free` will route to a lower-cost model, while `pro` and `bot` will route to a higher-cost model.

- lower-cost model - `@cf/openai/gpt-oss-20b`
- higher-cost model - `@cf/openai/gpt-oss-120b`

Create `route.json` in your project with the following code:

```json title="route.json"
[
  {
    "id": "start",
    "type": "start",
    "outputs": { "next": { "elementId": "is_free" } }
  },
  {
    "id": "is_free",
    "type": "conditional",
    "properties": {
      "conditions": { "metadata.user_type": { "$eq": "free" } }
    },
    "outputs": {
      "true": { "elementId": "lower_cost" },
      "false": { "elementId": "higher_cost" }
    }
  },
  {
    "id": "lower_cost",
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
    "id": "higher_cost",
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
cf ai-gateway dynamic-routing create support-copilot --name support --elements @route.json
```

Note the dynamic route's `id` in the output. Make note of this. You'll need it to publish the next version.

## Call the dynamic route

In `src/index.ts`, change the `MODEL` constant near the top of the file to `"dynamic/support"`. The `support` part matches the route name passed to the CLI command above.

```ts title="src/index.ts"
const MODEL = "dynamic/support";
```

The AI request and lab configuration both use `MODEL`.

Every user type now uses the dynamic route. The Worker supplies the metadata, and the dynamic route chooses the model: `free` goes to the lower-cost model, while `pro` and `bot` go to the higher-cost model.

## View the results

With `npm run dev` running, reload the lab page and try all three buttons. Free user requests should use `GPT-OSS 20B`. Pro user and Background bot requests should use `GPT-OSS 120B`. If the higher-cost model fails, its backup answers instead.

## Swap a model without deploying the worker

Each change to a dynamic route is a new version, and you have to decide when to deploy it. Here, you'll update the lower cost model and redeploy your dynamic route.

Change the `lower_cost` step's model to `@cf/ibm-granite/granite-4.0-h-micro`. Then, get the create the new version of the Dynamic Route and take note of the `version-id` that is returned.

```sh
cf ai-gateway dynamic-routing versions create <route-id> --gateway-id support-copilot --elements @route.json
```

Then, deploy the version by passing the `version-id`.

```sh
cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id support-copilot --version-id <version-id>
```

Allow about 30 to 60 seconds for the route version to take effect, then click **Free user** again. The application should show the updated model, `@cf/ibm-granite/granite-4.0-h-micro`. If the previous model still answers, confirm that you deployed the intended version and try again after propagation.

## Other ways to pick a model

A dynamic route is useful when you want to decide the rules yourself. AI Gateway's [routing](https://developers.cloudflare.com/ai-gateway/features/routing/) has two other ways to keep model names out of your code:

**[Auto Router](https://developers.cloudflare.com/ai-gateway/features/routing/auto-router/)**

Use `cloudflare/auto` as the model, and AI Gateway picks a model for each request based on task difficulty and model cost. Choose this when you want lower cost without writing routing rules, and you're comfortable with Cloudflare managing the list of models it selects from.

**[Model aliases](https://developers.cloudflare.com/ai-gateway/features/routing/model-aliases/)**

Give one or more models a stable name, like `custom/support-fast`, and change the models behind it later. Choose this when you want to swap models without changing application code and don't need conditions.

**Dynamic routes**

Define versioned conditions, percentage splits, limits, and fallbacks. Choose this when different user types need different models, as in this exercise.

If your dynamic routes call models outside Workers AI, from OpenAI, Anthropic, or Google, you pay those providers through [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) (one Cloudflare bill) or with [your own keys](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/), and the dynamic route works the same way.

Every caller now uses AI Gateway's model-selection rules. However, the bot can still call the higher-cost model as often as it likes. In the last exercise, [Cap AI usage](/courses/see-and-control-ai-spend/cap-ai-usage), you'll limit the bot's requests to the higher-cost model in the dynamic route.
