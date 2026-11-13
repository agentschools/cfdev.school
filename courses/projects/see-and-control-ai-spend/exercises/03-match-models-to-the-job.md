---
description: "Move model choice out of your code into a dynamic route that sends routine tasks to a small model and keeps hard ones on a big model with a fallback, then swap a model without redeploying."
agent-instructions: |
  - This builds on "attribute-every-caller"; check progress first. Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on). For big picture, the models are "big" and "small", and the route is "a rule in the gateway that picks the model".
  - Call the feature a "dynamic route" the first time, then "route". That's the docs' and the `cf` CLI's name for it.
  - If they finished the AI Gateway course, they've built a route before: shorten "Write the route" to the differences (it branches on the task, and the bot stays out of it) and spend the time on "Other ways to pick a model".
  - Before "Write the route", ask which of their tasks are routine enough for the small model (the starter's default: `quick-summary` is routine; `deep-analysis` is not). Use `quick-summary` in the route's `$in` list so the next exercise's requests still match.
  - Use `@cf/openai/gpt-oss-20b` as the small model and `@cf/openai/gpt-oss-120b` as the big model and fallback. For the no-redeploy swap, use `@cf/ibm-granite/granite-4.0-h-micro`. Check the current Workers AI model catalog before changing these model IDs.
  - Before "Swap a model with no redeploy", ask the student to predict: will the Worker need a redeploy for the free user to get the new model?
  - "Check it works" and the swap's check: confirm which model answered in `cf ai-gateway logs list --gateway-id support-copilot --per-page 5 --order-by created_at --order-by-direction desc`, not only on the lab page. Route deployments take about 30 to 60 seconds to go live; retry before assuming something's wrong. In testing, requests served through a route showed a cost of `0` in the logs for Workers AI models; if the student sees that, say so rather than treating it as free.
  - Check, by depth: hands-on, why is it safer to try a new model across several services by publishing a route version than by editing each service? Big picture or how it works: someone they work with asks "isn't putting a gateway in front of our models just another form of lock-in?" How would they answer, using the providers they named in the interview?
  - Out of scope: percentage splits and A/B tests, and capping the bot. That's the next exercise.
---

# Match models to the job

Once you can see who's spending on what, the most common leak is obvious: every request goes to the same big model, because that's the model name in the code. A one-line summary can use a different model from a deep analysis. The [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/) describes [GPT-OSS 20B](https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/) as a lower-latency model and [GPT-OSS 120B](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/) as a high-reasoning model.

Changing the model name in your code works once. But then every change means editing and redeploying every app that calls the model. AI Gateway's [routing](https://developers.cloudflare.com/ai-gateway/features/routing/) moves that choice into the gateway.

## What you'll build

A [dynamic route](https://developers.cloudflare.com/ai-gateway/features/routing/dynamic-routing/) named `dynamic/support` that reads each request's `task` label: `quick-summary` goes to a small model, everything else to the big model, with a backup model if the big one fails. Your human callers call the route instead of a model. Then you'll publish a second version of the route that swaps the small model, without touching your Worker.

The bot stays on the big model for now. It's the other leak, and the next exercise deals with it.

## Prerequisites

- You've completed [Attribute every caller](/courses/see-and-control-ai-spend/attribute-every-caller) and still have that Worker and gateway.

## Write the route

A route is a small flow of steps: check a condition, call a model, fall back to another one if it fails. Save this one as `route-v1.json` in your project:

```json title="route-v1.json"
[
  { "id": "start", "type": "start", "outputs": { "next": { "elementId": "task_check" } } },
  {
    "id": "task_check",
    "type": "conditional",
    "properties": { "conditions": { "metadata.task": { "$in": ["quick-summary"] } } },
    "outputs": { "true": { "elementId": "small" }, "false": { "elementId": "big" } }
  },
  {
    "id": "small",
    "type": "model",
    "properties": { "provider": "workers-ai", "model": "@cf/openai/gpt-oss-20b", "timeout": 30000, "retries": 0 },
    "outputs": { "success": { "elementId": "end" }, "fallback": { "elementId": "end" } }
  },
  {
    "id": "big",
    "type": "model",
    "properties": { "provider": "workers-ai", "model": "@cf/openai/gpt-oss-120b", "timeout": 60000, "retries": 0 },
    "outputs": { "success": { "elementId": "end" }, "fallback": { "elementId": "backup" } }
  },
  {
    "id": "backup",
    "type": "model",
    "properties": { "provider": "workers-ai", "model": "@cf/openai/gpt-oss-20b", "timeout": 60000, "retries": 0 },
    "outputs": { "success": { "elementId": "end" }, "fallback": { "elementId": "end" } }
  },
  { "id": "end", "type": "end", "outputs": {} }
]
```

The `conditional` step reads the same `task` label your Worker already attaches. `$in` lists the tasks that count as routine. The `big` model step's `fallback` sends the request on to `backup` if the big model errors or times out. The [JSON configuration](https://developers.cloudflare.com/ai-gateway/features/routing/dynamic-routing/json-configuration/) reference lists every kind of step.

Create the route, which also deploys its first version:

```sh
cf ai-gateway dynamic-routing create support-copilot --name support --elements @route-v1.json
```

Note the route's `id` in the output. You'll need it to publish the next version.

## Call the route

In `src/index.ts`, human callers now call `dynamic/support` in place of a model. The bot keeps using the big model until the next exercise:

```ts title="src/index.ts"
const ROUTE = "dynamic/support";

// Inside run(), after validating caller and building metadata:
const model = caller === "bot" ? MODEL : ROUTE;

await env.AI.run(
	model as typeof MODEL,
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

// Keep the existing try/catch around the model call, setting failed and
// errorMessage on failure. Read the log after either outcome.
const trace = await getGatewayTrace();
const answeredBy = trace.model;
const answeredSize = modelSize(answeredBy);
```

The cast on `model` is only for TypeScript, whose model list doesn't include your route's name. Use `trace.model` for the receipt's model, `answeredSize` for its size, and the Gateway log's metadata for `seenAs`. Add this helper so the receipt distinguishes the selected models:

```ts title="src/index.ts"
function modelSize(model: string): "big" | "small" | "unknown" {
	if (/gpt-oss-20b|gemma|granite/i.test(model)) return "small";
	if (/gpt-oss-120b|llama/i.test(model)) return "big";
	return "unknown";
}
```

Deploy:

```sh
cf deploy
```

## Check it works

On the lab page, click the free user and the pro user. The free user's `quick-summary` is answered by GPT-OSS 20B, and the pro user's `deep-analysis` by GPT-OSS 120B. Gateway Logs show which model answered each request.

## Swap a model with no redeploy

Each change to a route is a new version, and you choose which version is live. Copy `route-v1.json` to `route-v2.json` and change the `small` step's model to `@cf/ibm-granite/granite-4.0-h-micro`. Then create the version and deploy it:

```sh
cf ai-gateway dynamic-routing versions create <route-id> --gateway-id support-copilot --elements @route-v2.json
cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id support-copilot --version-id <version-id>
```

The first command prints the new version's `version_id`. A deployment takes about 30 to 60 seconds to go live. Then click the free user again. The Gateway log shows Granite 4.0 micro, and you haven't changed your Worker. To undo it, deploy version 1 again the same way.

## Other ways to pick a model

A dynamic route is for when you want to decide the rules yourself. AI Gateway's [routing](https://developers.cloudflare.com/ai-gateway/features/routing/) has two other ways to keep model names out of your code:

| Option | What it does | When it fits |
| :--- | :--- | :--- |
| [Auto Router](https://developers.cloudflare.com/ai-gateway/features/routing/auto-router/) | Use `cloudflare/auto` as the model, and the gateway picks a model for each request, weighing how hard the task looks against what each model costs. | You want lower cost without writing rules, and you're fine with Cloudflare managing the list of models it picks from. |
| [Model aliases](https://developers.cloudflare.com/ai-gateway/features/routing/model-aliases/) | Give one or more models a stable name, like `custom/support-fast`, and change what's behind it later. | You want one name to point at the model of the month, with no conditions. |
| Dynamic routes | Conditions, percentage splits, limits, and fallbacks, all versioned. | Different callers or tasks need different models, like here. |

If your routes call models outside Workers AI, from OpenAI, Anthropic, or Google, you pay those providers through [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) (one Cloudflare bill) or with [your own keys](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/), and the route works the same way.

Your human callers now get the right model for the job. The bot is still calling the big model as often as it likes, with no ceiling. In the last exercise, [Cap runaway loops](/courses/see-and-control-ai-spend/cap-runaway-loops), you'll give it a budget.
