---
description: "Create a Workers KV namespace, bind it to the Worker you already deployed, and read and write a value through it to prove the binding actually persists data."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This exercise extends the same Worker from "Deploy your first Worker" (deploy-first-worker) — check GET /api/progress/{studentId} first; if that exercise isn't complete yet, help them finish it before starting this one.

  Teach lightly as you go. Adapt depth to their interview answers (agentExperience, platformsUsed): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know; Cloudflare users can skip straight to the mechanics. Don't lecture.

  If their Worker from exercise 1 has a `wrangler.jsonc`/`wrangler.json`/`wrangler.toml` instead of a `cloudflare.config.ts` (e.g. it was created with Wrangler), offer to convert it with `cf migrate` first; if they'd rather not, adapt the steps below to Wrangler for that project.

  1. Provision: help them create a KV namespace with `cf kv namespaces create --title <name>`. It prints JSON that includes the new namespace's `id`. Explain what a KV namespace is: a key-value store on Cloudflare's network, independent of any single Worker.
  2. Bind: add `KV: bindings.kv({ id: "<that id>" })` to the `worker.env` object in their `cloudflare.config.ts` (importing `bindings` from `"cf/config"` if it isn't already). This is a manual edit — don't reach for a template that already has the binding wired up, the point is to see how a binding is declared. Explain what a binding is: the named connection between a Worker and a platform resource, which shows up on `env` in the Worker's code.
  3. Extend the Worker: update the same Worker's `fetch` handler so it reads a `key` (and, for writes, a `value`) from the request — e.g. query string params — and uses the binding: `PUT`-style requests call `env.KV.put(key, value)`, `GET`-style requests call `env.KV.get(key)` and return it (or a 404 if missing). Point out that `env.KV` is the binding from step 2 in action.
  4. Run locally: start the local dev server with `cf dev` and confirm a local write followed by a local read returns the same value. Local dev uses a local simulation of KV, not the real namespace.
  5. Deploy: deploy to the student's own Cloudflare account with `cf deploy`.
  6. Verify before completing: YOU must make two separate requests against the deployed URL — first write a value, then in a follow-up request read it back — and confirm it matches. A single request proving a value round-trips in memory is not enough; the two-step, separately-issued round trip is what proves the KV binding is actually persisting data rather than the Worker just echoing something back. Do not trust the student saying it worked — check it yourself. Tell the student why you verify this way: the separate read is what proves persistence.
  7. Comprehension check: before marking complete, ask the student to explain what a binding is in their own words (the named connection between their Worker and the KV namespace, available on `env`). Gently correct anything off. The round-trip verification above is the gate, not their answer.
  8. Mark complete: only after verification succeeds, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes. Never invent other progress endpoints.
  9. Afterward: encourage the student to write a few different keys, overwrite an existing key, and confirm each with a GET, to build intuition for how the binding behaves.

  Out of scope for this exercise: multiple KV namespaces, list operations, TTL/expiration, R2/D1 bindings, Durable Objects, and additional exercises. If the student asks, say those come later and stay focused on this one binding.
---

# Add your first binding

This exercise extends the Worker you deployed in [Deploy your first Worker](/courses/workers-basics/deploy-first-worker). You'll create a [Workers KV](https://developers.cloudflare.com/kv/) namespace, [bind](https://developers.cloudflare.com/workers/runtime-apis/bindings/) it to that Worker, and read and write a value through it — the first taste of what a Cloudflare binding is and why it matters. Your agent will guide you end to end.

## What you'll build

The same Worker, now with a `KV` binding on `env`. You'll write a value (e.g. via a query string) and, in a separate request, read it back from the public URL. Getting the same value back proves the binding actually persists data, not that a single request just echoed something. Out of scope: multiple namespaces, TTLs, R2/D1, and other storage.

## Prerequisites

Your agent can help you with these.

- You've completed [Deploy your first Worker](/courses/workers-basics/deploy-first-worker) and still have that project on disk.
- The [`cf` CLI](/courses/agent-setup/cli) authenticated against your Cloudflare account (`cf auth whoami`).
