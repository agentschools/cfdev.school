---
description: "Run the same Worker code against a local simulation, the real KV namespace, and a second deployment with its own namespace."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the Worker from "live-objects" and "call-another-worker"; check GET /api/progress/{studentId} first. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). For students who've used other platforms, compare to keeping a staging and production database URL in sync by hand, and to the classic bug of test code pointed at the production database.

  The code doesn't change in this exercise. Only what its bindings point to does.

  1. Local simulation: start `cf dev` and `GET /note`. It returns whatever was written locally (or nothing), not the deployed value. Explain: in local dev, bindings point at local simulations by default, so experiments can't touch real data.
  2. Remote binding: change `NOTES` to `bindings.kv({ id: "<namespace id>", dev: { remote: true } })`. Remote bindings need the ID, even though deploy created the namespace without one: get it with `cf kv namespaces list` (the namespace `cf deploy` created in "live-objects"). Restart `cf dev` and `GET /note` locally: now it returns the value written to the deployed Worker. Same code, running on their machine, reading real data. Then put `NOTES` back the way it was (or keep the `id`, but drop `dev.remote`), so later local runs don't write to real data by accident.
  3. A second deployment: change `cloudflare.config.ts` to `export default defineConfig(({ mode }) => ({ worker: { ... } }))`, and make two things depend on `mode === "staging"`: the Worker's `name` (e.g. `<name>-staging`) and `GREETING` (e.g. `"Hello from staging"`). Leave `NOTES: bindings.kv()` with no ID. Deploy with `cf deploy --mode staging --secrets-file .env` (a new Worker needs its secrets on its first deploy). `cf` creates a second namespace, named after the staging Worker. A plain `cf deploy` still deploys the original Worker with its original namespace.
  4. Verify before completing. YOU must, against the deployed URLs:
     - `GET /note` on the staging Worker and confirm it doesn't return the production value;
     - `PUT /note` a new value on staging, then `GET /note` on both Workers, in separate requests, and confirm staging returns the new value and production still returns its own.
     Deploys can take up to about 30 seconds to start serving; retry before assuming something's wrong. Don't trust the student saying it worked.
  5. Teach the point:
     - Code can only reach a resource through a binding, so it can never be hard-coded to the production namespace. Every deployment of the same code can be pointed somewhere else. In testing, this is called dependency injection, and with bindings it comes for free.
     - The same idea works inside one Worker. Because `env` is passed to `fetch()`, a router Worker can combine two Workers' handlers and give each its own `env`, e.g. `apiWorker.fetch(request, { KV: env.API_KV }, ctx)`, even if both named their binding `KV`. Show this as a snippet; it doesn't need to be built.
     - The `cf init` template imports `env` from `"cloudflare:workers"` instead of taking it as a parameter. That's convenient, especially at the top level of a module, but a global `env` can't be remapped per call like the router above. Ask the student which style their Worker uses, and let them choose; there's no wrong answer.
  6. Comprehension check: ask the student why it's impossible for this Worker's staging deployment to write to the production namespace by mistake. Gently correct anything off.
  7. Clean up, with the student's OK: delete the staging Worker (`cf workers delete <name>-staging`) and its namespace (`cf kv namespaces delete <id>`), unless they want to keep them. Both commands prompt for confirmation and abort when run non-interactively, so pass `--force` once the student has said yes.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "capabilities".

  Out of scope here: Workers Previews, environments in Wrangler, and other binding types' remote support.
---

# Swap resources

Your Worker's code never names the KV namespace it uses. It only knows `env.NOTES`. That means the same code can run against a local simulation, against the real namespace from your laptop, or as a second deployment with data of its own, and you'll do all three without changing a line of it.

## What you'll build

- Your Worker in local dev, first against a simulated namespace, then against the real one with a [remote binding](https://developers.cloudflare.com/workers/local-development/#remote-bindings)
- A staging copy of the same Worker, deployed with its own namespace, side by side with the original

Writing to one won't touch the other, and your agent checks that it doesn't.

## Prerequisites

- You've completed [Call another Worker](/courses/bindings/call-another-worker) and still have that Worker on disk.
