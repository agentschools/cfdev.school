---
description: "Give your site a guestbook: a form that saves what visitors write to a D1 database, through a small API in your Worker."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the site from "put-your-site-online"; check GET /api/progress/{studentId} first. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). If they've completed the Bindings course, skip re-explaining bindings and point out that `env.DB` is one. A guestbook fits most personal and project sites; if it doesn't fit theirs, adapt the wording (e.g. "leave a note" or "request an invite"), but keep the same shape: visitors submit a short entry, and the page lists recent ones.

  1. Declare the database: add `DB: bindings.d1()` to `env` in `cloudflare.config.ts`, with no `id`. Like a KV namespace, `cf deploy` creates the database the first time (named `<worker>-db`). Run `cf workers types`.
  2. Write the schema as a migration: `cf d1 migrations create "create entries"` makes `migrations/0001_create_entries.sql`. Fill it with a `CREATE TABLE entries` with an autoincrementing `id`, `name`, `message`, and `created_at`. Explain migrations: numbered SQL files, applied in order, each only once, so the schema can change later without losing data (https://developers.cloudflare.com/d1/reference/migrations/).
  3. Add the API to `src/index.ts`, before the `env.ASSETS.fetch(request)` fallback: `GET /api/entries` returns the latest entries (`env.DB.prepare("SELECT ... ORDER BY id DESC LIMIT 50").all()`), and `POST /api/entries` inserts one from a JSON body, with `?` placeholders and `.bind()`, never string concatenation, and with length limits on both fields. These paths don't match any file, so they reach the Worker.
  4. Add the guestbook to a page: a form that `POST`s to `/api/entries` with `fetch()`, and a list filled from `GET /api/entries`. Set entries with `textContent`, never `innerHTML`: visitors write them.
  5. Deploy with `cf deploy`. The output shows `cf` creating the database and its ID. The table doesn't exist yet: apply the migration to the deployed database with `cf d1 migrations apply <database id>` (it takes the ID, not the name).
  6. For local development, add that `id` to the binding (`bindings.d1({ id: "..." })`), then apply the migration to the local database too: `cf d1 migrations apply <database id> --local --persist-to .cloudflare/state`. `--persist-to` points it at the project's local state, which `cf dev` uses; without it, `cf dev` reports `no such table: entries`. The command asks for confirmation; run it with stdin closed (`< /dev/null`) so it takes the default (yes) instead of waiting. In `cf` v1.0.0-beta.12 the local apply also doesn't exit after printing its result, so run it in the background (or in a terminal the student can stop with Ctrl+C), and stop it once it prints each migration with a ✅. Then `cf dev` works with its own local copy of the data.
  7. Verify before completing. YOU must, against the deployed URL:
     - `POST /api/entries` a test entry, then in a separate request `GET /api/entries` and confirm it's there;
     - fetch the page with the guestbook and confirm the form is in it.
     Then have the student sign it from their browser. Don't trust the student saying it worked.
  8. Teach the point, briefly:
     - D1 is a SQL database (SQLite) that your Worker reaches through its binding, with no connection string or password in the code (https://developers.cloudflare.com/d1/).
     - Local dev and production have separate data, so experiments never touch the real guestbook.
     - If they took the Durable Objects course: D1 is one database for the whole site, good for queries across everything, while each Durable Object has its own.
  9. Comprehension check: ask the student why the API uses `?` placeholders and the page uses `textContent` for entries. (Both keep what visitors type from being run as code: SQL injection on the server, HTML injection in the browser.) Gently correct anything off.
  10. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "use-your-own-domain".

  Out of scope here: spam protection (mention Turnstile in a sentence if they ask), moderation, D1 read replication, and ORMs.
---

# Add a guestbook

A static site can't remember anything a visitor does. To let people leave a note, your site needs somewhere to store it and a bit of code to take it in.

## What you'll build

A guestbook on your site: a form where visitors leave their name and a short message, and a list of the latest entries. The entries live in a [D1](https://developers.cloudflare.com/d1/) database, and your Worker serves a small API for them alongside your static pages.

## Prerequisites

- You've completed [Put your site online](/courses/publish-a-website/put-your-site-online) and still have that project on disk.
