---
description: "Pick the tools your site is built with, based on what you described, then scaffold the project and see it run on your machine."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Read this course's interview (GET /api/students/{id}/interviews) and Agent setup's. Teach as you go, pitched to their experience: for students who've used Vercel or Netlify, compare to what they know; for newcomers, keep it to what each choice means for them, not how the tools work inside. Every stack here runs on Cloudflare Workers. Never use Cloudflare Pages.

  1. Recommend one stack from the body's table, in a few sentences tied to their answers (what the site is, which pages and features, how they'll update it). Pick the simplest one that fits: plain HTML and CSS unless something they asked for needs more. A contact form or a bit of dynamic content doesn't need a framework; the Worker can handle it, and Hono makes that pleasant. Mention one alternative and what they'd trade. If they already know a framework from the table and it fits, prefer it. Let them choose; don't move on until they've confirmed.
  2. Scaffold it in a new directory, named after their site. Each stack's setup, tested with `cf` v1.0.0-beta.12:
     - Plain HTML and CSS: `cf init <directory>`. The template is a Vite project with a Worker in `src/index.ts` and no `public/` directory yet: create `public/index.html`. Files in `public/` are served as static assets.
     - Hono with JSX: `cf init <directory>`, then `npm i hono`. Rename `src/index.ts` to `src/index.tsx`, update the entrypoint import in `cloudflare.config.ts` to match, and add `"jsx": "react-jsx"` and `"jsxImportSource": "hono/jsx"` to `compilerOptions` in `tsconfig.json`. Replace the handler with a Hono app that renders a page with `c.html(<Page />)`, and `export default app`. Static files like stylesheets go in `public/`.
     - Astro: `npm create astro@latest <directory> -- --template minimal --install --no-git --yes`, then `npx astro add cloudflare --yes` in it. That writes a `wrangler.jsonc`. Astro 6 and later doesn't build with `cf` during the beta (https://developers.cloudflare.com/cf/get-started/first-worker/#start-from-an-existing-project), so this is a Wrangler project: develop with `npm run dev`, deploy with Wrangler. Never run `cf init .`, `cf dev`, `cf build`, or `cf deploy` in it: they ignore `wrangler.jsonc` and write a config that doesn't match. `cf` is still the tool for everything else (auth, domains, resources).
     - EmDash: `npm create emdash@latest <directory> -- --platform cloudflare --template <blog|starter|marketing|portfolio> --pm npm --install --no-sandboxed-plugins --yes`. It's Astro with a CMS (https://emdashcms.com/), so it's a Wrangler project too, with the same rule about `cf` project commands. Its `wrangler.jsonc` names the Worker, D1 database, and R2 bucket `my-emdash-site` and `my-emdash-media` whatever the directory is called: rename all three to match their site. It writes an `EMDASH_ENCRYPTION_KEY` to `.env`; tell them to back it up and never commit it. Leave sandboxed plugins off: they need Worker Loader, which is on Workers Paid. Follow its Cloudflare guide for anything beyond this (https://docs.emdashcms.com/deployment/cloudflare/).
     - vinext: `npx create-vinext-app@latest <directory> --platform cloudflare --use-npm --yes`. It writes a `cloudflare.config.ts` and uses `cf`. Develop with `npm run dev`. vinext is in beta (https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).
     Suggest `git init` and a first commit once it's scaffolded.
  3. Record the choice in a project instructions file: an `AGENTS.md` at the project root (Astro and EmDash create one; add a section to it instead of replacing it). Write down the stack and why it was chosen, the dev and deploy commands, and for Astro and EmDash, that this is a Wrangler project where `cf` project commands must not be run. Explain why: next session, any agent opens this project knowing how it works, without re-deciding.
  4. Start the dev server (`cf dev` for plain and Hono, `npm run dev` for the others) and have the student open the local URL it prints.
  5. Verify before completing. YOU must fetch the local URL and confirm a 200 with the scaffolded page. Don't trust the student saying it worked.
  6. Comprehension check: ask the student why you picked this stack for their site, in their own words. Gently correct anything off.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "build-locally".

  Out of scope here: databases, authentication, and anything the site doesn't need yet. If a student wants a stack that isn't in the table, it's fine if it deploys to Workers (https://developers.cloudflare.com/workers/framework-guides/), but say you'll be working without this course's tested steps.
---

# Choose your stack

A stack is the set of tools your site is built with. There's no single right one: a three-page personal site and a blog you post to every week want different things. Your agent recommends one based on what you described, explains why, and you decide.

## The options

Every one of these runs on [Cloudflare Workers](https://developers.cloudflare.com/workers/), and none of them is the wrong choice.

| Stack              | Good for                                                                          |
| ------------------ | --------------------------------------------------------------------------------- |
| Plain HTML and CSS | A few pages that don't change often. Nothing to learn but the web itself.         |
| Hono with JSX      | Pages your Worker renders on each request, forms, and small dynamic features.     |
| Astro              | Content sites: blogs, portfolios, docs. Static pages, with room for dynamic ones. |
| EmDash             | A site you edit in an admin panel, like WordPress. Built on Astro.                |
| vinext             | App-like sites in React, or if you already know Next.js. In beta.                 |

More about each: [Hono](https://hono.dev/), [Astro](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [EmDash](https://emdashcms.com/), and [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).

Simpler is usually better. You can start with plain HTML and add a Worker route for the one dynamic thing you need, without switching to a framework.

## What you'll build

A new project for your site, scaffolded with the stack you chose, running on your machine. Your agent also writes down the choice in an `AGENTS.md` file in the project, so any agent that opens it later knows how it's built.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).
