---
description: "Build your guestbook's form and list, with a small API that keeps entries in memory for now."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Read this course's interview (GET /api/students/{id}/interviews) for where the guestbook lives and how it should feel. Teach as you go, pitched to Agent setup's interview.

  Set up the project first:
  - On their Publish a website site: open that project and read its `AGENTS.md` for the stack and commands. If it's Astro or EmDash, it's a Wrangler project: never run `cf init .`, `cf dev`, `cf build`, or `cf deploy` in it.
  - In another app: open it, find out how it's built and deployed, and fit in with it. If it has no `AGENTS.md`, offer to write one as you go.
  - In a new Worker: `cf init <directory>`, then write an `AGENTS.md` that says what it is and how to run and deploy it.

  1. Add the API, wherever routes go in their stack: `GET /api/entries` returns the latest entries, newest first, and `POST /api/entries` takes a JSON `{ name, message }`, trims both, rejects empty ones with a 400, and caps their length (e.g. 50 and 500 characters). For now, keep entries in an array at module scope. Where routes go:
     - A Worker from `cf init` (plain sites and new Workers): check the path in `fetch` before anything else. If the site's `fetch` hands requests to `env.ASSETS.fetch(request)`, keep that as the fallback.
     - Hono: `app.get` and `app.post`.
     - Astro and EmDash: `src/pages/api/entries.ts` exporting `GET` and `POST`, with `export const prerender = false;` so it runs on each request.
     - vinext: `app/api/entries/route.ts` exporting `GET` and `POST`.
  2. Add the guestbook to a page, in the style they described: a form that `POST`s to `/api/entries` with `fetch()`, and a list filled from `GET /api/entries` (refreshed after each post). Set each entry's text with `textContent` (or the framework's normal escaping, never `innerHTML` or `dangerouslySetInnerHTML`): visitors write these, so anything they type must show as text, never run as HTML.
  3. Run it locally and have the student sign it from their browser a few times.
  4. Verify before completing. YOU must, against the local dev server:
     - `POST /api/entries` an entry, then in a separate request `GET /api/entries` and confirm it's there;
     - `POST` an entry whose message is `<b>hi</b>`, and confirm the page shows the tags as text (check the page's code, or ask the student what they see);
     - restart the dev server, `GET /api/entries` again, and confirm the entries are gone. Show the student.
     Don't trust the student saying it worked.
  5. Teach the body's "Why the entries disappear" section, using what they just saw. Don't deploy this version: in production, entries would appear and vanish depending on which copy of the Worker answered.
  6. Comprehension check: ask the student why a variable in their Worker isn't a good place to keep entries. Gently correct anything off.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "connect-a-database".

  Out of scope here: storage (that's the next exercise), moderation, sign-in, and pagination.
---

# Build the UI

Every guestbook has the same two parts: a form where visitors leave their name and a message, and a list of what people have written. In this exercise you'll build both, plus a small API between them.

## What you'll build

A guestbook on your site, in the style you described, backed by two routes: `POST /api/entries` to sign it and `GET /api/entries` to read it. For now the entries live in your Worker's memory, which works on your machine, until it doesn't.

## Text, not HTML

Anyone can type anything into your form, including HTML or a `<script>` tag. Your page puts each entry on the screen as plain text (with `textContent`, or your framework's normal escaping), so whatever someone types shows up as text and never runs in another visitor's browser.

## Why the entries disappear

Restart the dev server and the entries are gone. A Worker isn't a server that stays running: Cloudflare starts copies of it wherever requests arrive, runs as many as it needs, and stops them when they're idle. A variable lives in one copy, for as long as that copy runs. To keep entries, you need storage that every copy can reach, and that's the next exercise.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).
- A site or app to add the guestbook to, or nothing: your agent can start a new Worker for it.
