---
description: "Screen new entries with an AI decision model and hold back the ones that look like spam."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the guestbook from "connect-a-database"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md` for its stack and commands. Read this course's interview (GET /api/students/{id}/interviews) for how strict to be. Teach the body's sections as you go, before the code that uses them: what a decision model is, what Clef is, and why it goes through AI Gateway. Keep it short; the point is how little it takes.

  1. Add the Workers AI binding:
     - `cf` projects: `AI: bindings.ai({ dev: { remote: true } })` in `env`, then `cf workers types`. Without `dev: { remote: true }`, `cf dev` fails with "Binding AI needs to be run remotely": there's no local simulation of Workers AI, so local dev calls the real model on their account.
     - Wrangler projects: `"ai": { "binding": "AI", "remote": true }` in `wrangler.jsonc`.
     If `cf dev` stops with "More than one account available", add `accountId: "<id>"` at the top level of `defineConfig` (next to `worker`), with the account ID from `cf auth whoami`. In Wrangler projects it's `"account_id"`.
  2. Add a migration with `status` (`'approved'` or `'held'`, default `'approved'`) and `spam_score` (REAL) columns on `entries`: one `ALTER TABLE entries ADD COLUMN` statement per column, since SQLite adds one at a time. Apply it locally and to the deployed database, the same commands as in "connect-a-database". Point out that existing entries kept their data and got the defaults: that's what migrations are for.
  3. In `POST /api/entries`, before the insert, ask Clef, the same way as the body's example: `@cf/cloudflare/clef-flash`, `model: "clef-flash"`, the entry as `state`, one `noul` question about spam, and `{ gateway: { id: "default" } }`. The result's type is loose, so in TypeScript cast it to `{ answers: { spam: { noul: number } } }`.
     - Set the threshold from the interview: hold anything questionable means about 0.5; only obvious spam means about 0.8. Say it's their policy to tune, not a fact about the model.
     - Store the entry with its `spam_score`, and `status = 'held'` at or over the threshold.
     - If the call to Clef fails, store the entry as held and log the error, so an outage never lets spam through. Ask the student whether they'd rather fail open, and why not.
     - Return the status, and have the page tell a visitor whose entry was held that it'll appear once it's been looked at.
     - `GET /api/entries` returns only approved entries.
  4. Verify before completing. YOU must, locally and then against the deployed URL after deploying:
     - `POST` a friendly entry and confirm it comes back approved and appears in `GET /api/entries`;
     - `POST` an obvious spam entry (e.g. "CHEAP WATCHES visit www.best-replicas.biz now 80% off") and confirm it comes back held and doesn't appear;
     - run `cf ai-gateway logs list --gateway-id default --per-page 5 --order-by created_at --order-by-direction desc` and confirm the `@cf/cloudflare/clef-flash` requests are there. Show the student the same logs on the dashboard's AI Gateway page (the `default` gateway's logs).
     If the gateway call fails because there's no `default` gateway, create it with `cf ai-gateway gateways create` (check `--help` for its flags) and retry. Don't trust the student saying it worked.
  5. Show them how to review held entries: `cf d1 query <database id> --sql "SELECT id, name, message, spam_score FROM entries WHERE status = 'held'"`, and approve one with an `UPDATE ... SET status = 'approved' WHERE id = ?` (pass the ID with `--params`). Wrangler projects: `npx wrangler d1 execute <database_name> --remote --command "..."`. Add these to the project's `AGENTS.md`.
  6. Comprehension check: ask the student what Clef returns for their question, and who decides what counts as spam. (A probability from 0 to 1; they do, by picking the threshold.) Gently correct anything off.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "get-notified".

  Out of scope here: an admin page for held entries, sign-in, rate limiting, CAPTCHAs (don't add Turnstile), and fine-tuning Clef.
---

# Moderate messages

A guestbook on the open internet gets spam, sooner or later. You could write rules for it, but spam changes faster than rules do. In this exercise you'll have a model screen every entry, and hold back the ones that look bad.

## What's a decision model?

Most AI models you've used generate text: you ask, they write. A decision model doesn't write anything. You give it some input, called the state, and a few typed questions, and it returns a probability for every allowed answer. A question can be:

- `noul`: yes or no. It returns the probability of yes.
- `choice`: one option from a set you define, like which team should handle a support ticket.
- `score`: a rating against a rubric you write.

There's no reply to parse and nothing to wait for while it reasons, so it's fast enough to sit in the middle of a request, and the answer is already in the shape your code needs.

## What's Clef?

[Clef](https://developers.cloudflare.com/workers-ai/models/clef-flash/) is a family of decision models trained by Cloudflare, running on [Workers AI](https://developers.cloudflare.com/workers-ai/), with open weights. You'll use Clef-flash, the fast one, which costs $0.038 per million input tokens. A guestbook entry is under 200 tokens, so the [free daily allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/) covers thousands of entries a day.

If you've heard of decision models before, it was probably [Jev](https://developers.cloudflare.com/ai/models/typesafe/jev/), from TypeSafe. Clef follows the same API, and Jev is in Cloudflare's model catalog too, so you can call it the same way through AI Gateway, as `typesafe/jev`. It's billed with [AI Gateway credits](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) rather than the Workers AI free allocation, so this exercise uses Clef.

## Spam detection in a few lines

Here's the whole idea, in a Worker that checks one entry:

```ts
import { env } from "cloudflare:workers";

export default {
  async fetch(request: Request) {
    const { name, message } = await request.json<{ name: string; message: string }>();

    const { answers } = await env.AI.run(
      "@cf/cloudflare/clef-flash",
      {
        model: "clef-flash",
        state: { name, message },
        questions: {
          spam: {
            type: "noul",
            instructions: "Is this guestbook entry spam, an ad, or abusive?",
          },
        },
      },
      { gateway: { id: "default" } },
    );

    const spam = (answers as { spam: { noul: number } }).spam.noul; // from 0 to 1
    return Response.json({ spam, held: spam > 0.8 });
  },
};
```

A friendly "Lovely site, thanks for sharing!" came back at about 0.02 when we tried it, and "CHEAP WATCHES visit www.best-replicas.biz now 80% off" at about 0.95. The model gives you a probability; where you draw the line is up to you.

## Why AI Gateway?

The last argument sends the request through [AI Gateway](https://developers.cloudflare.com/ai-gateway/), using your account's default gateway. Your code works the same either way, but now every decision is logged: you can see what Clef said about each entry, how long it took, and what it cost, without writing any logging yourself.

## What you'll build

Your guestbook, screening every new entry with Clef. Entries that look like spam are held back instead of deleted, so you can let through anything it got wrong.

## Prerequisites

- You've completed [Connect a database](/courses/build-a-guestbook/connect-a-database) and still have that project on disk.
