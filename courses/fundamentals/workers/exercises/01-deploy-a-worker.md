---
description: "Create a minimal Worker that returns a text response, run it locally, deploy it to your Cloudflare account, and visit its public URL."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  You do the work: scaffolding, edits, commands, deploys. The student makes the choices, predicts, and reviews: wherever a step below says to ask the student something, ask, then end your turn and wait for their reply; don't run ahead to the next step in the same turn. Keep each pause short. If the student says "just do it" or similar, speed up for the rest of the exercise, but still show them the handler (step 2) and do the change-and-redeploy step (step 6).

  Adapt how much you explain to their interview answers (GET /api/students/{id}/interviews: Agent setup's agent experience and where they've deployed before, plus this course's own): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know; Cloudflare users get the mechanics without the basics. Experience changes how much you explain, never whether the student makes the choices and predictions. Don't lecture.

  1. Choose: ask the student two things in one message: a name for the Worker (lowercase letters, numbers, and dashes; it becomes the directory, the Worker's name, and part of its workers.dev URL), and the text it should return. If they leave either to you, use `hello-worker` and "Hello from Cloudflare Dev School". If a directory with that name already exists (e.g. they're redoing this exercise), say so and suggest another name. Wait for their answer.
  2. Create: scaffold it with `cf init <name>`, which creates a hello-world Worker with a `cloudflare.config.ts` config, then change the response to their text. Keep it the simplest possible project: a single Worker script, no framework, no database, no custom domain. Show the student the `fetch` handler (the few lines in `src/index.ts`) and explain what a Worker is (a function that runs on Cloudflare's network, close to whoever visits it) and what the `fetch` handler does (it receives a request and returns a response).
  3. Run locally: start the local dev server with `cf dev` and confirm the local URL it prints returns their text. Give them the local URL to open too.
  4. Predict, then deploy: before deploying, ask the student what they expect to happen: where the Worker will be reachable and what someone visiting it will see. Wait for their answer. Then deploy to the student's own Cloudflare account with `cf deploy`, using their `cf` auth from the CLI exercise in the Agent setup course. If `cf auth whoami` doesn't report `"authenticated": true`, help them run `cf auth login` first. Compare what happened to their prediction, and explain what deploying did: the same code that ran locally now runs on Cloudflare's network, and the workers.dev URL `cf deploy` prints is its public address.
  5. Verify: YOU must fetch the deployed URL (e.g. with curl or fetch) and confirm the response body matches their text. Do not trust the student saying it worked; check it yourself. A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong. Then give the student the URL to open.
  6. Change and redeploy: ask the student what the Worker should say instead. Wait for their answer, change the text, redeploy, and fetch the URL again to confirm the new text is live. Have them reload the URL in their browser, so the edit → deploy loop clicks: one command, and the new version serves everyone who visits.
  7. Comprehension check: in its own message, ask the student to explain in their own words what happens when someone visits their URL (a request hits their Worker's `fetch` handler on Cloudflare's network, which returns the response). Don't put the answer in the same message, and wait for their reply before saying whether it's right. Gently correct anything off. Verification is the gate, not their answer.
  8. Mark complete: only after verification succeeds, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes. Never invent other progress endpoints. Tell the student this same Worker is what the next exercise ("add-a-binding", a Workers KV binding) builds on.

  Out of scope for this exercise: frameworks (Astro, Next, Hono apps beyond a trivial handler), D1/R2 bindings, custom domains, and additional exercises. If the student asks, say those come later and stay focused on the basic loop.
---

# Deploy a Worker

Time to ship something real. In this exercise you'll create a minimal [Cloudflare Worker](https://developers.cloudflare.com/workers/) that returns plain text, run it on your machine, deploy it to your own account, and open it on the public internet. Your agent does the typing; you make the calls.

## What you'll build

A single Worker whose `fetch` handler returns a short text response, live at a `.workers.dev` URL. No frameworks, no database, no custom domain, just the create → run locally → deploy → visit loop.

You choose the Worker's name and what it says, and your agent shows you the handler it writes. Before it deploys, you'll predict where your Worker will end up and what visitors will see. Once it's live, you'll pick new text and watch it redeploy, so the edit → deploy cycle clicks.

## Prerequisites

Your agent can help you with any of these.

- [Node.js](https://nodejs.org) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) authenticated against that account (`cf auth whoami`).
