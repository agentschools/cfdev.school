---
exerciseSlug: use-worker-previews
---

This exercise extends the Worker from [Add your first binding](/exercises/add-first-binding-kv). [Worker Previews](https://developers.cloudflare.com/workers/previews/) give each git branch an isolated copy of your Worker, with its own URL and its own logs, so you can test a change before it reaches production. Your agent will do most of the typing; your job is to watch what changes and why.

## What you'll build

A Preview of your Worker for a `try-previews` branch. First you'll see that, out of the box, it reads the same KV data as production. Then you'll give Previews their own KV namespace, check that the Preview and production can't see each other's data, read the Preview's own logs, and merge the branch to ship it. Out of scope: GitHub pull requests and Workers Builds, custom domains, Cloudflare Access, and Preview secrets.

Want the full pull request version, with a D1 database and a bug for your agent to find? Try Cloudflare's [Worker Previews workshop](https://worker-previews-workshop.thomas-development.workers.dev/).

## Prerequisites

Your agent can help you with these.

- You've completed [Add your first binding](/exercises/add-first-binding-kv) and still have that project on disk.
- A recent [`cf` CLI](/lessons/cli), one that has `cf previews deploy`.
- [git](https://git-scm.com/) installed. Previews are named after your current branch.
