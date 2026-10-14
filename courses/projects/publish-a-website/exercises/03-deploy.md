---
description: "Publish your site on Cloudflare, at a workers.dev URL you can share, and learn which requests run your Worker."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the project from "build-locally"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md` for its stack and commands. Teach as you go, pitched to Agent setup's interview: for students who've deployed to Vercel or Netlify, it's the same idea, with static files and code deployed together as one Worker. If they've completed the Workers course, skip re-explaining what a Worker is and `cf deploy`'s basics.

  1. Check they're signed in. For `cf` projects (plain, Hono, vinext), `cf auth whoami` must report `"authenticated": true`; if not, `cf auth login`. Astro and EmDash deploy with Wrangler, which doesn't share `cf`'s login (https://developers.cloudflare.com/cf/wrangler/): run `npx wrangler login` once, and check with `npx wrangler whoami`.
  2. Deploy:
     - `cf` projects: `cf deploy`.
     - Astro: `npx astro build && npx wrangler deploy`.
     - EmDash: `npm run deploy` (it runs `astro build && wrangler deploy`). The first deploy creates its D1 database and R2 bucket. A new EmDash site's setup wizard is open to whoever visits first, so have the student open `<url>/_emdash/admin/` and finish setup right away. Their local site's content stays local: production has its own database.
     If Wrangler stops with "More than one account available", add `"account_id"` to `wrangler.jsonc` (their account ID is in `npx wrangler whoami`), not an environment variable, so it sticks.
     Give them the `*.workers.dev` URL the deploy prints, and add the deploy command to the project's `AGENTS.md` if it isn't there.
  3. Verify before completing. YOU must, against the deployed URL:
     - fetch `/` and confirm it's their home page (check for text you wrote together);
     - fetch one stylesheet or image path and confirm a 200;
     - fetch a path that doesn't exist and confirm a 404 status with their 404 page (for EmDash, skip this until setup is done).
     A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong. Don't trust the student saying it worked.
  4. Teach the body's "Which requests run your Worker" section, pitched to their stack: a plain or static Astro site is almost all static assets; Hono and vinext render pages in the Worker; EmDash runs the Worker for its pages and admin.
  5. Have them change something small, redeploy, and reload the live URL, so the edit and deploy loop clicks.
  6. Comprehension check: ask the student which requests to their site run the Worker, and which don't. Gently correct anything off.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "add-a-domain".

  Out of scope here: preview deployments, CI, environments (`--mode`), and rollbacks. Mention that they exist if the student asks.
---

# Deploy

Your site works on your machine. Now it goes on the internet, at a `*.workers.dev` URL anyone can visit.

## What you'll build

Your site, live on Cloudflare's network as a [Worker](https://developers.cloudflare.com/workers/), with its files served as [static assets](https://developers.cloudflare.com/workers/static-assets/). Then you'll change something, deploy again, and see the change live.

## Which requests run your Worker

When a request matches a file, like a page you built ahead of time, a stylesheet, or an image, Cloudflare serves it straight from its network, close to the visitor, without running any of your code. Those requests are free and unlimited ([billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)).

Everything else runs your Worker: pages it renders on each request, API routes, and paths that don't match a file. Only those count toward [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), and the free plan includes 100,000 a day.

## Why it matters

Your site's files and its code deploy together, as one Worker. There's no separate server to keep running, nothing to keep in sync, and a small site can stay on the free plan.

## Prerequisites

- You've completed [Build locally](/courses/publish-a-website/build-locally) and still have that project on disk.
