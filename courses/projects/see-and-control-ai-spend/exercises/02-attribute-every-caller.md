---
description: "Label every request with who's behind it, run a mix of traffic, and find the two places your AI spend is leaking."
agent-instructions: |
  - This builds on "see-the-blind-spot"; check progress first. Pitch it to the depth the student chose in this course's interview (big picture, how it works, or hands-on).
  - If they finished the AI Gateway course, they've attached metadata before: shorten "Label every request" to the diff and spend the time on the investigation.
  - Before "Label every request", show the three labels the body uses, renamed for their callers, and ask whether they'd like a different label, e.g. a customer or team name (at most five keys per request). Wait for their reply.
  - In "Label every request", say plainly that the buttons stand in for real users: in a real app the Worker reads the tier from the signed-in session or the job's own config, never from anything the browser sends, so no one can claim to be someone else.
  - "Find the two leaks" is the student's investigation, not yours. Ask them to click the buttons themselves (a couple of free summaries, one pro analysis, and the bot), then guess the two leaks from the lab page before you show them anything. Wait for their guess. Only then pull the last few entries with `cf ai-gateway logs list --gateway-id <gateway-id> --per-page 10 --order-by created_at --order-by-direction desc` and compare. If they can't open a browser, send the traffic yourself and still ask for the guess first.
  - Don't compute prices yourself. If they want numbers, point them at the cost column on the gateway's Logs page, which is the gateway's own estimate. For big picture, the two leaks are the story ("one bot nobody watches" and "free users on the expensive model"), not the cents.
  - "Check it works": confirm in the logs that requests carry each caller's labels.
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

Add a table of labels for each caller to `src/index.ts`:

```ts title="src/index.ts"
// Who's behind each caller. In a real app the Worker reads this from the
// signed-in session or the job's own config, never from the browser.
const METADATA: Record<Caller, { caller: string; tier: string; task: string }> = {
	free: { caller: "human", tier: "free", task: "summary" },
	pro: { caller: "human", tier: "pro", task: "analysis" },
	bot: { caller: "agent", tier: "internal", task: "review" },
};
```

Then pass the caller's labels to the gateway, and report them as what the gateway sees:

```ts title="src/index.ts"
async function run(env: Env, caller: Caller) {
	const model = BIG_MODEL;
	const metadata = METADATA[caller];
	const seenAs = `${metadata.caller} · ${metadata.tier} · ${metadata.task}`;
	try {
		await env.AI.run(
			model,
			{ messages: [{ role: "user", content: CALLERS[caller] }] },
			{ gateway: { id: GATEWAY_ID, metadata, skipCache: true } },
		);
		return { caller, seenAs, model, modelSize: MODEL_SIZES[model], status: "ok", logId: env.AI.aiGatewayLogId };
	} catch (err) {
		return { caller, seenAs, model, status: "error", error: String(err), logId: env.AI.aiGatewayLogId };
	}
}
```

The labels are attached on the server, from the Worker's own table. The browser only says which button was clicked; here that stands in for a signed-in user, and in a real app that's exactly where the tier would come from.

Deploy:

```sh
cf deploy
```

## Find the two leaks

Open the lab page, reload it to clear the receipt, and send a realistic mix: a couple of free summaries, one pro analysis, and a run of the bot. The chart now has a bar for each caller.

Before you open the logs, look at the receipt and find two leaks:

1. Which caller makes the most requests with no person behind them?
2. Which caller pays big-model prices for small, routine work?

Then open your gateway's **Logs** page and filter by a metadata value, for example `caller` equals `agent`, to see only the bot's requests and what they cost.

## Check it works

Every new log entry carries its caller's `caller`, `tier`, and `task`, and the receipt shows those labels instead of `anonymous`.

## Two ways to use the same labels

The same few labels answer different questions depending on who calls the AI:

| Who calls the AI | What you label | What the breakdown tells you |
| :--- | :--- | :--- |
| Your own people and agents | `{ caller: "agent", team: "eng", app: "pr-review" }` | Which team or which bot drives the monthly bill. |
| Your customers | `{ customer: "acme", tier: "free", feature: "summary" }` | What each customer and tier costs to serve, so Product can see whether free users are profitable. |

The leaks are clear now: the bot makes the most requests, and free users get the big model for one-line summaries. In the next exercise, [Match models to the job](/courses/see-and-control-ai-spend/match-models-to-the-job), you'll fix the second one without changing which model your code names.
