---
description: "Create a Durable Object class, reach one object per name from your Worker, and see that each name keeps its own state across requests and deploys."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Teach as you go, pitched to this course's interview answer and Agent setup's interview (GET /api/students/{id}/interviews). For students who've used other platforms, compare to what they'd normally reach for to share state between requests: a database or a Redis instance in one region that every server talks to. Don't lecture; one or two sentences per idea.

  Which Worker: scaffold a new one for this course with `cf init <directory>` (e.g. `cf init objects`). The rest of the course builds on this same Worker. If the student would rather reuse a Worker from an earlier course, that works too, as long as it has a `cloudflare.config.ts`.

  1. Define the class: in `src/index.ts`, export `class Counter extends DurableObject` (from `"cloudflare:workers"`) with two methods: `increment()`, which reads `"value"` with `this.ctx.storage.get<number>()`, adds one, writes it back with `this.ctx.storage.put()`, and returns it; and `value()`, which returns the stored value (or 0). These are RPC methods, like the greeter's `greet()` if they took the Bindings course.
  2. Declare it in `cloudflare.config.ts`: add `exports: { Counter: exports.durableObject({ storage: "sqlite" }) }` to the worker (import `exports` from `"cf/config"`). Explain: this tells Cloudflare that `Counter` is a Durable Object class and creates its namespace on deploy. `storage: "sqlite"` is the storage backend Cloudflare recommends for new classes, and the only one on the Workers Free plan (https://developers.cloudflare.com/durable-objects/platform/pricing/). There's no `env` binding to add: a Worker reaches its own classes through `ctx.exports`. Another Worker would use `bindings.durableObject()` instead (https://developers.cloudflare.com/cf/projects/cloudflare-config/).
  3. Run `cf workers types`, then add a `/count` route to the default export's `fetch(request, env, ctx)`: get the object with `ctx.exports.Counter.getByName(name)`, where `name` comes from a `?name=` query parameter, then `POST` calls `increment()` and `GET` calls `value()`. Return JSON.
  4. Run it with `cf dev` and try a few names. Locally, the objects and their storage are simulated.
  5. Deploy with `cf deploy`. Point out "Durable Object exports reconciliation: Created: Counter" in the output: that's the namespace being created.
  6. Verify before completing. YOU must, against the deployed URL:
     - `POST /count?name=a` twice and confirm it returns 1, then 2;
     - `POST /count?name=b` and confirm it returns 1, a separate counter;
     - deploy again with `cf deploy`, then `GET /count?name=a` and confirm it's still 2: the state outlives the code version;
     - run `cf durable-objects namespaces list --per-page 1000` and confirm a namespace named `<worker>_Counter` exists with `use_sqlite: true`. (The list is paginated, hence `--per-page`.)
     A new deploy can take up to about 30 seconds to start serving; retry before assuming something's wrong. Don't trust the student saying it worked.
  7. Teach the point, using what they just saw:
     - `getByName("a")` doesn't create a new object each time. Every request for `"a"`, from anywhere in the world, reaches the same object, which Cloudflare creates the first time it's used. That's what a plain Worker can't do: its copies run wherever requests land and share nothing.
     - The storage belongs to that object alone, lives right next to its code, and is strongly consistent: a read always sees the last write. If they took the Bindings course, contrast this with KV, where a write could take a minute to show up elsewhere.
     - An object only runs while it has work. When it's idle, it's evicted from memory, and its storage waits until the next request (https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/).
     - Names are the design decision: one object per thing that needs to agree with itself, like one per user, per document, or per chat room. Not one object for the whole app, which would make every request wait in line for it.
  8. Comprehension check: ask the student what happens when two people in different countries both `POST /count?name=a` at the same moment: how many counters are involved, and where do the requests go? Gently correct anything off.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "no-lost-updates".

  Out of scope here: `idFromName`/`newUniqueId` and raw IDs (mention that `getByName` is shorthand for them if they ask), location hints, alarms, and the SQL API (it's the "store-data-with-sql" exercise).
---

# One object per name

A Worker runs wherever a request lands, as many copies as needed, and those copies share nothing. That's great until two requests need to agree on something, like the current value of a counter.

A Durable Object fixes that. You ask for one by name, and every request for that name, from anywhere, reaches the same object, with its own storage right next to its code.

## What you'll build

A Worker with a `Counter` [Durable Object](https://developers.cloudflare.com/durable-objects/) class and a `/count` route. `POST /count?name=a` adds one to the counter named `a`. Every name gets its own counter, and each one keeps its value across requests and deploys.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up). Durable Objects work on the Workers Free plan.
- The [`cf` CLI](/courses/agent-setup/cli) logged in to your Cloudflare account (`cf auth whoami`).
