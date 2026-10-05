---
exerciseSlug: use-worker-previews
---

[Worker Previews](https://developers.cloudflare.com/workers/previews/) give each git branch an isolated copy of your Worker, with its own URL and its own logs, so you can test a change before it reaches production.

In this exercise, you'll use Worker Previews to create temporary deployments of the Worker you built in [Add your first binding](/exercises/add-first-binding-kv). That lets you test changes in isolation from production before they're merged into your project's main branch. Your agent will do most of the typing; your job is to watch what changes and why.

## What you'll build

1. A Preview of your Worker for a `try-previews` branch, with its own URL.
2. A second KV namespace just for Previews, so the Preview and production can't see each other's data.
3. A quick look at the two kinds of Preview URL: one per branch, and one per deploy.
4. A query for the Preview's own logs, without production traffic mixed in.
5. A merge back to `main` and a production deploy, with production's data untouched.

Out of scope: GitHub pull requests and Workers Builds, custom domains, Cloudflare Access, and Preview secrets.

## Prerequisites

- [Add your first binding](/exercises/add-first-binding-kv) completed, with the project still on disk. That exercise and the lessons before it already cover the `cf` CLI, your Cloudflare account, and KV.
- [git](https://git-scm.com/), since Previews are named after your current branch. Your agent can set up a repository if the project doesn't have one yet, and update `cf` if your version doesn't have `cf previews` yet.
