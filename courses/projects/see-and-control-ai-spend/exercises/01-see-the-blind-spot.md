---
description: "Put AI Gateway in front of an app with three callers, add a live usage receipt, and see why one total doesn't tell you who's spending."
agent-instructions: |
  - Pitch everything to the student's role from this course's interview (account executive, solutions engineer, or builder); the interview's instructions say what each one gets. For an account executive, tokens are "usage" and the code is a one-sentence summary per section.
  - If they finished the AI Gateway course, shorten "Create the gateway" and "Call the model through the gateway" to a reminder: they've done both. Spend the time on the blind spot itself.
  - Before "Create the gateway", propose names from their interview answers (the app's theme, the three callers, a Worker name, and a gateway ID; the body's defaults are a support desk, `free`, `pro`, `bot`, `ai-spend-lab`, and `spend-control-gateway`), and ask whether to use them. Wait for their reply. Use their names everywhere the body uses the defaults, including the button labels and prompts.
  - Existing app: add the AI binding to its config (Wrangler projects: `"ai": { "binding": "AI", "remote": true }`), and put the lab on its own path, e.g. `/spend-lab` for the page and `/spend-lab/api/run` for the API, updating the page's `fetch` URL to match. Never replace the app's homepage. Read its `AGENTS.md` first to fit its stack.
  - Before "Check it works", ask the student to predict: when the bot runs four times, what will the gateway be able to tell them about who did it? (Account executive: "what will the bill tell you?" Builder: "what will the log entries contain?")
  - "Check it works": run the three callers yourself against the deployed URL, then send the student the lab page and the gateway's logs page (`https://dash.cloudflare.com/<account-id>/ai/ai-gateway/gateways/<gateway-id>/logs`) to click through. Compare their prediction to what they saw.
  - Check, by role: builder, why can't a provider's invoice or a shared API key tell a traffic jump from new paying users apart from a bug in a background loop? Solutions engineer or account executive: a customer says "we already see our total on our OpenAI invoice, why put a gateway in front?" How would they answer? Use the providers they named in the interview.
  - Out of scope: metadata, routes, and spend limits. Those are the next three exercises.
---

# See the blind spot

When an app ships its first AI feature, every caller usually shares one model binding or one API key: free users, paying customers, internal teams, and background jobs. When the bill jumps, the first question is *who spent it?*, and that shared credential can't answer it.

The biggest spender often isn't a person. A background job or an AI agent stuck in a retry loop runs day and night and never notices the bill. In this exercise you'll put [AI Gateway](https://developers.cloudflare.com/ai-gateway/) in front of an app with three callers, so every model call goes through one place you can watch, and then see why that's still not enough.

## What you'll build

A Worker for a small support desk with three callers: a free user asking for a quick summary, a pro user asking for a deep analysis, and a background bot that reviews tickets on its own. Every call goes through your gateway to a big model, `@cf/meta/llama-3.3-70b-instruct-fp8-fast` on [Workers AI](https://developers.cloudflare.com/workers-ai/), and a lab page shows a live usage receipt of who clicked what, next to what the gateway sees.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your account: `cf auth whoami` should say `"authenticated": true`.

## Create the gateway

A gateway is a checkpoint that sits between your code and the models it calls. It records every request: which model answered, how much it used, how long it took, and what it cost. Create one:

```sh
cf ai-gateway gateways create --id spend-control-gateway \
  --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true \
  --rate-limiting-interval 0 --rate-limiting-limit 0 --rate-limiting-technique sliding
```

Caching stays off (`--cache-ttl 0`) so that every click in this course really reaches a model and shows up in your logs.

## Create the Worker

```sh
cf init ai-spend-lab
cd ai-spend-lab
```

Give the Worker the [Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/) in `cloudflare.config.ts`, in place of the template's `WORLD` binding:

```ts title="cloudflare.config.ts"
import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "ai-spend-lab",
		compatibilityDate: "2026-10-23",
		entrypoint,
		env: {
			AI: bindings.ai({ dev: { remote: true } }),
		},
	},
});
```

Keep the `compatibilityDate` that `cf init` wrote. `dev: { remote: true }` means that even under `cf dev` on your machine, calls go to the real Workers AI and through your real gateway. Then regenerate the Worker's types so TypeScript knows about `env.AI`:

```sh
cf workers types
```

## Call the model through the gateway

The Worker has one API route, `POST /api/run`, which takes the name of a caller and sends that caller's prompt to the big model. The third argument to `env.AI.run()` sends the call through your gateway:

```ts title="src/index.ts"
import { LAB_PAGE } from "./lab";

const GATEWAY_ID = "spend-control-gateway";
const BIG_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// Plain-language sizes for the receipt.
const MODEL_SIZES: Record<string, string> = {
	"@cf/meta/llama-3.3-70b-instruct-fp8-fast": "big",
	"@cf/openai/gpt-oss-120b": "big",
	"@cf/google/gemma-4-26b-a4b-it": "small",
	"@cf/ibm-granite/granite-4.0-h-micro": "small",
};

// The three callers, and what each one asks.
const CALLERS = {
	free: "Summarize this ticket in one line: my password reset email never arrived.",
	pro: "Analyze this ticket and propose a fix plan: SSO login fails for 30% of our users since Monday.",
	bot: "Review this ticket and tag it with one category: the printer shows error 50.4.",
};
type Caller = keyof typeof CALLERS;

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (request.method === "POST" && url.pathname === "/api/run") {
			const { caller } = await request.json<{ caller: Caller }>();
			if (!(caller in CALLERS)) return Response.json({ error: "Unknown caller" }, { status: 400 });
			return Response.json(await run(env, caller));
		}
		if (url.pathname === "/") {
			return new Response(LAB_PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
		}
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

async function run(env: Env, caller: Caller) {
	const model = BIG_MODEL;
	const seenAs = "anonymous";
	try {
		await env.AI.run(
			model,
			{ messages: [{ role: "user", content: CALLERS[caller] }] },
			{ gateway: { id: GATEWAY_ID, skipCache: true } },
		);
		return { caller, seenAs, model, modelSize: MODEL_SIZES[model], status: "ok", logId: env.AI.aiGatewayLogId };
	} catch (err) {
		return { caller, seenAs, model, status: "error", error: String(err), logId: env.AI.aiGatewayLogId };
	}
}
```

Each response says who really clicked (`caller`) and what the gateway can tell about the request (`seenAs`). For now, that's nothing: the gateway sees every request arrive the same way.

## Add the lab page

The lab page has a button for each caller, a bar chart of who the gateway thinks is spending, and the usage receipt. It's the same page for the rest of the course: later exercises only change what the Worker returns.

```ts title="src/lab.ts"
export const LAB_PAGE = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI spend lab</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; max-width: 52rem; margin: 2rem auto; padding: 0 1rem; }
  button { font: inherit; padding: 0.5rem 0.9rem; margin: 0 0.5rem 0.5rem 0; cursor: pointer; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { text-align: left; padding: 0.35rem 0.5rem; border-bottom: 1px solid #ddd; }
  .bar { background: #f6821f; color: white; padding: 0.2rem 0.5rem; margin: 0.25rem 0; white-space: nowrap; }
  .blocked td, .error td { color: #b00020; }
  .downgraded td { color: #8a5a00; }
</style>
<h1>AI spend lab</h1>
<p>Each button calls the AI as a different caller. The receipt shows who really clicked and what AI Gateway sees.</p>
<div>
  <button data-caller="free">Free user: quick summary</button>
  <button data-caller="pro">Pro user: deep analysis</button>
  <button data-caller="bot" data-times="4">Run the background bot (4 times)</button>
</div>
<h2>Who the gateway thinks is spending</h2>
<div id="breakdown"></div>
<h2>Usage receipt</h2>
<table>
  <thead><tr><th>Time</th><th>Who clicked</th><th>What the gateway sees</th><th>Model</th><th>Status</th></tr></thead>
  <tbody id="receipt"></tbody>
</table>
<script>
  const counts = {};
  function addRow(row) {
    const tr = document.createElement("tr");
    tr.className = row.status;
    const model = row.modelSize ? row.modelSize + " (" + row.model + ")" : row.model;
    for (const text of [new Date().toLocaleTimeString(), row.caller, row.seenAs, model, row.status]) {
      const td = document.createElement("td");
      td.textContent = text ?? "";
      tr.append(td);
    }
    document.getElementById("receipt").prepend(tr);
    counts[row.seenAs] = (counts[row.seenAs] ?? 0) + 1;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    document.getElementById("breakdown").replaceChildren(...Object.entries(counts).map(([who, n]) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.width = Math.max(15, (100 * n) / total) + "%";
      bar.textContent = who + ": " + n + " of " + total + " requests";
      return bar;
    }));
  }
  async function run(caller) {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caller }),
    });
    addRow(await res.json());
  }
  for (const button of document.querySelectorAll("button[data-caller]")) {
    button.addEventListener("click", () => {
      const times = Number(button.dataset.times ?? 1);
      return Promise.all(Array.from({ length: times }, () => run(button.dataset.caller)));
    });
  }
</script>
`;
```

## Deploy

```sh
cf deploy
```

`cf deploy` prints the Worker's URL, like `https://ai-spend-lab.<your-subdomain>.workers.dev`. A new Worker can take up to about 30 seconds to start serving.

## Check it works

Open the URL and click each button: the free user, the pro user, and the bot, which runs four times in a row. Then look at the receipt and at your gateway's **Logs** page in the Cloudflare dashboard (**AI** > **AI Gateway** > `spend-control-gateway` > **Logs**).

Every request is there, with its model, its tokens, and its cost. But the "What the gateway sees" column says `anonymous` for all of them, and the chart has one bar. Four of those requests were a bot no one was watching, running a big model, and nothing in the gateway can tell it apart from a paying customer.

## Why one total isn't enough

| What you can see now | What's still hidden |
| :--- | :--- |
| Every request, and what all of them cost together, in one place. | Which caller made each request. |
| That traffic jumped when the bot ran. | Whether the jump was new paying users or a bot stuck in a loop. |

That's the blind spot: a total tells you *how much*, not *who*. In the next exercise, [Attribute every caller](/courses/see-and-control-ai-spend/attribute-every-caller), you'll label every request so the gateway can tell your callers apart.
