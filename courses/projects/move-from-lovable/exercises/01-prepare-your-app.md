---
description: "Inspect your existing app, or build the reading list, then agree on what will move."
agent-instructions: |
  Read the student's interviews. This exercise has two routes to one readiness checkpoint; complete only the chosen route. Never guide an existing-app learner through creating a replacement.

  1. For an existing app: open its repository or local project. Inspect framework, schema/migrations, data access, policies, auth, storage, functions, AI, jobs and connectors. Use a disposable copy with synthetic records, never production data. Ask the learner which component they most want to move first and wait. Record a small inventory: moves now / stays on source / needs separate work. Don't remove features. Verify current app behavior and choose a small set of persisted synthetic records to compare later. Skip step 2.
  2. For a new app only: ask which three books they want and wait. Help them use the body prompt in a fresh Lovable project. Have them review backend provisioning and costs before enabling it. Keep the exact table contract, put schema and the SELECT-only policy in a migration, and keep seeds separate. Confirm the UI reads persisted rows, escapes titles and orders by ID. Have them change one read state in the dashboard, refresh the preview, and independently confirm the stored change. Confirm public SELECT works and public writes fail without changing rows. No auth, uploads, AI or app write endpoint.
  3. Shared readiness checkpoint: confirm the chosen app works, a disposable source and comparison records exist, its access model is understood, and the learner agrees on the migration scope. Write the source project ID and selected tables/expected rows in local notes without secrets. If unsupported services are essential and cannot remain on the source, pause and plan their migration before proceeding. Don't mark this exercise complete just because a repository exists.
  4. Ask where the records live and whether copying the UI would copy them. Wait for the answer and explain the source/data boundary.
  5. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
---

# Prepare your app

If you brought an existing app, inspect it with your agent and agree on the migration scope first. Keep that app throughout the course.

Otherwise, start with this prompt in Lovable. Your agent can help you keep the generated result small:

> Build a shared reading list with a title and a plain list of books. Use the built-in database with one public.books table: id integer primary key, title text not null, is_read boolean not null default false. Enable row-level security. Allow public SELECT only, with no public insert, update, or delete policy. Render records ordered by id, showing each title and read/unread state. Seed exactly three records separately from the schema: IDs 1, 2, 3, titles Paper boats, The quiet moon, A small adventure, and read states false, true, false. I'll edit records in the database dashboard. No login, uploads, AI, cover images, or write controls.

Choose your own titles if you like. Keep the column names and IDs so the later checks stay simple. These are made-up records, suitable for sharing publicly.

Before moving on, change one read state in the dashboard and see it change in the app. A pretty list with hardcoded data wouldn't demonstrate a database migration.
