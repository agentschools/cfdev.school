---
description: "Give a second Durable Object class its own SQLite database, store messages in it with SQL, and see that every object's database is separate."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the Worker from the earlier exercises; check GET /api/progress/{studentId} first. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). For students who've used a hosted database (Postgres, MySQL, a serverless database), compare to one shared database that every server connects to over the network.

  1. Define a second class: export `class Room extends DurableObject` in `src/index.ts`. In its constructor (call `super(ctx, env)` first), create its table with `this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, text TEXT NOT NULL, sent_at TEXT NOT NULL)")`. `IF NOT EXISTS` makes it safe to run every time the object starts.
  2. Add RPC methods: `post(author, text)` inserts a row with `sql.exec("INSERT INTO messages (author, text, sent_at) VALUES (?, ?, ?)", author, text, new Date().toISOString())` and returns the message; `recent(limit = 20)` returns the latest messages, oldest first, with `sql.exec(...).toArray()`; and `stats()` returns the message count (`sql.exec("SELECT count(*) AS count FROM messages").one()`) and `this.ctx.storage.sql.databaseSize`. Point out that `sql.exec()` isn't awaited (https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), and always use `?` placeholders for values, never string concatenation.
  3. Declare it next to `Counter`: `Room: exports.durableObject({ storage: "sqlite" })`, then run `cf workers types`.
  4. Add a `/room` route: get the object with `ctx.exports.Room.getByName(name)` from `?name=`. `POST` with a JSON body `{ "author": "...", "text": "..." }` calls `post()`; `GET` returns `recent()`, or `stats()` when the URL has `?stats`.
  5. Try it with `cf dev`, then deploy with `cf deploy`. The deploy output's "Durable Object exports reconciliation" should now say `Created: Room`.
  6. Verify before completing. YOU must, against the deployed URL:
     - `POST` three messages to `/room?name=lobby` and one to `/room?name=kitchen`;
     - `GET /room?name=lobby` and confirm the three messages come back in the order they were sent, and `GET /room?name=kitchen` returns only its one;
     - `GET /room?name=lobby&stats` and confirm the count is 3 and the database size is a number of bytes.
     Don't trust the student saying it worked.
  7. Teach the point, using what they just saw:
     - Every room got its own SQLite database, created the first time the room was used. `lobby` can't see `kitchen`'s rows, not because of a `WHERE` clause, but because they're different databases. Each object's storage can hold up to 10 GB (https://developers.cloudflare.com/durable-objects/platform/limits/).
     - `sql.exec()` is synchronous because the database is on the same machine as the object's code: there's no network round trip to wait for. Writes are still durable: the runtime holds the response until they're saved, an "output gate" (https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/).
     - The schema lives in code that runs when the object starts. With millions of objects, there's no single database to migrate: each one runs its `CREATE TABLE IF NOT EXISTS` (or a later `ALTER TABLE`) the next time it wakes up.
     - When one shared database fits better: queries across everything, like "all messages from every room", are a job for D1, Cloudflare's serverless SQL database. Durable Objects shine when data naturally splits by name (https://developers.cloudflare.com/durable-objects/).
  8. Comprehension check: ask the student why `sql.exec()` doesn't need `await` here when a database query in most apps does. Gently correct anything off.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "talk-in-real-time".

  Out of scope here: point-in-time recovery, `storage.transactionSync()`, the KV API on SQLite-backed objects beyond what `Counter` already uses, and D1 itself.
---

# Store data with SQL

The counter stored one number. Real apps store rows: messages, orders, edits to a document. Every SQLite-backed Durable Object comes with its own SQL database, right next to its code.

## What you'll build

A second Durable Object class, `Room`, that stores chat messages in a `messages` table with [SQL](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), and a `/room` route to post and read them. Each room name gets its own database.

## Prerequisites

- You've completed [No lost updates](/courses/durable-objects/no-lost-updates) and still have that Worker on disk.
