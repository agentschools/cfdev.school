---
description: "Build a simple Lovable app, or check that your existing app is ready to migrate."
agent-instructions: |
  Follow the course's teaching approach and the steps below with the learner. Use their chosen app; don't replace it with the example. Independently verify the completion checks and pause on unsupported dependencies.
  1. Mark complete only after the page's checks pass, using the progress procedure in /llms.txt.
---

# Prepare your app

Choose the route from your interview. You only need to do one.

## If you already have an app

Open your app with your agent for a quick suitability audit. Keep the app you've built; there's no need to recreate it.

1. Inspect the actual framework and server runtime, code export/Git sync, schema migrations and data export options.
2. Identify its database API, access policies and backend services: auth, storage, functions, AI, jobs and connectors. Confirm it currently works. Which parts can Workers host, and which need another provider or separate migration work?
3. Agree on a small scope and record only the gaps: moves now / stays on source / needs separate work. Don't remove features to make the lab pass. Prepare a disposable copy with synthetic comparison records before making migration changes; leave production data alone.

If an essential dependency can't move or stay on its current provider, pause and plan that work before proceeding.

## If you're starting fresh

Review Lovable's backend provisioning and costs, then use this prompt:

> Build a shared reading list with a title and a plain list of books. Use the built-in database with one public.books table: id integer primary key, title text not null, is_read boolean not null default false. Enable row-level security. Allow public SELECT only, with no public insert, update, or delete policy. Render records ordered by id, showing each title and read/unread state. Seed exactly three records separately from the schema: IDs 1, 2, 3, titles Paper boats, The quiet moon, A small adventure, and read states false, true, false. I'll edit records in the database dashboard. No login, uploads, AI, cover images, or write controls.

Choose your own titles if you like; keep the columns and IDs. With your agent, inspect the generated migration, policies and data query. Confirm the list reads persisted rows and renders titles as text. Change one read state in the dashboard, then refresh and confirm the change persisted. Check public reads work and public writes can't change rows.

## Before continuing

Both routes meet here: the app works, you have synthetic records to compare, and you understand its access model and agreed migration scope. Save the source project ID, selected tables and expected rows in local notes without secrets.

Explain to your agent where the records live. Would copying the UI copy them too?
