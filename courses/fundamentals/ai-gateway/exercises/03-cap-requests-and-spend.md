---
description: "See how Unified Billing and stored keys pay for inference, cap request volume with a rate limit, and enforce a dollar spend limit per team."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the gateway and Worker from "cache-responses"; check GET /api/progress/{studentId} first. Do not rely on the video clip to teach; you can mention `<origin>/courses/ai-gateway/cap-requests-and-spend` as an optional reference, and teach everything directly in chat.

  1. Teach the concepts first (why payment controls and ceilings exist):
     - **Why this matters**: humans aren't the only callers anymore—background jobs and autonomous agents call models in loops and have no concept of money. Without gateway ceilings, one runaway loop or one noisy team can burn through your budget or rate-limit the entire company.
     - **Two ways to pay third-party providers (Stored Keys vs. Unified Billing)**:
       - *Bring Your Own Keys (BYOK)*: store your OpenAI/Anthropic keys centrally in AI Gateway instead of scattering them across app repos; each provider bills you directly.
       - *Unified Billing*: load prepaid credits into Cloudflare and call models across providers on a single Cloudflare bill (provider token rates passed through with no markup, plus a 5% credit-purchase fee). Credential precedence is `request key → stored key → Unified Billing`, so a call is never double-billed. (They don't need to buy credits here since their lab uses Workers AI.)
     - **Two kinds of ceilings (Rate Limits vs. Spend Limits)**:
       - *Rate limits* cap the **number of requests** across the entire gateway in a window (`fixed` clock reset vs. `sliding` trailing window).
       - *Spend limits* cap **dollars spent** over a window and can be scoped to specific `metadata` values (like `team = "interns"` or `agent_id`), so an over-budget team gets `429` while other teams keep working.
     - Ask the student which of their two teams (e.g. `interns`) should get a tiny budget ceiling so we can watch it trip while the other team keeps working. Wait for their reply.

  2. Configure and verify the request rate limit and team-scoped spend limit:
     - Keep the per-call raw-response handling from "see-every-request": use `returnRawResponse: true`, return `429` only for a raw response whose `status === 429`, preserve other upstream HTTP error statuses (including `424` for Guardrails blocks), and use `502` for thrown errors or responses without a valid HTTP error status. Do not read `err.status` or a potentially stale `env.AI.lastRequestHttpStatusCode` in a generic catch. Use the response's `cf-aig-log-id` header when available (`null` for thrown errors). Confirm the cause in gateway logs before calling it a request or spend limit. Verify locally with a mocked AI binding: successful JSON, a limit response (`429`), non-limit responses (e.g. `401`, `404`, `500`), and a thrown transport error after a previous `429`. Only the limit response should become `429`.
     - `cf ai-gateway gateways update` replaces the gateway's whole configuration (the API is a `PUT`), so any setting left out of the command is reset. Before the first update in this exercise, run `cf ai-gateway gateways get <gateway-id>` and, if it shows settings the commands below don't include (for example `authentication`, `workers_ai_billing_mode`, `dlp`, or `logpush`), add them to the update with `--body` so you don't turn them off.
     - First, enable a tight sliding request rate limit (2 requests per 60 seconds):
       `cf ai-gateway gateways update <gateway-id> --collect-logs true --cache-ttl 0 --cache-invalidate-on-update true --rate-limiting-interval 60 --rate-limiting-limit 2 --rate-limiting-technique sliding`
       Allow for configuration propagation, then send a small burst of 3–4 requests and look for a `429`. Confirm `Rate limit exceeded` in gateway logs before reporting success. If it is not observed, inspect the configuration and logs instead of repeatedly sending requests or assuming a fixed propagation delay.
     - Next, reset the gateway-wide rate limit (`--rate-limiting-interval 0 --rate-limiting-limit 0`) and enable a tiny Spend Limit rule (`$0.00001` per 30-day window) scoped to their chosen team (e.g. `team = "interns"`):
       `cf ai-gateway gateways update <gateway-id> --body '{"collect_logs":true,"cache_ttl":0,"cache_invalidate_on_update":true,"rate_limiting_interval":0,"rate_limiting_limit":0,"rate_limiting_technique":"sliding","spend_limits":{"enabled":true,"rules":[{"id":"interns-monthly-budget","enabled":true,"limitType":"cost","limit":0.00001,"window":2592000,"technique":"fixed","metadata":{"team":{"mode":"filter","values":["interns"]}}}]}}'`
       Explain that all applicable spend rules are checked before forwarding to the provider, while the current request's cost is recorded after completion. Spend limits are eventually consistent, so concurrent requests can briefly overshoot. Do not promise a propagation time or assume one request exhausts the budget. Send one uncached `team: "interns"` request and inspect its recorded cost and matching rule in the gateway logs/dashboard. Once recorded cumulative spend reaches the configured budget, allow for propagation and make a follow-up `interns` request to check for `429`; confirm the spend-limit reason and rule in the logs, then check that an `escalations` request succeeds (`200`). If the expected block is not observed, inspect rule scope, recorded spend, and propagation before trying again; do not loop inference requests just to spend money. Show what was actually observed and explain any remaining uncertainty.
     - **Leave the spend limit active while the student replies** so they can try clicking **Ask through the gateway** on their lab page as `interns` (blocked) vs. `escalations` (allowed) if they want to see it live.
     - Ask the comprehension check: why is a metadata-scoped spend limit safer than a single gateway-wide rate limit when running autonomous agents, and why can a simultaneous burst of requests briefly overshoot a spend limit? Wait for their reply.

  3. Mark complete:
     - Disable the spend limit rule (`"spend_limits":{"enabled":false,"rules":[]}`) so the next exercise's routing tests aren't blocked, and let the student know you cleared the temporary ceiling.
     - Gently correct anything off in their answer, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes, and move on to "route-and-fall-back".

  Out of scope here: buying prepaid Unified Billing credits or configuring Stripe usage events.
---

# Cap requests and spend

<figure>
<video controls playsinline preload="none" width="1920" height="1080" crossorigin="anonymous" poster="/media/courses/ai-gateway/cap-requests-and-spend-poster.jpg">
<source src="/media/courses/ai-gateway/cap-requests-and-spend.mp4" type="video/mp4">
<track kind="captions" src="/media/courses/ai-gateway/cap-requests-and-spend-captions.vtt" srclang="en" label="English">
<a href="/media/courses/ai-gateway/cap-requests-and-spend.mp4">Watch the demo clip</a>.
</video>
<figcaption>Paying one bill with Unified Billing, capping request volume, and setting a per-team dollar Spend Limit. <a href="/media/courses/ai-gateway/cap-requests-and-spend.mp4">Direct video link</a></figcaption>
</figure>

People aren't the only ones calling your AI endpoints anymore — background jobs and autonomous agents call models in loops, and agents have no concept of money. Putting rate limits and dollar budgets in [AI Gateway](https://developers.cloudflare.com/ai-gateway/) blocks further requests from a runaway caller or an over-budget team with `429 Too Many Requests`, while leaving every other team working.

## What you'll build

A gateway-wide [request rate limit](https://developers.cloudflare.com/ai-gateway/features/rate-limiting/) and a metadata-scoped [spend limit](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) (`team = "interns"`) that blocks one team once its budget is spent while allowing `"escalations"` requests through.

## Prerequisites

- You've completed [Cache responses](/courses/ai-gateway/cache-responses) and still have that Worker and gateway.

## Two ways to pay: stored keys vs. Unified Billing

When your gateway calls third-party providers (like OpenAI, Anthropic, or Google), you can pay in two ways:

- **[Bring Your Own Keys (BYOK)](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/):** store your provider API keys centrally in the gateway instead of inside each app. Each provider bills your account with them directly.
- **[Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/):** load prepaid credits into your Cloudflare account and call models across providers on a single Cloudflare bill, without opening a separate account at every vendor. Provider token rates are passed through with no markup (credit purchases carry a 5% fee).

The gateway checks credentials in a fixed order — a key on the request, then a stored key, then Unified Billing credits — so each request is paid through one path and never double-billed.

## Two kinds of ceilings: rate limits and spend limits

You can cap traffic on your gateway by request count or by dollar spend:

- **Rate limiting** caps the **number of requests** the gateway accepts in a time window (for example, 60 requests per 60 seconds). A `fixed` window resets on the clock; a `sliding` window counts the trailing window whenever a request arrives.
- **Spend limits** cap **dollars spent** over a time window, and can be filtered or split by `metadata` keys (`team`, `user`, or `agent_id`):

```json title="Spend limit rule (team = interns)"
{
  "id": "interns-monthly-budget",
  "enabled": true,
  "limitType": "cost",
  "limit": 10,
  "window": 2592000,
  "technique": "fixed",
  "metadata": {
    "team": { "mode": "filter", "values": ["interns"] }
  }
}
```

Before forwarding a request to the provider, AI Gateway checks all applicable spend limit rules and blocks the request with `429` if any rule is over budget. The current request's cost is recorded after completion. Spend limits are eventually consistent, so concurrent requests can briefly overshoot the budget before enforcement catches up. This is a budget control, not a guarantee of an exact maximum bill. See [how spend limits work](https://developers.cloudflare.com/ai-gateway/features/spend-limits/#how-it-works).
