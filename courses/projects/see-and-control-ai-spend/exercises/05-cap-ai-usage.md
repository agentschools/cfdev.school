---
description: "Limit your background bot's big-model requests in the dynamic route, then move it to a small model while human users keep working."
agent-instructions: |
  - Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on). For big picture, skip the JSON: "AI Gateway limits the bot's big-model requests, then moves it to the small model while human callers keep working".
  - If they finished the AI Gateway course, they've set limits before: shorten "Cap usage based on number of requests" to the bot-specific condition and fallback, and spend the time on "Understand dollar-based spend limits".
  - Before "Cap usage based on number of requests", explain why a company-wide cap is the wrong tool (it stops paying customers when one bot misbehaves). The bot should move to the small model after three big-model requests per hour; ask whether that trade-off fits their use case.
  - Every caller already uses the dynamic route, and the starter already labels blocked or downgraded receipts. This exercise changes only the dynamic route configuration.
  - Before "View the results", ask the student to predict: once the bot has used up its budget, will Pro user still get an answer?
  - In "View the results", wait about 30 to 60 seconds for the dynamic route version to go live, then run Background bot's four-request batch and a Pro user request. Confirm the selected models and metadata in `cf ai-gateway logs list --gateway-id support-copilot --per-page 10 --order-by created_at --order-by-direction desc`, not only on the lab page. Keep the limit active while the student tries it.
  - Earlier testing logged routed Workers AI requests at a cost of `0`, so dollar-based limits never tripped. This lab uses the previously tested request-count limit; do not present it as a dollar cap or claim the accounting issue is resolved without live verification.
  - Check, by depth: hands-on, why can a burst of simultaneous requests go a little over a dollar limit before it starts blocking, and why does scoping by metadata keep one noisy bot or tenant from taking down the rest of the app? Big picture or how it works: someone they work with, like an engineering lead, says "we can't put hard caps on AI spend, it'll break features mid-day." How would they walk them through watching spend first, scoping caps to one agent or tier (or per customer with "Split by value"), and downgrading instead of blocking?
  - After "View the results", offer the optional choices in "Clean up". Cleanup is not required to complete the exercise. Confirm before deleting resources, delete only resources created during this course, and preserve the local source code unless the student asks to remove it.
  - Out of scope: exporting logs with Logpush, and governing an agent's tool calls with MCP server portals.
---

# Cap AI usage

Automated background jobs can generate requests long after a person stops watching. Choosing a cheaper model helps reduce the cost of each request, but you may also want to limit how often a job uses an expensive model.

In this exercise, you'll limit Background bot to three big-model requests per hour. After that, AI Gateway sends its requests to the small model. Human callers keep their existing model-selection rules.

This limits expensive-model usage rather than total dollar spend. The bot can continue making small-model requests after it reaches the limit.

## Cap usage based on number of requests

To implement this hard cap, you'll create and deploy a new version of your dynamic route definition. More specifically, you're going to update the dynamic route definition to limit the bot to 3 calls per hour to the larger model.

Copy `route-v2.json` to `route-v3.json`. In that copy, replace the `start` element with the first element below, and add the `is_bot` and `bot_budget` elements to the same array:

```json title="route-v3.json (new and changed steps)"
[
  {
    "id": "start",
    "type": "start",
    "outputs": { "next": { "elementId": "is_bot" } }
  },
  {
    "id": "is_bot",
    "type": "conditional",
    "properties": { "conditions": { "metadata.caller": { "$eq": "bot" } } },
    "outputs": {
      "true": { "elementId": "bot_budget" },
      "false": { "elementId": "task_check" }
    }
  },
  {
    "id": "bot_budget",
    "type": "rate",
    "properties": {
      "limitType": "count",
      "key": "metadata.caller",
      "limit": 3,
      "window": 3600
    },
    "outputs": {
      "success": { "elementId": "big" },
      "fallback": { "elementId": "small" }
    }
  }
]
```

The condition sends only the bot to `bot_budget`. That step counts its requests using `metadata.caller`: the first three per hour go to `big`, then later requests go to `small`. Human callers continue as they were.

Publish the version as you did in the last exercise:

```sh
cf ai-gateway dynamic-routing versions create <route-id> --gateway-id support-copilot --elements @route-v3.json
cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id support-copilot --version-id <version-id>
```

This publishes an AI Gateway configuration change. The Worker doesn't need to be updated since it already sends every caller through `dynamic/support`.

## View the results

Allow about 30 to 60 seconds for the dynamic route version to go live. With `npm run dev` running, click **Background bot** on the lab page. Its button sends four requests in sequence: the first three go to the big model, then the fourth goes to the small model and its receipt shows `downgraded`. If earlier bot requests already used the allowance, it can downgrade sooner. If a big-model request fails, its backup can also produce a small-model response; check AI Gateway logs to distinguish failures from the limit's fallback.

Then, click **Pro user** and **Free user**. Requests from **Pro user** still go to the big model, and requests from **Free user** still go to the small model. Compare their receipts with AI Gateway logs to confirm the limit applies only to `caller: "bot"`.

## Understand dollar-based spend limits

A request limit controls how often the bot uses the big model. A [spend limit](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) controls the amount of usage in dollars it's allowed to use. You set a budget and time window on AI Gateway, scoped to a conditional based on the metadata, and requests are blocked with `429` when that budget is exceeded.

A spend limit can filter on one metadata value, such as `caller` equals `bot`, or split by a label so every distinct value gets its own budget. The following example is for explanation only; you don't need to apply it to complete the exercise.

For a workload with verified cost accounting, this rule gives each value of a `customer` label its own $5 budget over 30 days. The starter doesn't attach a `customer` label. A real application would need to supply that metadata from its own customer records.

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

Cleanup is optional. The request limit stays active after the exercise, so you can keep the application and AI Gateway configuration for further testing. To raise the request allowance, increase `bot_budget`'s `limit` and publish a new dynamic route version.

To stop the local application, stop `npm run dev` with `Ctrl+C`. This course doesn't deploy a Worker. Keep the local source code unless you want to remove it.

If you want to remove the Cloudflare resources, first confirm which ones you created during this course. Delete only those resources, keeping any AI Gateway or dynamic route that existed before the course. If you created both, delete the dynamic route before AI Gateway:

```sh
cf ai-gateway dynamic-routing delete <route-id> --gateway-id support-copilot --force
cf ai-gateway gateways delete support-copilot --force
```

## What you built

Through this course, you've learned how to optimize the cost associated with AI features you add in your applications.

| Exercise                    | What it answers                                     |
| :-------------------------- | :-------------------------------------------------- |
| Add AI Gateway              | How much are we spending on AI, in one place?       |
| Add metadata to AI requests | Who's spending it?                                  |
| Choose models dynamically   | Is each task on a model that fits?                  |
| Cap AI usage                | How do we limit a bot's use of expensive models?     |
