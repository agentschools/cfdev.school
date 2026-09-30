---
exerciseSlug: add-first-binding-kv
---

This exercise extends the Worker you deployed in [Deploy your first Worker](/exercises/deploy-first-worker). You'll create a [Workers KV](https://developers.cloudflare.com/kv/) namespace, [bind](https://developers.cloudflare.com/workers/runtime-apis/bindings/) it to that Worker, and read and write a value through it — the first taste of what a Cloudflare binding is and why it matters. Your agent will guide you end to end.

## What you'll build

The same Worker, now with a `KV` binding on `env`. You'll write a value (e.g. via a query string) and, in a separate request, read it back from the public URL. Getting the same value back proves the binding actually persists data, not that a single request just echoed something. Out of scope: multiple namespaces, TTLs, R2/D1, and other storage.

## Prerequisites

Your agent can help you with these.

- You've completed [Deploy your first Worker](/exercises/deploy-first-worker) and still have that project on disk.
- The [`cf` CLI](/lessons/cli) authenticated against your Cloudflare account (`cf auth whoami`).
