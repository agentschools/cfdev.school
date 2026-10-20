---
description: "Run the same Worker code against a local simulation, the real KV namespace, and a second deployment with its own namespace."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the Worker from "live-objects" and "call-another-worker"; check GET /api/progress/{studentId} first. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). For students who've used other platforms, compare to keeping a staging and production database URL in sync by hand, and to the classic bug of test code pointed at the production database.

  The code doesn't change in this exercise. Only what its bindings point to does.

  1. Local simulation: start `cf dev` and `GET /note`. It returns whatever was written locally (or nothing), not the deployed value. Explain: in local dev, bindings point at local simulations by default, so experiments can't touch real data.
  2. Remote binding: the last exercise already used `dev: { remote: true }` on `GREETER`, to call the deployed greeter from local dev. Now do the same for data. Change `NOTES` to `bindings.kv({ id: "<namespace id>", dev: { remote: true } })`. Remote bindings need the ID, even though deploy created the namespace without one: get it with `cf kv namespaces list --per-page 100` (the namespace `cf deploy` created in "live-objects"; the list is paginated). Restart `cf dev` and `GET /note` locally: now it returns the value written to the deployed Worker. Same code, running on their machine, reading real data. Then put `NOTES` back the way it was (or keep the `id`, but drop `dev.remote`), so later local runs don't write to real data by accident.
  3. A second deployment: change `cloudflare.config.ts` to `export default defineConfig(({ mode }) => ({ worker: { ... } }))`, and make two things depend on `mode === "staging"`: the Worker's `name` (e.g. `<name>-staging`) and `GREETING` (e.g. `"Hello from staging"`). Leave `NOTES: bindings.kv()` with no ID. Deploy with `cf deploy --mode staging --secrets-file .env` (a new Worker needs its secrets on its first deploy). `cf` creates a second namespace, named after the staging Worker. A plain `cf deploy` still deploys the original Worker with its original namespace (its mode is `production`, and `cf dev`'s is `development`, so neither matches `staging`; `cf dev --mode staging` runs the staging config locally).
  4. Verify before completing. YOU must, against the deployed URLs:
     - `GET /note` on the staging Worker and confirm it doesn't return the production value;
     - `PUT /note` a new value on staging, then `GET /note` on both Workers, in separate requests, and confirm staging returns the new value and production still returns its own.
     Deploys can take up to about 30 seconds to start serving; retry before assuming something's wrong. KV is eventually consistent, and the first `GET` on staging caches "not found": staging can keep returning nothing for about a minute after the `PUT`. Retry for up to a minute (don't re-`PUT`), and turn the wait into a teaching moment: a write is usually visible right away where it was made, but cached reads elsewhere, including cached misses, can take 60 seconds or more to update (https://developers.cloudflare.com/kv/concepts/how-kv-works/). Don't trust the student saying it worked.
  5. Teach the body's "Why it matters" section. The router snippet doesn't need to be built. When you get to the two ways to get `env`, add the tradeoffs the body leaves out (https://developers.cloudflare.com/workers/runtime-apis/bindings/#importing-env-as-a-global): a global `env` can still be overridden for a block of code with `withEnv({ ... }, () => ...)` from `"cloudflare:workers"`; at the top level of a module, plain values like text and secrets work but binding calls that do I/O (like `env.NOTES.get`) don't; and a client built from a binding at module scope can outlive a binding change, since Cloudflare may reuse a running isolate when only bindings change. Passing `env` as a parameter stays the docs' recommended pattern for dependency injection and testing. Ask the student which style their Worker uses, and let them choose.
  6. Comprehension check: ask the student why it's impossible for this Worker's staging deployment to write to the production namespace by mistake. Gently correct anything off.
  7. Clean up, with the student's OK: delete the staging Worker (`cf workers delete <name>-staging`) and its namespace (`cf kv namespaces delete <id>`), unless they want to keep them. Both commands prompt for confirmation and abort when run non-interactively, so pass `--force` once the student has said yes.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "capabilities".

  Out of scope here: Worker Previews (`cf previews deploy`, which evaluates the config with `isPreview: true`), environments in Wrangler, testing with the Workers Vitest integration, and other binding types' remote support. If the student asks which bindings support remote mode, point them to https://developers.cloudflare.com/workers/local-development/bindings-per-env/.
---

# Swap resources

Your Worker's code never names the KV namespace it uses. It only knows `env.NOTES`. That means the same code can run against a local simulation, against the real namespace from your laptop, or as a second deployment with data of its own, and you'll do all three without changing a line of it.

## What you'll build

- Your Worker in local dev, first against a simulated namespace, then against the real one with a [remote binding](https://developers.cloudflare.com/workers/local-development/#remote-bindings)
- A staging copy of the same Worker, deployed with its own namespace, side by side with the original

Writing to one won't touch the other, and your agent checks that it doesn't.

## Prerequisites

- You've completed [Call another Worker](/courses/bindings/call-another-worker) and still have that Worker on disk.

## Where a binding points

Your code always says `env.NOTES`. What that points at depends on how you run it:

| How you run it               | `env.NOTES` points at                  |
| ---------------------------- | -------------------------------------- |
| `cf dev`                     | A local simulation on your machine     |
| `cf dev`, with remote on     | The real namespace in your account     |
| `cf deploy`                  | The real namespace                     |
| `cf deploy --mode staging`   | A second namespace, just for staging   |

A remote binding is one setting on the binding. It needs the namespace's ID:

```ts title="cloudflare.config.ts"
NOTES: bindings.kv({ id: "<namespace id>", dev: { remote: true } }),
```

And since `cloudflare.config.ts` is TypeScript, it can take a function of the mode. Give staging its own Worker name, and it gets its own namespace:

```ts title="cloudflare.config.ts"
export default defineConfig(({ mode }) => ({
  worker: {
    name: mode === "staging" ? "my-worker-staging" : "my-worker",
    // entrypoint, compatibilityDate, ...
    env: {
      NOTES: bindings.kv(),
    },
  },
}));
```

## Why it matters

- Your code can only reach a resource through a binding, so it can't be hard-coded to production data. Any deployment of the same code can point somewhere else. In testing this is called dependency injection, and with bindings you get it without trying.
- It works inside one Worker too. Say you combine two Workers into one, and both called their KV binding `KV`. If each handler takes `env` as a parameter, a router can give each one its own:

  ```ts
  export default {
    async fetch(request, env, ctx) {
      const { hostname } = new URL(request.url);
      if (hostname === "api.example.com") {
        return apiWorker.fetch(request, { KV: env.API_KV }, ctx);
      }
      return assetsWorker.fetch(request, { KV: env.ASSETS_KV }, ctx);
    },
  };
  ```

- There are two ways to get `env`. The `cf init` template imports it (`import { env } from "cloudflare:workers"`), which is handy deep inside your code. Taking it as a parameter, `fetch(request, env, ctx)`, is what makes the router above possible, and it's what the [docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/#importing-env-as-a-global) recommend for testing.
