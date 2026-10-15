---
description: "Put your site on your own domain: one you already have, or one you find and buy from the command line with Cloudflare Registrar."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the site from "deploy"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md` for its stack. Read this course's interview (GET /api/students/{id}/interviews) for whether they have a domain, and confirm it with them, since it may have changed. Pick the path that fits:

  - Domain on Cloudflare already: go straight to step 1.
  - Domain somewhere else: they can add it to Cloudflare as a zone and point their registrar at Cloudflare's nameservers (https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/). The nameserver change can take up to 24 hours, so they may need to come back and finish this exercise later. Moving the registration itself (a transfer) is optional and not needed for this.
  - No domain, and they want one: teach the body's "Find and buy a domain" section, then:
    1. Brainstorm names with them from what the site is about. Check several at once with `cf registrar registrations check <name> <name> ...`, which is read-only and returns whether each is registrable and its registration and renewal price.
    2. Once they've picked one, check what buying needs, and tell them before anything else: a default payment method on the account, plus a default registrant contact and the Domain Registration Agreement accepted on the dashboard's registrations page (https://developers.cloudflare.com/registrar/registrar-api/). The registration uses that default contact.
    3. Show them the request with `cf registrar registrations create <domain> --dry-run`. It prints the API call without sending it.
    4. The purchase is theirs to make, never yours: a registration costs real money and isn't refundable. Give them the exact command, `cf registrar registrations create <domain>`, to run in their own terminal, where `cf` rechecks availability and price and asks them to confirm. Never run `create` yourself without `--dry-run`, and never pass `--force`. Mention `--auto-renew` (off by default) and that WHOIS privacy (`--privacy-mode redaction`) is on by default where the TLD supports it.
    5. Once it's registered, it's already a zone on Cloudflare: go to step 1.
  - No domain, and they don't want one: that's fine. Explain the steps below in a few sentences so they know what they'd do later, confirm the site still works on its `*.workers.dev` URL, and mark the exercise complete. Say plainly that they can come back to it.

  1. Pick the hostname with them: the bare domain (`example.com`) or a subdomain (`www.example.com`, `blog.example.com`). The hostname must not already have a DNS record; if it does, ask before removing it (it may be in use).
  2. Add it to the config as a custom domain (https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), keeping the `*.workers.dev` URL on too, since adding a domain turns it off otherwise:
     - `cf` projects (`cloudflare.config.ts`): add `domains: ["<hostname>"]` and `workersDev: true` to the worker. (The deploy warning about `workersDev` mentions a "Wrangler file", but it means this setting.)
     - Wrangler projects (Astro, EmDash): add `"routes": [{ "pattern": "<hostname>", "custom_domain": true }]` and `"workers_dev": true` to `wrangler.jsonc`.
  3. Deploy the same way as in "deploy". The output lists the hostname as a custom domain. Cloudflare creates the DNS record and the TLS certificate for it.
  4. Verify before completing. YOU must:
     - fetch `https://<hostname>/` and confirm it's their site;
     - fetch the `*.workers.dev` URL and confirm it still works too.
     It's usually live within a minute; retry for a few minutes before assuming something's wrong. If the hostname doesn't resolve on the student's machine but `dig +short <hostname> @1.1.1.1` returns addresses, their computer cached an earlier "not found" from before the record existed: check with `curl --resolve <hostname>:443:<address> https://<hostname>/`, and tell them it'll clear on its own (or after flushing their DNS cache). Don't trust the student saying it worked.
  5. Teach the point, briefly:
     - A custom domain points the whole hostname at the Worker. Cloudflare manages the DNS record and certificate, and removing the domain from the config (or deleting the Worker) removes them.
     - Their site is now theirs: a domain they control, served from Cloudflare's network.
  6. Comprehension check: ask the student what Cloudflare set up for them when they deployed with the domain in their config. Gently correct anything off.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. This is the last exercise in the course. Suggest what's next, based on what they built: Build a guestbook to let visitors leave a note, Bindings or Durable Objects to go deeper, or another project.

  Out of scope here: routes that share a hostname with another service (`triggers.fetch()`), email on the domain, redirecting `www` to the bare domain, and domain transfers beyond mentioning them.
---

# Add a domain

Your site works, but `something.workers.dev` isn't much of an address. In this exercise you'll put it on a domain of your own.

There are a few ways to get there, depending on where you're starting:

- You already have a domain on Cloudflare: you're a config line away.
- You have a domain somewhere else: you can point it at Cloudflare, which can take up to a day.
- You don't have one: you can find and buy one from the command line.
- You don't want one yet: that's fine. You'll see what you'd do, and you can come back later.

## Find and buy a domain

[Cloudflare Registrar](https://developers.cloudflare.com/registrar/) sells domains at cost, with no markup, and `cf` can search for them:

```sh
cf registrar registrations check mysite.com mysite.dev
```

That tells you which names are available and what each costs, without buying anything. When you've picked one, you buy it yourself, in your own terminal:

```sh
cf registrar registrations create mysite.dev
```

`cf` checks the price again and asks you to confirm before it charges your account. Your agent will never run this for you: a domain costs real money, and registrations aren't refundable.

## What you'll build

Your site, served at your own domain as a [custom domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), with Cloudflare handling the DNS record and certificate. Your `*.workers.dev` URL keeps working too.

## Prerequisites

- You've completed [Deploy](/courses/publish-a-website/deploy) and still have that project on disk.
- Optionally, a domain name. To buy one, a payment method on your Cloudflare account.
