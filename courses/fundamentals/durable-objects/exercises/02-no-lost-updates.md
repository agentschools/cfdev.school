---
description: "Send 50 simultaneous increments to your Durable Object counter and to a KV-based counter, and see which one loses updates."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the Worker from "one-object-per-name"; check GET /api/progress/{studentId} first. Teach as you go, pitched to their interview answers (GET /api/students/{id}/interviews). For students who've built web apps, compare to the classic race condition: two requests read the same row, both add one, both write, and one update disappears, which is why databases have transactions and row locks.

  1. Add a KV-backed counter to compare against: add `COUNTS: bindings.kv()` to `env` in `cloudflare.config.ts` (no `id`; `cf deploy` creates the namespace, as in the Bindings course), run `cf workers types`, and add a `/kv-count` route that does the same thing as `/count` with KV: on `POST`, read `env.COUNTS.get(name)`, add one, `env.COUNTS.put()` it back, and return the new value as JSON; on `GET`, return the stored value. Wrap the `put` in try/catch and return the error message as JSON with status 429 if it throws (you'll see why). This is the naive read-modify-write most people would write first.
  2. Deploy with `cf deploy`.
  3. Fire 50 simultaneous `POST`s at each route on the deployed URL, using a name neither counter has seen (e.g. `race1`), so both start from zero. Run it yourself, for example `seq 50 | xargs -P 50 -I{} curl -s -X POST "<url>/count?name=race1"`, or a short Node script with `Promise.all`. Collect the responses: each one is the value that request wrote.
  4. Verify before completing. YOU must confirm, from the responses:
     - the Durable Object counter returned every value from 1 to 50 exactly once, and `GET /count?name=race1` is 50;
     - the KV counter's highest returned value is well below 50: updates were lost. Some requests may also have failed with `KV PUT failed: 429 Too Many Requests` (in our testing, 2 of 50, with the highest value between 5 and 9). It's a race, so the numbers vary; if the highest value somehow reaches 50, run it again with a new name.
     Use the responses rather than a `GET` on `/kv-count` for the KV result: KV reads are cached for up to about a minute, so a `GET` right afterward can be stale. Don't trust the student saying it worked.
  5. Teach the point, using their numbers:
     - The KV counter lost updates because many copies of the Worker ran at once, each read the same old value, and each wrote back its own "old + 1". KV also isn't made for this: Cloudflare advises against writing the same key more than once a second (https://developers.cloudflare.com/kv/api/write-key-value-pairs/), which is what the 429 errors were, and reads elsewhere can lag behind writes.
     - The Durable Object didn't, with the same read-modify-write code, because all 50 requests went to one object, and an object runs one piece of JavaScript at a time. While it's waiting on its own storage, the runtime holds other requests back (an "input gate"), so a `get` followed by a `put` can't be interrupted (https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/). No locks or transactions to write.
     - The protection covers storage calls, not everything: awaiting `fetch()` or another service inside the object lets other requests in, so read, call out, then write is racy again. Keep read-modify-write next to storage.
     - The flip side of one object per name: one object handles requests one at a time, so a single hot name has a throughput limit. Spread load across names (per user, per room) rather than funneling everything through one.
  6. Comprehension check: ask the student why the same read-modify-write code is broken in the Worker with KV but safe inside the Durable Object. Gently correct anything off.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "store-data-with-sql".

  Out of scope here: `blockConcurrencyWhile`, output gates in detail, `storage.transaction()`, and making the KV counter correct (the answer is "use a Durable Object").
---

# No lost updates

Counting sounds easy until lots of people count at once. Two requests read the same value, both add one, both write it back, and one of the updates is gone. Most databases fix this with transactions and locks you have to remember to use.

In this exercise you'll race two counters against each other: the Durable Object from the last exercise, and the same logic written with [Workers KV](https://developers.cloudflare.com/kv/).

## What you'll build

A second counter route backed by KV, then a burst of 50 simultaneous requests at each. Your agent compares what comes back. One of them ends at exactly 50.

## Prerequisites

- You've completed [One object per name](/courses/durable-objects/one-object-per-name) and still have that Worker on disk.
