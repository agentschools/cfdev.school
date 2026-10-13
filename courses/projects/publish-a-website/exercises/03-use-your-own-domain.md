---
description: "Put your site on your own domain: one you already have on Cloudflare, one you move to Cloudflare, or one you buy at cost."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the site from the earlier exercises; check GET /api/progress/{studentId} first. Read this course's interview (GET /api/students/{id}/interviews) for whether they have a domain, and confirm it with them, since it may have changed. Pick the path that fits:

  - Domain on Cloudflare already: go straight to step 1.
  - Domain somewhere else: they can add it to Cloudflare as a zone and point their registrar at Cloudflare's nameservers (https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/). The nameserver change can take up to 24 hours, so they may need to come back and finish this exercise later. Moving the registration itself (a transfer) is optional and not needed for this.
  - No domain: explain Cloudflare Registrar, which sells domains at cost, with no markup (https://developers.cloudflare.com/registrar/). If they want one, help them pick a name and check it: `cf registrar registrations check <name>` reports whether it's available and its price. A domain costs real money and the fee isn't refundable, so the purchase is theirs to make, on the dashboard's Register domains page, which needs a verified account email (https://developers.cloudflare.com/registrar/get-started/register-domain/). Never buy one for them. Once it's registered, it's already a zone on Cloudflare: go to step 1.
  - No domain and they don't want one: that's fine. Explain the steps below in a few sentences so they know what they'd do later, confirm the site still works on its `*.workers.dev` URL, and mark the exercise complete. Say plainly that they can come back to it.

  1. Pick the hostname with them: the bare domain (`example.com`) or a subdomain (`www.example.com`, `blog.example.com`). The hostname must not already have a DNS record; if it does, ask before removing it (it may be in use).
  2. In `cloudflare.config.ts`, add `domains: ["<hostname>"]` to the worker. Also add `workersDev: true`: adding `domains` turns off the `*.workers.dev` URL unless it's set explicitly (the deploy warning about this mentions a "Wrangler file", but it means this setting).
  3. Deploy with `cf deploy`. The output lists `<hostname> (custom domain)`. Cloudflare creates the DNS record and the TLS certificate for it (https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
  4. Verify before completing. YOU must:
     - fetch `https://<hostname>/` and confirm it's their site, and `https://<hostname>/api/entries` and confirm the guestbook API answers;
     - fetch the `*.workers.dev` URL and confirm it still works too.
     It's usually live within a minute; retry for a few minutes before assuming something's wrong. If the hostname doesn't resolve on the student's machine but `dig +short <hostname> @1.1.1.1` returns addresses, their computer cached an earlier "not found" from before the record existed: check with `curl --resolve <hostname>:443:<address> https://<hostname>/`, and tell them it'll clear on its own (or after flushing their DNS cache). Don't trust the student saying it worked.
  5. Teach the point, briefly:
     - A custom domain points the whole hostname at the Worker. Cloudflare manages the DNS record and certificate, and removing the domain from the config (or deleting the Worker) removes them.
     - Their site is now theirs: a domain they control, assets served free from Cloudflare's network, and a small API and database for anything dynamic.
  6. Comprehension check: ask the student what Cloudflare set up for them when they deployed with `domains`. Gently correct anything off.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. This is the last exercise in the course. Suggest what's next, based on what they built: Bindings or Durable Objects to go deeper, or another project.

  Out of scope here: routes (`triggers.fetch()`), email on the domain, redirecting `www` to the bare domain, and domain transfers beyond mentioning them.
---

# Use your own domain

Your site works, but `something.workers.dev` isn't much of an address. In this exercise you'll put it on a domain of your own.

There are a few ways to get there, depending on where you're starting:

- You already have a domain on Cloudflare: you're a config line away.
- You have a domain somewhere else: you can point it at Cloudflare, which can take up to a day.
- You don't have one: [Cloudflare Registrar](https://developers.cloudflare.com/registrar/) sells domains at cost. Buying one is up to you. You can also skip this part and come back later.

## What you'll build

Your site and its guestbook, served at your own domain as a [custom domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), with Cloudflare handling the DNS record and certificate. Your `*.workers.dev` URL keeps working too.

## Prerequisites

- You've completed [Add a guestbook](/courses/publish-a-website/add-a-guestbook) and still have that project on disk.
- Optionally, a domain name.
