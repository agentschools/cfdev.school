# Optional Pi Durable course rehearsal

This first milestone covers the **Build a drawing game interview only**. It captures the website's actual enrollment prompt, feeds that prompt unchanged to Pi Durable, answers the four expected questions as a canned student, and independently checks interviews, progress, live UI, the next link, and reload persistence. It does not build a canvas or run Clef, deploy a student app, or simulate a full course pass.

## What is implemented and what was verified

- Real Pi Durable 1.4.0, hosted in a separate Cloudflare Durable Object, with SQLite storage and one real `school_http` tool. No coding CLI or shell is supplied in this milestone.
- The published gateway catalog includes `claude-sonnet-5-5`, provider `cloudflare-ai-gateway`, API `anthropic-messages`. It is a different identifier from the Cloudflare catalog's `anthropic/claude-sonnet-5.5`.
- The Worker bundles and starts in local workerd. Service binding connects to the isolated school. No hosted deployment has been made.
- Credential-free tests verify the request policy, canned student behavior, and actual Pi Durable SQLite reopen/submission deduplication with a **simulated model**.
- The browser observer passed against the actual school Worker with explicitly **scripted interview/progress writes**. It captured the real prompt and checked WebSocket-driven completion and reload. This is an observer smoke test, not evidence that Sonnet taught the interview.
- Live Sonnet execution is blocked on gateway access. Existing Wrangler OAuth verified the personal account, but listing its gateways returned HTTP 403 / Cloudflare 10000 Authentication error. No gateway was created, no credentials were created, no paid inference ran, and $0 of the $5 spike allowance has been used by this prototype.

## Run the isolated school

From the repository root:

```sh
npm ci
npm run rehearsal:test
npm run rehearsal:typecheck
npm run build
node scripts/rehearsal/prepare.mjs
npx wrangler d1 migrations apply cloudflare-dev-school-rehearsal -c dist/server/rehearsal.wrangler.json --local --persist-to .rehearsal/state
npx wrangler dev -c dist/server/rehearsal.wrangler.json --local --port 8788 --local-upstream 127.0.0.1:8788 --persist-to .rehearsal/state
```

`prepare.mjs` creates a local copy of the built config, strips routes/account ID, and replaces production D1/KV identifiers with dummy local ones. **Do not deploy this generated config or use the existing PR preview**: existing previews share production storage. `--local-upstream` keeps generated course URLs on the rehearsal origin.

In another terminal:

```sh
npx playwright install chromium
npm run rehearsal:observe
# Optional observer smoke test; no Pi, gateway or model calls:
REHEARSAL_MODE=simulated npm run rehearsal:observe
```

The observer launches a fresh anonymous headless context, never the user's shared GUI. `REHEARSAL_CHROME` can select an existing Chrome executable. Browser Run is optional future work: it requires authorized Browser Run access plus a reachable isolated school. It was neither needed nor used here.

Artifacts go to `.rehearsal/artifacts`: exact copied prompt, progress/interview snapshots, screenshots, Playwright trace, student answers and Pi transcript/results when live. `report.json` explicitly distinguishes `observe-only`, `simulated` and `live`. Simulated records exist only in the disposable local database. After credential-free checks, stop the server and remove `.rehearsal/state` to remove those school records. Never delete `pi-state` after a paid attempt without reconciling the spike budget.

## Live Pi interview: access and budget prerequisites

The separately authorized ceiling for this individual spike is **$5 total gateway/model billing**, not a per-run allowance and not authorization for infrastructure charges, top-ups or credential creation. The proposed dedicated gateway is `cfds-course-rehearsal-spike`. Before any live request, an authorized operator must:

1. Create/verify it on the verified personal account using existing sufficient access. The current OAuth token cannot do this. Creating a new token or expanding persistent access needs separate action-time confirmation; do not silently refresh scopes.
2. Require gateway authentication, enable Unified Billing fallback, ensure there is no applicable default Anthropic BYOK key, and verify existing credit availability without purchasing credits or changing auto-top-up.
3. Disable gateway retries and fallbacks; set a gateway-wide spend rule below the $5 ceiling (suggest $3 over the spike's window) and a low rate limit. Read back the settings. Gateway spend limits are eventually consistent and are **not** a hard dollar ceiling. Stop using this gateway after the spike; do not let a rolling window renew the allowance.
4. Verify the exact model and current rates. On 2026-10-28 the official Cloudflare catalog and installed Pi catalog agreed on $2/M input, $10/M output, $0.20/M cache read and $2.50/M cache creation. No model substitution is allowed. Account-specific serving availability and billing have not been demonstrated by an inference call.
5. Put only a separately authorized existing gateway token in ignored `scripts/rehearsal/.dev.vars` as `CF_AIG_TOKEN`. Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_GATEWAY_ID`, and `UNIFIED_BILLING_CONFIRMED="true"` there after verifying steps 1-4. Do not put vendor credentials there. The confirmation flag is an operator attestation, not an API verification of billing.

Then start the separate runner and observer:

```sh
npx wrangler dev -c scripts/rehearsal/wrangler.jsonc --local --port 8790 --persist-to .rehearsal/pi-state
REHEARSAL_MODE=live npm run rehearsal:observe
```

The runner uses exactly one DO name and one persisted request counter across all student turns in this spike. It admits **12 requests maximum**, reserves $0.25 before each HTTP dispatch without refunding failures/unknown outcomes, limits serialized input to 50 KB of text-only content, forces 2,048 output tokens, allows only the selected model/endpoint, refuses redirects, and disables SDK/harness retries and compaction. Maximum reserved allowance is $3, leaving $2 headroom within the authorized $5. This is a deliberately conservative admission envelope at the verified rates; it is not a provider bill or a guarantee against a changed provider price. Reconcile usage against the gateway. Do not delete state, change the DO name, start another machine with a fresh ledger, or repeat jobs to get another allowance.

There are at most four student submissions. An unknown student question blocks for transcript inspection instead of inventing an answer. A lost response is not automatically retried; GET the runner to inspect saved session/transcript/counter first. The live observer refuses an existing session to prevent accidental repeat spending. The local-only runner is not a public service and has no deploy command. Hosted use needs authentication, separate school bindings, a shared budget authority, lifecycle recovery and cleanup before it is enabled.

## Manual CI

`.github/workflows/course-rehearsal.yml` exposes `workflow_dispatch` with PR number, expected full head SHA, and credential-free observer mode. Controller code comes from main; the selected school is checked out separately. No Cloudflare/model secrets enter PR code. Forks and changed heads are rejected. It does not use `pull_request` triggers, deploy, or run live inference. Enabling paid dispatches before adding a shared persistent spike ledger would let fresh jobs reset the allowance, so **live mode is deliberately absent from this workflow**. The workflow becomes dispatchable after it exists on the default branch.

The draft spike commit uses `[skip ci]` to avoid the repository's existing automatic preview deployment and its production-D1 migration step. Local lint/tests/build provide the recorded validation; hosted Actions have not validated this new manual workflow.

## Sources and remaining work

- [Pi Cloudflare reference implementation](https://github.com/earendil-works/pi-durable-cloudflare/tree/dcb56ce2d174babb3f00112ac5b8cd597e58ab45) and [Pi Durable source](https://github.com/earendil-works/pi/tree/main/packages/durable).
- [Pi model identifier](https://pi.dev/models/cloudflare-ai-gateway/claude-sonnet-5-5), [Cloudflare model/rates](https://developers.cloudflare.com/ai/models/anthropic/claude-sonnet-5.5/), [Unified Billing precedence](https://developers.cloudflare.com/ai-gateway/features/unified-billing/), [spend-limit consistency](https://developers.cloudflare.com/ai-gateway/features/spend-limits/).
- Wrangler 4.128's workerd supports dates only through 2026-09-07, so the runner pins that compatibility date; a 2026-10-28 date failed startup. No repo-wide tool upgrade was made.
- Next evidence needed: real gateway authentication/Unified Billing and one real interview, deployed Pi Durable recovery, then a separately authorized coding sandbox for the canvas milestone. Clef inference, physical touch testing, Browser Run, payment simulations and multi-harness comparisons remain out of scope.
