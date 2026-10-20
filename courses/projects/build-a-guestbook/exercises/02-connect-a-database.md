---
description: "Save your guestbook's entries in a database so they last and every visitor sees the same ones."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the guestbook from "build-the-ui"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md` for its stack and commands. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). If they've completed the Bindings course, skip re-explaining bindings and point out that `env.DB` is one.

  1. Declare the database:
     - `cf` projects: add `DB: bindings.d1()` to `env` in `cloudflare.config.ts`, with no `id`. Like a KV namespace, `cf deploy` creates the database the first time (named `<worker>-db`). Run `cf workers types`.
     - Wrangler projects (Astro, EmDash): add a `d1_databases` entry to `wrangler.jsonc` with `"binding": "GUESTBOOK_DB"` and a `database_name` like `<site>-guestbook`; `wrangler deploy` creates it by name. EmDash already has a `DB` binding for its own content: keep the guestbook in its own database, so EmDash's migrations and backups never touch it. Read it in code with `import { env } from "cloudflare:workers"`.
  2. Write the schema as a migration: `cf d1 migrations create "create entries"` (Wrangler projects: `npx wrangler d1 migrations create <database_name> create_entries`) makes `migrations/0001_create_entries.sql`. Fill it with a `CREATE TABLE entries` with an autoincrementing `id`, `name`, `message`, and `created_at`. Explain migrations: numbered SQL files, applied in order, each only once, so the schema can change later without losing data (https://developers.cloudflare.com/d1/reference/migrations/). The next exercise adds one.
  3. Replace the in-memory array in both routes: `GET` runs `SELECT ... ORDER BY id DESC LIMIT 50` with `.all()`, and `POST` inserts with `?` placeholders and `.bind()`, never string concatenation. Keep the length limits.
  4. Deploy, then apply the migration to the deployed database:
     - `cf` projects: `cf deploy`. The output shows `cf` creating the database and its ID. Apply with `cf d1 migrations apply <database id>` (it takes the ID, not the name).
     - Wrangler projects: deploy as the project's `AGENTS.md` says, then `npx wrangler d1 migrations apply <database_name> --remote`.
  5. Set up local development:
     - `cf` projects: add the `id` to the binding (`bindings.d1({ id: "..." })`), then `cf d1 migrations apply <database id> --local --persist-to .cloudflare/state`. `--persist-to` points it at the project's local state, which `cf dev` uses; without it, `cf dev` reports `no such table: entries`. The command asks for confirmation; run it with stdin closed (`< /dev/null`) so it takes the default (yes) instead of waiting. In `cf` v1.0.0-beta.12 the local apply also doesn't exit after printing its result, so run it in the background (or in a terminal the student can stop with Ctrl+C), and stop it once it prints each migration with a ✅.
     - Wrangler projects: `npx wrangler d1 migrations apply <database_name> --local`.
     Add the migration commands to the project's `AGENTS.md`.
  6. Verify before completing. YOU must:
     - locally, `POST` an entry, restart the dev server, and confirm `GET /api/entries` still has it;
     - against the deployed URL, `POST /api/entries` a test entry, then in a separate request `GET /api/entries` and confirm it's there;
     - fetch the deployed page with the guestbook and confirm the form is in it.
     Then have the student sign it from their browser. A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong. Don't trust the student saying it worked.
  7. Teach the body's "Why it matters" section, briefly. If they took the Durable Objects course: D1 is one database for the whole site, good for queries across everything, while each Durable Object has its own.
  8. Comprehension check: ask the student why the API uses `?` placeholders. (So what visitors type is always data, never part of the SQL: it stops SQL injection.) Gently correct anything off.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "moderate-messages".

  Out of scope here: moderation (next exercise), D1 read replication, ORMs, and pagination.
---

# Connect a database

Your guestbook works until the server restarts. To keep entries, and to make sure every visitor sees the same ones, they need to live in a database.

## What you'll build

The same guestbook, with its entries stored in [D1](https://developers.cloudflare.com/d1/), Cloudflare's SQL database. You'll write the table as a migration, point both routes at it, and deploy, so the guestbook is live for real.

## A table, as a migration

A migration is a numbered SQL file that changes your database's schema. They run in order, each one only once, so you can change the table later without losing what's in it:

```sql title="migrations/0001_create_entries.sql"
CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Your Worker reads and writes it through a binding, with `?` placeholders for anything a visitor typed:

```ts
await env.DB.prepare("INSERT INTO entries (name, message) VALUES (?, ?)")
  .bind(name, message)
  .run();
```

## Why it matters

- D1 is a SQL database (SQLite) that your Worker reaches through its binding, with no connection string or password in your code.
- Local development and production have separate databases, so experiments on your machine never touch the real guestbook.

## Prerequisites

- You've completed [Build the UI](/courses/build-a-guestbook/build-the-ui) and still have that project on disk.
