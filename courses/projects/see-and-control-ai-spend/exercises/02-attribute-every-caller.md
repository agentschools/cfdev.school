---
description: "Label every request with who's behind it, run a mix of traffic, and find the two places your AI spend is leaking."
agent-instructions: |
  - This builds on "see-the-blind-spot"; check progress first. Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on).
  - If they finished the AI Gateway course, they've attached metadata before: shorten "Label every request" to the diff and spend the time on the investigation.
  - Before "Label every request", show the starter's metadata values (`caller`: `free` / `pro` / `bot`; `tier`: `free` / `pro` / `background`; `task`: `quick-summary` / `deep-analysis` / `ticket-review`). Ask whether they want to change button labels or prompts. Keep these IDs and metadata values unchanged so the route in the next exercise matches.
  - In "Label every request", say plainly that the buttons stand in for real users: in a real app the Worker reads caller identity and tier from the signed-in session or job configuration, never from anything the browser sends, so no one can claim to be someone else.
  - "Find the two leaks" is the student's investigation, not yours. Ask them to click the buttons themselves (a couple of free summaries, one pro analysis, and the bot), then guess the two leaks from the lab page before you show them anything. Wait for their guess. Only then pull the last few entries with `cf ai-gateway logs list --gateway-id support-copilot --per-page 10 --order-by created_at --order-by-direction desc` and compare. If they can't open a browser, send the traffic yourself and still ask for the guess first.
  - Don't compute prices yourself. If they want numbers, point them at the cost column on the gateway's Logs page, which is the gateway's own estimate. For big picture, the two leaks are the story ("one bot nobody watches" and "free users on the expensive model"), not the cents.
  - "Check it works": confirm in Gateway Logs that each request has the exact `caller`, `tier`, and `task` values shown in the receipt.
  - Check, by depth: hands-on, why must the labels be attached in the Worker rather than taken from the browser? Big picture or how it works: when a company ships AI to its own customers, every request is part of the cost of serving them. How would they use labels by customer, tier, and feature to explain "one big AI bill" to someone they work with, like a finance team, a product manager, or a customer?
  - Out of scope: routes and spend limits. Those are the next two exercises.
---

# Attribute every caller

The gateway now sees every request, the way a shared company card shows every charge, but not who made each one. To tell healthy growth from free users eating your margin or a bot stuck in a loop, every request has to say who's behind it.

## What you'll build

Labels on every request, attached by your Worker: who's calling (`caller`), which tier they're on (`tier`), and what they're asking for (`task`). Then you'll run a mix of traffic and use the lab page and your gateway's logs to find two leaks.

## Prerequisites

- You've completed [See the blind spot](/courses/see-and-control-ai-spend/see-the-blind-spot) and still have that Worker and gateway.

## Label every request

AI Gateway calls these labels [custom metadata](https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/): up to five key-value pairs per request, saved with its log entry. You can filter logs by them, break down spend by them, and, later in this course, route and cap traffic by them.

The starter already defines each caller's `tier` and `task` in `src/demo-data.ts`. Use the caller ID from the validated request body as the third label. Do not trust the browser to send tier or task values. In `run()`, build metadata from the Worker's own caller table:

```ts title="src/index.ts"
// Who's behind each caller. In a real app the Worker reads this from the
// signed-in session or the job's own config, never from the browser.
const metadata = {
	caller,
	tier: CALLERS[caller].tier,
	task: CALLERS[caller].task,
};
```

Pass the metadata to Gateway. Keep using `getGatewayTrace()` from the previous exercise, which reads the metadata recorded in the Gateway log. Format those recorded values for the receipt:

```ts title="src/index.ts"
const metadata = {
	caller,
	tier: CALLERS[caller].tier,
	task: CALLERS[caller].task,
};

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
			metadata,
			skipCache: true,
		},
	},
);
```

Keep the existing error handling. After the request, read the Gateway log with `getGatewayTrace()` and use its metadata in the receipt:

```ts title="src/index.ts"
const trace = await getGatewayTrace();
const seenAs = trace.available ? formatMetadata(trace.metadata) : "Gateway log unavailable";
```

```ts title="src/index.ts"
function formatMetadata(metadata: Record<string, string | number | boolean | null | bigint> | null | undefined): string {
	if (!metadata || Object.keys(metadata).length === 0) return "anonymous";
	return Object.entries(metadata).map(([key, value]) => `${key}=${value}`).join(", ");
}
```

The labels are attached on the server, from the Worker's own caller table. The browser only sends the caller ID for this demo. In a real app, derive that ID and its tier from the signed-in session or the job's configuration.

Deploy:

```sh
cf deploy
```

## Find the two leaks

Open the lab page, reload it to clear the receipt, and send a realistic mix: a couple of free summaries, one pro analysis, and a run of the bot. The chart now has a bar for each caller.

Before you open the logs, look at the receipt and find two leaks:

1. Which caller makes the most requests with no person behind them?
2. Which caller pays big-model prices for small, routine work?

Then open the `support-copilot` Gateway's **Logs** page and filter by `caller` equals `bot` to see the bot's requests and their cost.

## Check it works

Every new log entry carries its caller's `caller`, `tier`, and `task`. The receipt reads those values back from the Gateway log instead of reconstructing them from the button click.

## Two ways to use the same labels

The same few labels answer different questions depending on who calls the AI:

| Who calls the AI | What you label | What the breakdown tells you |
| :--- | :--- | :--- |
| Your own people and agents | `{ caller: "bot", tier: "background", task: "ticket-review" }` | Which bot drives the monthly bill. |
| Your customers | `{ customer: "acme", tier: "free", feature: "summary" }` | What each customer and tier costs to serve, so Product can see whether free users are profitable. |

The leaks are clear now: the bot makes the most requests, and free users get the big model for one-line summaries. In the next exercise, [Match models to the job](/courses/see-and-control-ai-spend/match-models-to-the-job), you'll fix the second one without changing which model your code names.
