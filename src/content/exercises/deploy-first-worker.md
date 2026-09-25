---
exerciseSlug: deploy-first-worker
---

Time to ship something real. In this exercise you'll create a minimal [Cloudflare Worker](https://developers.cloudflare.com/workers/) that returns plain text, run it on your machine, deploy it to your own account, and open it on the public internet. Your agent will walk you through every step.

## What you'll build

A single Worker whose `fetch` handler returns a short text response (something like "Hello from Cloudflare Dev School"), live at a `.workers.dev` URL. No frameworks, no database, no custom domain — just the create → run locally → deploy → visit loop. Once it works, you'll change the text, redeploy, and hit the URL again so the edit → deploy cycle clicks.

## Prerequisites

Your agent can help you with any of these.

- [Node.js](https://nodejs.org) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- Wrangler authenticated against that account (`npx wrangler whoami`).
