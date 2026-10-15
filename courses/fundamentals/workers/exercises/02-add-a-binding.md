---
description: "Create a Workers KV namespace, bind it to the Worker you already deployed, and read and write a value through it to prove the binding actually persists data."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This exercise extends the same Worker from "Deploy a Worker" (deploy-a-worker). Check GET /api/progress/{studentId} first; if that exercise isn't complete yet, help them finish it before starting this one.

  You do the work: commands, edits, deploys. The student makes the choices, predicts, and reviews: wherever a step below says to ask the student something, ask, then end your turn and wait for their reply; don't run ahead to the next step in the same turn. Keep each pause short. If the student says "just do it" or similar, speed up for the rest of the exercise, but still show them the binding and wait for their OK (step 3), and still do the try-it step (step 8): seeing how a binding is declared is the point of this exercise.

  Adapt how much you explain to their interview answers (GET /api/students/{id}/interviews: Agent setup's agent experience and where they've deployed before, plus this course's own): students who haven't deployed anywhere get a brief, two-or-three-sentence explanation of each new concept as it comes up; students who've used another platform get a one-line comparison to what they know; Cloudflare users get the mechanics without the basics. Experience changes how much you explain, never whether the student makes the choices and predictions. Don't lecture.

  If their Worker from exercise 1 has a `wrangler.jsonc`/`wrangler.json`/`wrangler.toml` instead of a `cloudflare.config.ts` (e.g. it was created with Wrangler), offer to convert it with `cf migrate` first; if they'd rather not, adapt the steps below to Wrangler for that project.

  1. Choose: explain what a KV namespace is (a key-value store on Cloudflare's network, independent of any single Worker), then ask the student to name it (suggest `<worker name>-kv`) and to pick a key and value they'd like to store first (anything: a favorite word, a note to themselves). Wait for their answer.
  2. Provision: create the namespace with `cf kv namespaces create --title <their name>`. It prints JSON that includes the new namespace's `id`. Titles are unique per account, so if one with that title already exists (e.g. they're redoing this exercise), ask whether to reuse it or pick another name.
  3. Bind, and have them review it: add `KV: bindings.kv({ id: "<that id>" })` to the `worker.env` object in their `cloudflare.config.ts` (importing `bindings` from `"cf/config"` if it isn't already). Write this line yourself, don't reach for a template that already has the binding wired up. Show the student the `env` block with the new line, and explain what a binding is: the named connection between a Worker and a platform resource, which shows up on `env` in the Worker's code under the name on the left. The namespace exists on its own; this line only connects this Worker to it. If the scaffold's `WORLD: bindings.text(...)` line is still there, point out it's a binding too, one that holds a value instead of pointing at a resource. Ask if they're happy with the name `KV` or want another (if they rename it, use their name everywhere below), and wait for their OK before going on.
  4. Extend the Worker: update the same Worker's `fetch` handler so it reads a `key` (and, for writes, a `value`) from the request, e.g. query string params, and uses the binding: `PUT`-style requests call `env.KV.put(key, value)`, `GET`-style requests call `env.KV.get(key)` and return it (or a 404 if no value is stored under that key). Requests without a `key` must keep returning the response from "Deploy a Worker", so the Worker's homepage doesn't turn into an error; the binding is added on top of what's there. Show the student the new handler and point out that `env.KV` is the binding from step 3 in action.
  5. Run locally: start the local dev server with `cf dev` and confirm a local write followed by a local read returns the same value. Tell the student local dev uses a local simulation of KV, not the real namespace, so nothing they write locally shows up in production.
  6. Predict, then deploy: ask the student what a read will return for a key nobody has written yet. Wait for their answer. Then deploy with `cf deploy`.
  7. Verify: YOU must check all of these against the deployed URL, then compare the results to the student's predictions:
     - Write their value under their key, then in a separate request read it back and confirm it matches. A single request proving a value round-trips in memory is not enough; the two-step, separately issued round trip is what proves the binding persists data rather than the Worker echoing something back. Tell the student that's why you verify this way.
     - Read a key that was never written and confirm the 404. Make it one nobody will pick later (e.g. `never-written-` plus a few random characters): KV caches a miss for up to about a minute, so a key read before it's written can keep returning the miss for that long.
     - Request the homepage without a `key` and confirm it still returns the Worker's text from "Deploy a Worker" (whatever the student last changed it to). If it doesn't, fix the handler and redeploy before going on.
     Do not trust the student saying it worked; check it yourself. A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong.
  8. Try it: ask the student for two or three more keys and values to store, and which existing key to overwrite with what. Wait for their answer, then write them and read each back, showing the results. Give them a read URL (e.g. `<url>/?key=<their key>`) to open in their browser.
  9. Comprehension check: in its own message, ask the student what would change if a second Worker were bound to this same namespace. (Both Workers would read and write the same data: the namespace exists on its own, and the binding only connects a Worker to it.) Don't put the answer in the same message, and wait for their reply before saying whether it's right. Gently correct anything off. Verification is the gate, not their answer.
  10. Mark complete: only after verification succeeds, mark this exercise complete with PUT /api/progress/{studentId} as /llms.txt describes. Never invent other progress endpoints. This is the last exercise in the Workers course: tell the student it's complete, and that the Bindings course goes deeper (secrets, calling another Worker, swapping resources between environments) if they want more.

  Out of scope for this exercise: multiple KV namespaces, list operations, TTL/expiration, R2/D1 bindings, Durable Objects, and additional exercises. If the student asks, say those come later and stay focused on this one binding.
---

# Add a binding

This exercise extends the Worker you deployed in [Deploy a Worker](/courses/workers/deploy-a-worker). You'll create a [Workers KV](https://developers.cloudflare.com/kv/) namespace, [bind](https://developers.cloudflare.com/workers/runtime-apis/bindings/) it to that Worker, and read and write values through it: the first taste of what a Cloudflare binding is and why it matters. Your agent does the typing; you make the calls.

## What you'll build

The same Worker, now with a KV binding on `env`. Its homepage still shows the response from the first exercise. You'll write a value (e.g. via a query string) and, in a separate request, read it back from the public URL. Getting the same value back proves the binding actually persists data, not that a single request just echoed something.

You name the namespace and choose what to store. Before anything ships, your agent shows you the one line in `cloudflare.config.ts` that declares the binding, and you'll predict what happens when you read a key nobody wrote. Then you'll store and overwrite a few values of your own.

Out of scope: multiple namespaces, TTLs, R2/D1, and other storage.

## Prerequisites

Your agent can help you with these.

- You've completed [Deploy a Worker](/courses/workers/deploy-a-worker) and still have that project on disk.
- The [`cf` CLI](/courses/agent-setup/cli) authenticated against your Cloudflare account (`cf auth whoami`).
