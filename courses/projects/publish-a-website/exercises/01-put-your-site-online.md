---
description: "Build the site you described, with a real 404 page, and publish it on Cloudflare as a Worker with static assets."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Read this course's interview (GET /api/students/{id}/interviews) and build the site they described. Teach as you go, pitched to Agent setup's interview: for students who've deployed to Vercel or Netlify, this is the same idea as a static site there, with a Worker alongside for anything dynamic. If they've completed the Workers course (GET /api/progress/{studentId}), skip re-explaining what a Worker is and `cf deploy`'s basics.

  1. Scaffold a project with `cf init <directory>`. The template is a Vite project with a Worker in `src/index.ts`. Files in `public/` become static assets, served as-is from Cloudflare's network.
  2. Build the site in `public/`: an `index.html` and a stylesheet at least, plus whatever pages fit what they described. Write real content with them, drawn from their interview answer, not lorem ipsum. Keep it plain HTML and CSS unless they ask for a framework; the point is publishing, not tooling. Also add a `404.html`.
  3. Make missing pages show the 404 page, with a real 404 status:
     - In `cloudflare.config.ts`, set `assets: { notFoundHandling: "404-page" }` on the worker and add `ASSETS: bindings.assets()` to `env`.
     - In `src/index.ts`, have `fetch` return `env.ASSETS.fetch(request)`. Run `cf workers types` first.
     Explain why both are needed: when a request matches a file, Cloudflare serves it without running the Worker at all. When nothing matches, it runs the Worker, so a Worker that returns its own response would hide the 404 page. Passing the request to `env.ASSETS` hands it back to the asset server, which applies `notFoundHandling` (https://developers.cloudflare.com/workers/static-assets/routing/worker-script/). The next exercise uses the Worker for the guestbook's API.
  4. Preview it with `cf dev` and have the student open it in their browser.
  5. Deploy with `cf deploy`, and give them the `*.workers.dev` URL.
  6. Verify before completing. YOU must, against the deployed URL:
     - fetch `/` and confirm it's their `index.html` (check for text you wrote together);
     - fetch the stylesheet's path and confirm a 200;
     - fetch a path that doesn't exist and confirm a 404 status with the `404.html` content.
     A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong. Don't trust the student saying it worked.
  7. Teach the point, briefly:
     - Requests for static assets are free and unlimited, and they're served from Cloudflare's network close to each visitor (https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/). Only requests that reach the Worker count toward Workers pricing.
     - Assets and code deploy together as one Worker, so the site and its API can't drift apart.
  8. Comprehension check: ask the student which requests to their site run the Worker, and which don't. Gently correct anything off.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "add-a-guestbook".

  Out of scope here: frameworks and static site generators (mention that Astro, Next.js, and others deploy to Workers too if they ask), `_headers` and `_redirects` files, and single-page app routing.
---

# Put your site online

Time to build the site you described and put it on the internet. Your agent writes it with you, from real content about you or your project, and publishes it on Cloudflare.

## What you'll build

A site made of HTML and CSS files, served as [static assets](https://developers.cloudflare.com/workers/static-assets/) from Cloudflare's network, at a `*.workers.dev` URL you can share. Pages that don't exist show your own 404 page.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).
