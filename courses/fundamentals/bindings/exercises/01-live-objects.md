---
description: "Give your Worker a plain variable, a secret, and a KV binding, then see for yourself which of them is a string and which is a live object."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Teach as you go, pitched to this course's interview answer and Agent setup's interview (GET /api/students/{id}/interviews). For students who've used other platforms, compare to what they know: a connection string plus an API key in environment variables, or an IAM role granted separately. Don't lecture; one or two sentences per idea.

  Which Worker: use the Worker from the Workers course if the student has it (check GET /api/progress/{studentId}, and ask where the project is). Otherwise scaffold a new one with `cf init <directory>`. Either way it needs a `cloudflare.config.ts`; if it has a `wrangler.jsonc`/`wrangler.json`/`wrangler.toml` instead, offer to convert it with `cf migrate`, or adapt these steps to Wrangler if they'd rather not. The rest of this course builds on this same Worker.

  1. Declare three things in `worker.env` in `cloudflare.config.ts` (importing `bindings` from `"cf/config"`):
     - `GREETING: bindings.text("Hello")`, a plain variable.
     - `API_TOKEN: bindings.secret()`, a secret. Its local value goes in a `.env` file next to the config, e.g. `API_TOKEN=pretend-this-is-secret`. Check that `.env` is gitignored (the `cf init` template ignores `.env*`).
     - `NOTES: bindings.kv()`, a KV binding with no `id`. Don't create the namespace first.
     If the Worker already has a `KV` binding from the Workers course, leave it alone and add these alongside it.
  2. Run `cf workers types` so `env` is typed with the new bindings.
  3. Add an `/env` route that reports, for each entry in `env`: its `typeof`, and for objects, `JSON.stringify(value)` and `String(value)`. Also add `/note` routes: `PUT /note` stores the request body under one key with `env.NOTES.put`, and `GET /note` reads it back with `env.NOTES.get`.
  4. Run it with `cf dev`. Locally the KV binding is a simulation, and the secret comes from `.env`.
  5. Deploy with `cf deploy --secrets-file .env`. Point out what the deploy output shows: `cf` sees `NOTES` has no namespace, creates one (named after the Worker and the binding, e.g. `<worker>-notes`), and binds it, and the config file still has no ID. Later deploys reuse the same namespace. The secret's value shows as hidden. A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong. If the build prints "Cannot connect to the Docker daemon", it's harmless: this Worker doesn't use Docker, and the deploy still completes. Tell the student so they don't think it failed.
  6. Verify before completing. YOU must:
     - fetch `/env` on the deployed URL and confirm `GREETING` and `API_TOKEN` are strings and `NOTES` is an object whose `JSON.stringify` is `{}`;
     - `PUT /note`, then in a separate request `GET /note`, and confirm the value comes back. If anyone read `/note` on the deployed URL before the `PUT`, the "not found" may be cached for up to about a minute, so retry before assuming something's wrong (see "swap-resources" for why);
     - confirm with `cf kv namespaces list --per-page 100` that the namespace `cf deploy` created exists. The list is paginated, 20 per page by default, so without `--per-page` an account with many namespaces won't show it.
     Don't trust the student saying it worked.
  7. Teach the body's "Why it matters" section, using their own `/env` output rather than the example in the body. Point at the actual `{}` next to the actual secret string.
  8. Comprehension check: ask the student why a leaked log of `env` is a problem for `API_TOKEN` but not for `NOTES`. Gently correct anything off. Verification is the gate, not their answer.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "call-another-worker".

  Out of scope here: Secrets Store (account-level secrets, also bound like this; mention it in a sentence if they ask how teams share secrets), other binding types, and KV features beyond get and put.
---

# Live objects

Most platforms hand your code strings: a database URL, an API key, a token. Your code turns them into connections. On Cloudflare, your Worker's `env` can hold strings too, but its bindings are something else: objects that are already connected to a resource, with the permission built in.

In this exercise you'll put both kinds side by side and look at them.

## What you'll build

Your Worker gets three new entries on `env`:

- `GREETING`, a plain text variable
- `API_TOKEN`, a secret
- `NOTES`, a [Workers KV](https://developers.cloudflare.com/kv/) binding, declared without creating the namespace first

You'll deploy it, let `cf` create the namespace for you, and then ask your Worker what each entry actually is. One of them turns out to have nothing in it to leak.

## Prerequisites

Your agent can help you with these.

- A Worker with a `cloudflare.config.ts`, like the one from [Deploy a Worker](/courses/workers/deploy-a-worker). Your agent can make a new one if you don't have it.
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).

## Strings vs. bindings

On a typical platform, code that reads from a database gets a URL and a key, and builds a client from them:

```ts
// A typical platform (not Cloudflare)
const db = connect(env.DATABASE_URL, env.DATABASE_KEY);
const value = await db.get("content");
```

On Cloudflare, you declare the binding in `cloudflare.config.ts`:

```ts title="cloudflare.config.ts"
env: {
  GREETING: bindings.text("Hello"),
  API_TOKEN: bindings.secret(),
  NOTES: bindings.kv(),
},
```

Then `env.NOTES` arrives already connected. There's nothing to set up:

```ts title="src/index.ts"
import { env } from "cloudflare:workers";

export default {
  async fetch(request) {
    return new Response(await env.NOTES.get("content"));
  },
};
```

`GREETING` and `API_TOKEN` are plain strings. `NOTES` is a live object. Ask your Worker to serialize all three and you get something like this:

```text
GREETING   string   "Hello"
API_TOKEN  string   "pretend-this-is-secret"
NOTES      object   {}
```

## Why it matters

- A secret is a string, and strings leak. A debug log line or an error reporter that prints `env` exposes it, and anyone holding that string has the access it grants.
- A binding has nothing in it to leak. The KV namespace's real credentials never reach your code, which is why `NOTES` shows up as `{}`.
- Declaring the binding is the whole permission step. There's no access list to update on the namespace, and a Worker with no binding has no access at all.
- Cloudflare knows every binding, so it can tell you which Workers use a namespace without reading anyone's code.
