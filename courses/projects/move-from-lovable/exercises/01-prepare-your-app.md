---
description: "Build a simple Lovable app, or check that your existing app is ready to migrate."
agent-instructions: |
  Read the student's interviews. This exercise has two routes to one readiness checkpoint; complete only the chosen route. Never guide an existing-app learner through creating a replacement.

  1. For an existing app, keep this quick: audit suitability rather than rebuild it. Inspect the actual framework and server runtime, available code export/Git sync and schema migrations, data export options, and backend dependencies (auth, storage, functions, AI, jobs and connectors). Confirm the app runs and identify what Workers can host and what needs to stay on its provider or needs separate migration work. Record only the gaps and agreed scope; don't remove features or recreate the app. Use a disposable copy and synthetic comparison records before later migration steps, never production data. Skip step 2.
  2. For a new app only: ask which three books they want and wait. Help them use the body prompt in a fresh Lovable project. Have them review backend provisioning and costs before enabling it. Keep the exact table contract, put schema and the SELECT-only policy in a migration, and keep seeds separate. Confirm the UI reads persisted rows, escapes titles and orders by ID. Have them change one read state in the dashboard, refresh the preview, and independently confirm the stored change. Confirm public SELECT works and public writes fail without changing rows. No auth, uploads, AI or app write endpoint.
  3. Shared readiness checkpoint: confirm the chosen app works, a disposable source and comparison records exist, its access model is understood, and the learner agrees on the migration scope. Write the source project ID and selected tables/expected rows in local notes without secrets. If unsupported services are essential and cannot remain on the source, pause and plan their migration before proceeding. Don't mark this exercise complete just because a repository exists.
  4. Ask where the records live and whether copying the UI would copy them. Wait for the answer and explain the source/data boundary.
  5. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
---

# Prepare your app

Already built an app in Lovable? This should be a quick check with your agent: can you export its code and data, can its stack run on Workers, and which backend services need separate work? Agree on what will move, then keep using that app. You don't need to build another one.

Otherwise, start with this prompt in Lovable. Your agent can help you keep the generated result small:

> Build a shared reading list with a title and a plain list of books. Use the built-in database with one public.books table: id integer primary key, title text not null, is_read boolean not null default false. Enable row-level security. Allow public SELECT only, with no public insert, update, or delete policy. Render records ordered by id, showing each title and read/unread state. Seed exactly three records separately from the schema: IDs 1, 2, 3, titles Paper boats, The quiet moon, A small adventure, and read states false, true, false. I'll edit records in the database dashboard. No login, uploads, AI, cover images, or write controls.

Choose your own titles if you like. Keep the column names and IDs so the later checks stay simple. These are made-up records, suitable for sharing publicly.

For the new reading list, change one read state in the dashboard and see it change in the app. A pretty list with hardcoded data wouldn't demonstrate a database migration.
