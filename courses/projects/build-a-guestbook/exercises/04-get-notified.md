---
description: "Get an email or a chat message whenever someone signs your guestbook."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the guestbook from "moderate-messages"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md` for its stack and commands. Read this course's interview (GET /api/students/{id}/interviews) for how they want to hear about entries, and confirm it with them. Email needs a domain on Cloudflare; without one, use Discord or Slack, or offer to add a domain first (Publish a website's "add-a-domain" exercise).

  Email path (https://developers.cloudflare.com/email-service/):
  1. The domain has to be set up for sending. Check with `cf email-sending subdomains list -z <domain>`. If it's not there, run `cf email-sending subdomains preview -z <domain> --name <domain>` first: it's read-only, and lists the DNS records sending needs (MX, SPF, and DKIM on `cf-bounce`, and DMARC on `_dmarc`) and any conflicts with existing records. Show the student, and if there's a conflict (often an existing DMARC record), ask before changing anything. With their OK, `cf email-sending subdomains create -z <domain> --name <domain>`. (The dashboard's Email Service > Email Sending > Onboard Domain does the same.)
  2. The address they'll get notifications at has to be a verified destination address on the account: sending to verified addresses is free on every plan, including Workers Free (https://developers.cloudflare.com/email-service/platform/pricing/). Check with `cf email-routing addresses list`. If it's missing, `cf email-routing addresses create --email <address>` sends a verification email; they click the link in it.
  3. Add the binding, restricted to that address:
     - `cf` projects: `EMAIL: bindings.sendEmail({ destinationAddress: "<address>", dev: { remote: true } })`, then `cf workers types`.
     - Wrangler projects: `"send_email": [{ "name": "EMAIL", "destination_address": "<address>", "remote": true }]`.
     `remote` makes local dev send real email through their account, so testing locally works too.
  4. Send with `env.EMAIL.send({ from: "guestbook@<domain>", to: "<address>", subject, text })`.

  Discord or Slack path:
  1. Have the student create an incoming webhook: in Discord, a channel's Edit Channel > Integrations > Webhooks; in Slack, an app with Incoming Webhooks turned on. They paste the URL to you.
  2. The URL is a secret: anyone with it can post to their channel. Store it as `NOTIFY_WEBHOOK_URL`:
     - `cf` projects: `NOTIFY_WEBHOOK_URL: bindings.secret()` in `env`, the value in `.env` for local dev, and `cf deploy --secrets-file .env` to set it on deploy. A Worker with an unset secret won't deploy.
     - Wrangler projects: the value in `.env` for local dev, and `npx wrangler secret put NOTIFY_WEBHOOK_URL` for production.
     Check `.env` is in `.gitignore` before writing it.
  3. Send with `fetch(env.NOTIFY_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json" }, body })`, where `body` is `JSON.stringify({ content })` for Discord or `JSON.stringify({ text })` for Slack.
  Don't suggest ntfy.sh's public server: from a Worker it returned "daily message quota reached", since many Workers share its per-IP limit.

  Both paths:
  - Write one `notify(entry)` function. The message says who signed it, what they wrote, and whether it was approved or held (with the spam score), so held entries don't go unnoticed. Point them to the review commands from "moderate-messages" for held ones.
  - Call it after the insert with `waitUntil(notify(entry))` (`import { waitUntil } from "cloudflare:workers"`), and return the response right away. Catch and log its errors inside `notify`: a failed notification must never fail the visitor's entry. Teach the body's "Don't make the visitor wait" section.
  - Mention Queues, as the body does, but don't build one.

  1. Verify before completing. YOU must:
     - locally, `POST` an entry and confirm the response came back without waiting on the notification, then ask the student to confirm the email or message arrived;
     - deploy, `POST` an entry to the deployed URL, and have them confirm that one arrived too, and that it says whether the entry was held.
     If it doesn't arrive: for email, check their spam folder, and that the domain and the address are verified; for webhooks, log the response status in `notify` and check it.
  2. Comprehension check: ask the student why the notification is sent with `waitUntil` instead of before the response. Gently correct anything off.
  3. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. This is the last exercise in the course. Suggest what's next, based on what they built: an admin page for held entries, the Durable Objects course for live updates, or another project.

  Out of scope here: building with Queues, receiving email (Email Routing), sending to visitors, digests, and other notification services.
---

# Get notified

A guestbook isn't much fun if you never find out someone signed it. In this exercise your Worker tells you about each new entry, whether Clef approved it or held it back.

## What you'll build

A notification for every new entry, the way you chose in the interview:

- An email from your own domain, sent with [Email Service](https://developers.cloudflare.com/email-service/). Sending to your own verified address is free on every plan. This needs a domain on Cloudflare.
- A post in a Discord or Slack channel, sent to an incoming webhook. No domain needed.

## Don't make the visitor wait

Sending an email or calling a webhook takes a moment, and sometimes fails. The person signing your guestbook shouldn't wait for it, or see an error because of it. So your Worker saves the entry, replies right away, and sends the notification afterward with [`waitUntil()`](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil), which keeps the Worker running until the notification has gone out:

```ts
import { waitUntil } from "cloudflare:workers";

waitUntil(notify(entry));
return Response.json({ status }, { status: 201 });
```

That's plenty for a guestbook. When background work has to survive failures, with retries, or there's a lot of it, the next step is a [Queue](https://developers.cloudflare.com/queues/): your Worker puts a message on it, and a consumer handles it separately, retrying if it fails.

## Prerequisites

- You've completed [Moderate messages](/courses/build-a-guestbook/moderate-messages) and still have that project on disk.
- For email, a domain on Cloudflare. Otherwise, a Discord server or Slack workspace where you can add a webhook.
