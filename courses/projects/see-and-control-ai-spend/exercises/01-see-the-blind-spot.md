---
description: "Run the three-caller starter without Gateway, then put AI Gateway in front of it and see the requests it records."
agent-instructions: |
  - Pitch everything to the depth the student chose in this course's interview (big picture, how it works, or hands-on); the interview's instructions say what each level gets. For big picture, tokens are "usage" and each code change gets a one-sentence summary.
  - Start from the repository linked in `COURSE.md`, on its `starter` branch. Do not scaffold a Worker or rebuild the lab page. Keep the starter's caller IDs (`free`, `pro`, `bot`), the `/api/run` endpoint, and its UI.
  - If they finished the AI Gateway course, shorten Gateway setup and the binding change to a quick review. Still run the starter baseline and compare its requests with Gateway logs.
  - Keep the Gateway ID `support-copilot` and Worker name `ai-spend-control-course`. The Dynamic Route created later is named `support`; keep these values fixed so code, commands, and repository match.
  - Before the baseline run, ask the student to predict whether Gateway will have a log for each button. Before connecting the Worker to Gateway, ask what will change in the logs and what will still be missing.
  - Check the baseline and the updated Worker locally with `npm run dev`. The AI binding uses remote Workers AI, so the account must have Workers AI enabled. No deploy is needed for this exercise.
  - Check, by depth: hands-on, why can't a provider invoice or shared API key distinguish new paying users from a background retry loop? Big picture or how it works: someone they work with asks, "we already see the total on the provider invoice, why put a gateway in front?" Help them answer using the providers they named.
  - Out of scope: metadata, routes, and spend limits. Those are the next three exercises.
---

# See the blind spot

When every caller uses the same model binding or API key, the bill has one total but no caller details. A traffic jump could be new customers, or a background job stuck retrying overnight.

You'll start with the course's three-caller app, then connect its existing Worker to AI Gateway. The buttons and receipt stay the same throughout the course.

## Run the starter

Clone the starter branch and install its dependencies:

```sh
git clone --branch starter https://github.com/jamesqquick/ai-spend-control-course.git
cd ai-spend-control-course
npm install
```

Log in to Cloudflare, select the account that has Workers AI enabled, and start the app:

```sh
cf auth login
export CLOUDFLARE_ACCOUNT_ID=your-account-id
npm run dev
```

Open the local URL. Click **Free user**, **Pro user**, and **Background bot**. The bot sends 4 requests in sequence. The receipt says the requests are not routed through Gateway. The generated answers are discarded, so you can focus on the request details.

## Create a gateway

Create the Gateway that the Worker will use. Logging is on and caching is off, so every click creates a new log entry.

```sh
cf ai-gateway gateways create --id support-copilot --authentication true \
  --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true \
  --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding
```

Open **AI** > **AI Gateway** > `support-copilot` > **Logs** in the Cloudflare dashboard. The starter requests are not in the log because they called Workers AI directly.

## Send the same requests through the gateway

Add a text binding for the Gateway ID in `cloudflare.config.ts`:

```ts title="cloudflare.config.ts"
GATEWAY_ID: bindings.text("support-copilot"),
```

Keep the existing `AI` and `ASSETS` bindings. In `src/index.ts`, change the `/api/config` response from `mode: "direct"` to `mode: "gateway"`. This keeps the lab's error message accurate if Gateway is unavailable.

In the existing `run()` function, keep its request validation and caller lookup. Add Gateway options to the model call:

```ts title="src/index.ts"
let failed = false;
let errorMessage: string | undefined;
try {
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
} catch (error) {
	failed = true;
	errorMessage = error instanceof Error ? error.message : "The model request failed.";
}
```

After the request succeeds or fails, read its Gateway log using the log ID from the binding. This is where the receipt gets the model, status, and metadata recorded by Gateway:

```ts title="src/index.ts"
async function getGatewayTrace() {
  const logId = env.AI.aiGatewayLogId;
  const unavailable = {
    available: false,
    logId: null,
    model: MODEL,
    statusCode: null,
    metadata: null,
  };
  if (!logId) return unavailable;

  try {
    const log = await env.AI.gateway(env.GATEWAY_ID).getLog(logId);
    return {
      available: true,
      logId,
      model: log.model || MODEL,
      statusCode: log.status_code,
      metadata: log.metadata ?? null,
    };
  } catch {
    return unavailable;
  }
}
```

Use that trace in the response from `run()`. No metadata is attached yet, so a successful Gateway log is shown as `anonymous`:

```ts title="src/index.ts"
const trace = await getGatewayTrace();
return Response.json(
	{
		caller,
		callerLabel: CALLERS[caller].label,
		seenAs: trace.available ? "anonymous" : "Gateway log unavailable",
		model: trace.model,
		modelSize: "big",
		status: failed ? "error" : "ok",
		statusCode: trace.statusCode,
		logId: trace.logId,
		...(failed ? { error: errorMessage } : {}),
	},
	{ status: failed ? 502 : 200 },
);
```

The code reads the Gateway log after either outcome. If model inference fails, it still returns the log fields with `status: "error"` and an HTTP `502` response.

## Check the difference

Save the files and use the existing local app. Click each caller again. The receipt shows `anonymous` for each successful request, and Gateway Logs now has 1 row for each click. The background bot adds 4 rows.

Gateway can record the model, token counts, duration, and estimated cost, but it still cannot identify the caller. The receipt shows request counts; use the cost column in Gateway Logs for the cost estimate.

## Why one total isn't enough

| What Gateway shows now | What's still hidden |
| :--- | :--- |
| Every request and its usage in one place. | Which caller made each request. |
| A traffic jump when the bot runs. | Whether the jump came from new users or a bot stuck in a loop. |

That's the blind spot: a total tells you how much, not who. In the next exercise, [Attribute every caller](/courses/see-and-control-ai-spend/attribute-every-caller), you'll attach metadata so Gateway can distinguish the callers.
