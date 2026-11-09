---
description: "Give your background bot its own budget, so it's blocked or moved to a small model when it runs out, while your human users keep working."
agent-instructions: |
  - This builds on "match-models-to-the-job"; check progress first. Pitch it to the student's role from this course's interview. For an account executive, skip the JSON: "the bot gets its own budget in the gateway, and when it's spent, the bot is stopped (or moved to the small model) and nobody else notices".
  - If they finished the AI Gateway course, they've set a spend limit before: shorten "Option 1" to the rule and spend the time on the choice between the options and on "One budget per customer".
  - Before "Choose what happens", explain why a company-wide cap is the wrong tool (it stops paying customers when one bot misbehaves), then ask the student which option fits their app: a hard cap (the bot is blocked) or a downgrade (the bot moves to the small model). Wait for their reply. Do only the option they pick: an agent-wide dollar rule also blocks the downgrade's fallback.
  - `cf ai-gateway gateways update` replaces the whole gateway configuration. Run `cf ai-gateway gateways get <gateway-id>` first and carry over every setting the body's command doesn't include (for example `authentication`).
  - Before the check, ask the student to predict: once the bot has used up its budget, will the pro user still get an answer?
  - "Check it works" (either option): send one bot request, wait about 60 seconds (spend limits and route versions take 45 to 60 seconds to take effect, and a request's cost is counted after it finishes), send more bot requests until one is blocked or downgraded, then a pro request, and confirm in the logs. Then leave the cap in place and invite the student to click the bot and then the pro user on the lab page.
  - Downgrade option: in testing, a route's limit step with `"limitType": "cost"` never tripped for Workers AI models (requests served through a route were logged at a cost of `0`), so the body counts requests. Say this to a builder or solutions engineer; for an account executive, "the lab counts the bot's requests, a real budget would count dollars" is enough.
  - Check, by role: builder, why can a burst of simultaneous requests go a little over a dollar limit before it starts blocking, and why does scoping by metadata keep one noisy bot or tenant from taking down the rest of the app? Solutions engineer or account executive: an engineering leader says "we can't put hard caps on AI spend, it'll break features mid-day." How would they walk them through watching spend first, scoping caps to one agent or tier, and downgrading instead of blocking?
  - "Clean up" comes after the check and is part of the exercise: ask which they want, and do it.
  - Out of scope: exporting logs with Logpush, and governing an agent's tool calls with MCP server portals.
---

# Cap runaway loops

Matching models to tasks lowers your everyday spend, but it doesn't stop a bug. A bot stuck in a retry loop at 2 a.m. keeps calling the model, and if your only safety net is one cap for the whole gateway, or a hard limit at your provider, that bot takes every paying customer down with it.

In this exercise you'll give the bot its own budget, so only the bot is affected when it runs out.

## What you'll build

A budget for requests labeled `caller: "agent"`, and one of two things that happens when the bot spends it: the bot is blocked, or it's moved to the small model. Your human users keep working either way.

## Prerequisites

- You've completed [Match models to the job](/courses/see-and-control-ai-spend/match-models-to-the-job) and still have that Worker, gateway, and route.

## Show what happened on the receipt

Whichever option you choose, the receipt should say when the bot was stopped or moved. In `src/index.ts`, replace the two `status` values in `run()`:

```ts title="src/index.ts"
// In the try block:
const status = caller === "bot" && MODEL_SIZES[answeredBy] === "small" ? "downgraded" : "ok";
return { caller, seenAs, model: answeredBy, modelSize: MODEL_SIZES[answeredBy], status, logId: env.AI.aiGatewayLogId };

// In the catch block:
const status = /spend limit/i.test(String(err)) ? "blocked" : "error";
return { caller, seenAs, model, status, error: String(err), logId: env.AI.aiGatewayLogId };
```

## Choose what happens

| | Option 1: hard cap | Option 2: downgrade |
| :--- | :--- | :--- |
| When the bot's budget runs out | It gets `429 Too Many Requests` until the budget resets. | It's answered by the small model instead. |
| Where it lives | A [spend limit](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) on the gateway, in dollars. | A limit step in your route. |
| Fits when | A runaway bot should stop and wait for a person. | The bot's work matters, and a cheaper answer beats no answer. |

## Option 1: hard cap

A spend limit is a budget in dollars over a time window. This rule applies only to requests whose `caller` label is `agent`. The limit is tiny on purpose, a thousandth of a cent per 30 days, so one request uses it up:

```sh
cf ai-gateway gateways update spend-control-gateway --body '{
  "collect_logs": true, "cache_ttl": 0, "cache_invalidate_on_update": true,
  "rate_limiting_interval": 0, "rate_limiting_limit": 0, "rate_limiting_technique": "sliding",
  "spend_limits": { "enabled": true, "rules": [{
    "id": "bot-budget", "enabled": true, "limitType": "cost", "limit": 0.00001,
    "window": 2592000, "technique": "fixed",
    "metadata": { "caller": { "mode": "filter", "values": ["agent"] } }
  }]}
}'
```

`gateways update` replaces the gateway's whole configuration, so the command repeats its other settings. You can also set spend limits on the dashboard, under your gateway's **Settings** > **Spend limits**.

The bot already calls the big model directly, so there's nothing to change in the Worker. Deploy the receipt change:

```sh
cf deploy
```

## Option 2: downgrade

The downgrade goes in your route, next to the rules from the last exercise. Add two steps to a copy of your live route version, saved as `route-v3.json`: a check for the bot, and a limit that lets the bot's requests through to the big model until the limit is reached, then sends them to the small model. Point `start` at the new check:

```json title="route-v3.json (new and changed steps)"
{ "id": "start", "type": "start", "outputs": { "next": { "elementId": "is_bot" } } },
{
  "id": "is_bot",
  "type": "conditional",
  "properties": { "conditions": { "metadata.caller": { "$eq": "agent" } } },
  "outputs": { "true": { "elementId": "bot_budget" }, "false": { "elementId": "task_check" } }
},
{
  "id": "bot_budget",
  "type": "rate",
  "properties": { "limitType": "count", "key": "metadata.caller", "limit": 3, "window": 3600 },
  "outputs": { "success": { "elementId": "big" }, "fallback": { "elementId": "small" } }
},
```

The limit counts the bot's requests: three an hour on the big model, then the small one. A route's limit step can also count dollars (`"limitType": "cost"`), but in testing it never tripped for Workers AI models, so this lab counts requests. Publish the version as you did in the last exercise:

```sh
cf ai-gateway dynamic-routing versions create <route-id> --gateway-id spend-control-gateway --elements @route-v3.json
cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id spend-control-gateway --version-id <version-id>
```

Then send the bot through the route too. In `run()`, every caller now calls the route:

```ts title="src/index.ts"
const model = ROUTE;
```

Deploy:

```sh
cf deploy
```

## Check it works

Run the bot from the lab page. Once its budget is spent, its rows turn `blocked` (option 1) or `downgraded` (option 2). Then click the pro user: it still gets the big model, because the budget only applies to the bot.

## One budget per customer

The rule in option 1 filters on one value. A spend limit can also split by a label instead: every distinct value gets its own budget. With a `customer` label on every request, this rule gives each customer $5 a month, so one heavy customer can't use up anyone else's share:

```json title="Spend limit rule (one budget per customer)"
{
  "id": "per-customer-budget",
  "enabled": true,
  "limitType": "cost",
  "limit": 5,
  "window": 2592000,
  "technique": "fixed",
  "metadata": { "customer": { "mode": "partition" } }
}
```

The dashboard calls this **Split by value**. Spend limits are a best-effort estimate from token counts and model prices, and they're counted as each request finishes, so a burst of simultaneous requests can go a little over before blocking starts.

## Clean up

The tiny budget will keep the bot capped. You can:

- keep the lab as it is;
- raise the budget to something realistic, for example `"limit": 10` for $10 a month in option 1, or a higher `limit` in the route in option 2;
- or delete everything this course created:

```sh
cf workers delete ai-spend-lab --force
cf ai-gateway dynamic-routing delete <route-id> --gateway-id spend-control-gateway --force
cf ai-gateway gateways delete spend-control-gateway --force
```

## What you built

| Stage | What it answers |
| :--- | :--- |
| See the blind spot | How much are we spending on AI, in one place? |
| Attribute every caller | Who's spending it? |
| Match models to the job | Is each task on a model that fits? |
| Cap runaway loops | What stops one bot from spending everyone's budget? |

Watch spend first, then match models to tasks, then cap the callers that can run away. That's the order to put spend controls in place on any app, with any model provider.
