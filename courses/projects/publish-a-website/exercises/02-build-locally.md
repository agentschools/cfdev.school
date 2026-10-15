---
description: "Build the first real version of your site on your own machine, with real content and a 404 page, and iterate on it until you like it."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the project from "choose-your-stack"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md` for its stack and commands. Read this course's interview (GET /api/students/{id}/interviews): the first three answers are the brief.

  1. Build the pages and features they asked for, in the style they described. Write real content with them, drawn from their answers and from asking them, not lorem ipsum. Ask for anything only they know (their bio, project details, links) rather than inventing it. Keep what the site does within what the stack does well; if something they asked for needs a database or sign-in, build the static version and say plainly that it's a later step.
  2. Keep the dev server running and iterate: show the student each change in the browser, ask what they'd change, and make it. At least one round of changes must come from them. Teach the loop: edit, save, reload. Most dev servers reload on their own.
  3. Add a 404 page for paths that don't exist, with a real 404 status. How depends on the stack:
     - Plain HTML and CSS: add `public/404.html`. In `cloudflare.config.ts`, set `assets: { notFoundHandling: "404-page" }` on the worker and add `ASSETS: bindings.assets()` to `env`. In `src/index.ts`, have `fetch` return `env.ASSETS.fetch(request)`; run `cf workers types` first. Explain why both are needed: when a request matches a file, Cloudflare serves it without running the Worker at all. When nothing matches, it runs the Worker, so a Worker that returns its own response would hide the 404 page. Passing the request to `env.ASSETS` hands it back to the asset server, which applies `notFoundHandling` (https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).
     - Hono: `app.notFound((c) => c.html(<NotFound />, 404))`.
     - Astro and EmDash: `src/pages/404.astro`. For a static Astro site, also add `"not_found_handling": "404-page"` to `assets` in `wrangler.jsonc`; without it, a missing page is an empty 404. Check it with a build (`npx astro build`) and `npx wrangler dev`, since `npm run dev` doesn't use the Workers asset server.
     - vinext: `app/not-found.tsx`.
  4. Verify before completing. YOU must, against the local dev server:
     - fetch each page you built and confirm it has the content you wrote together;
     - fetch a path that doesn't exist and confirm a 404 status with their 404 page.
     Don't trust the student saying it worked.
  5. Comprehension check: ask the student what happens when they save a file while the dev server is running, and why nobody else can see the site yet. (The dev server rebuilds and the page reloads; it only runs on their machine.) Gently correct anything off.
  6. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "deploy".

  Out of scope here: deploying, databases, authentication, `_headers` and `_redirects` files, and SEO beyond a title and description per page.
---

# Build locally

Time to make the site you described. Your agent builds it with you on your own machine, where every change shows up as soon as you save, and nobody else can see it until you're ready.

## What you'll build

The first real version of your site: the pages and features you asked for, with real content about you or your project, in the style you described. Then you'll change what you don't like, as many rounds as you want. Pages that don't exist show your own 404 page.

## The loop

The dev server watches your files. Edit a page, save it, and reload the browser (most stacks reload it for you). It's the fastest way to try an idea, and nothing you do here touches the internet.

## Prerequisites

- You've completed [Choose your stack](/courses/publish-a-website/choose-your-stack) and still have that project on disk.
