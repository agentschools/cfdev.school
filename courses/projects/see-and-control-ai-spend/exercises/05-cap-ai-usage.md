---
description: "Limit your background bot's requests to the higher-cost model in the dynamic route, then switch it to a lower-cost model while human users keep working."
agent-instructions: |
  - Depth: big picture, compare bot and human receipts; how it works, trace the bot-only limit and fallback; hands-on, inspect the count key and time window.
  - Before "View the results", ask: "After the bot uses its 3 higher-cost requests, which model should a Pro user request still use?"
  - Offer the user these options for optionally verifying AI Gateway logs. 
    - Share a clickable Logs link at `https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/support-copilot/logs`, using the account ID from setup. 
    - Visit the dashboard directly with: AI > AI Gateway > support-copilot > Logs.  
    - Use the Cf ClI command `cf ai-gateway logs list`.
---

# Cap AI usage

When you have automated background jobs running from a bot, it's easy for their usage to get out of control. You probably don't want to cut them off completely, but you might want to limit the amount of requests they can make to higher-cost models.

In this exercise, you'll limit the Background bot to three requests per hour on the higher-cost model. After that, AI Gateway sends its requests to the lower-cost model. Human callers keep their existing model-selection rules.

This limits use of the higher-cost model rather than completely blocking requests. The bot can continue making requests to the lower-cost model after it reaches the limit of higher-cost usage.

## Cap usage based on number of requests

To implement this limit, you'll create and deploy a new version of your dynamic route definition. More specifically, you're going to update the dynamic route definition to limit the bot to 3 calls per hour to the higher-cost model.

Update `route.json` to replace the `start` element with the first element below, and add the `is_bot` and `bot_budget` elements to the same array:

```json title="route.json"
[
  {
    "id": "start",
    "type": "start",
    "outputs": { "next": { "elementId": "is_bot" } }
  },
  {
    "id": "is_bot",
    "type": "conditional",
    "properties": { "conditions": { "metadata.user_type": { "$eq": "bot" } } },
    "outputs": {
      "true": { "elementId": "bot_budget" },
      "false": { "elementId": "is_free" }
    }
  },
  {
    "id": "bot_budget",
    "type": "rate",
    "properties": {
      "limitType": "count",
      "key": "metadata.user_type",
      "limit": 3,
      "window": 3600
    },
    "outputs": {
      "success": { "elementId": "higher_cost" },
      "fallback": { "elementId": "lower_cost" }
    }
  }
]
```

The condition sends only the bot to `bot_budget` where the limit is applied. That step counts its requests using `metadata.user_type`: the first three per hour go to the higher-cost model in the `higher_cost` step, then later requests go to the lower-cost model in the `lower_cost` step. Human callers continue as they were.

Publish the version as you did in the last exercise:

```sh
cf ai-gateway dynamic-routing versions create <route-id> --gateway-id support-copilot --elements @route.json
cf ai-gateway dynamic-routing deployments create <route-id> --gateway-id support-copilot --version-id <version-id>
```

This publishes an AI Gateway configuration change. The Worker doesn't need to be updated since it already sends every caller through `dynamic/support`.

## View the results

Allow about 30 to 60 seconds for the dynamic route version to go live. With `npm run dev` running, click **Background bot** on the lab page. Its button sends four requests in sequence: the first three go to the higher-cost model, then the fourth goes to the lower-cost model and its receipt shows `downgraded`.

If earlier bot requests already used the allowance, it can switch to the lower-cost model sooner. If a higher-cost model request fails, its backup can also produce a lower-cost model response; check AI Gateway logs to distinguish failures from the limit's fallback.

Then, click **Pro user** and **Free user**. Requests from **Pro user** still go to the higher-cost model, and requests from **Free user** still go to the lower-cost model. Compare their receipts with AI Gateway logs to confirm the limit applies only to `user_type: "bot"`.

## Dollar-based spend limits

A request limit controls how often the bot uses the higher-cost model. A [spend limit](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) controls the amount of usage in dollars it's allowed to use. You set a budget and time window on AI Gateway, scoped to a conditional based on the metadata, and requests are blocked with `429` when that budget is exceeded.

A spend limit can filter on one metadata value, such as `user_type` equals `bot`, or split by a label so every distinct value gets its own budget. The following example is for explanation only; you don't need to apply it to complete the exercise.

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

## What you built

Through this course, you've learned how to optimize the cost associated with AI features you add in your applications.

| Exercise                    | What it answers                                    |
| :-------------------------- | :------------------------------------------------- |
| Add AI Gateway              | How much are we spending on AI, in one place?      |
| Add metadata to AI requests | Who's spending it?                                 |
| Choose models dynamically   | Is each user type using the intended model?        |
| Cap AI usage                | How do we limit a bot's use of higher-cost models? |
