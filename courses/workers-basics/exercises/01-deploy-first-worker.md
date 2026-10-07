---
description: "Create a minimal Worker that returns a text response, run it locally, deploy it to your Cloudflare account, and visit its public URL."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Teach lightly as you go. Adapt depth to their interview answers (agentExperience, platformsUsed): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know; Cloudflare users can skip straight to the mechanics. Don't lecture.

  1. Create: help them scaffold a minimal Worker that returns a plain-text response (e.g. "Hello from Cloudflare Dev School"). Use `cf init <directory>` to scaffold it (it creates a hello-world Worker with a `cloudflare.config.ts` config), then edit the response text. Keep it the simplest possible project — a single Worker script, no framework, no database, no custom domain. Explain what a Worker is (a function that runs on Cloudflare's network, close to whoever visits it) and what the `fetch` handler does (it receives a request and returns a response).
  2. Run locally: start the local dev server with `cf dev` and confirm the local URL it prints returns the expected text.
  3. Deploy: deploy to the student's own Cloudflare account with `cf deploy`, using their `cf` auth from the CLI exercise in the Agent setup course. If `cf auth whoami` doesn't report `"authenticated": true`, help them run `cf auth login` first. Explain what deploying did: the same code that ran locally now runs on Cloudflare's network, and the workers.dev URL `cf deploy` prints is its public address.
  4. Visit: open the public workers.dev (or other) URL `cf deploy` prints.
  5. Verify before completing: YOU must fetch the deployed URL (e.g. with curl or fetch) and confirm the response body matches the expected text. Do not trust the student saying it worked — check it yourself.
  6. Comprehension check: before marking complete, ask the student to explain in their own words what happens when someone visits their URL (a request hits their Worker's fetch handler on Cloudflare's network, which returns the response). Gently correct anything off. The URL verification above is the gate, not their answer.
  7. Mark complete: only after verification succeeds, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes. Never invent other progress endpoints.
  8. Afterward: encourage the student to change the response text, redeploy, and hit the URL again so they feel the edit → deploy loop. This same Worker is what the next exercise (adding a Workers KV binding) builds on.

  Out of scope for this exercise: frameworks (Astro, Next, Hono apps beyond a trivial handler), D1/R2 bindings, custom domains, and additional exercises. If the student asks, say those come later and stay focused on the basic loop.
---

# Deploy your first Worker

Time to ship something real. In this exercise you'll create a minimal [Cloudflare Worker](https://developers.cloudflare.com/workers/) that returns plain text, run it on your machine, deploy it to your own account, and open it on the public internet. Your agent will walk you through every step.

## What you'll build

A single Worker whose `fetch` handler returns a short text response (something like "Hello from Cloudflare Dev School"), live at a `.workers.dev` URL. No frameworks, no database, no custom domain — just the create → run locally → deploy → visit loop. Once it works, you'll change the text, redeploy, and hit the URL again so the edit → deploy cycle clicks.

## Prerequisites

Your agent can help you with any of these.

- [Node.js](https://nodejs.org) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) authenticated against that account (`cf auth whoami`).
