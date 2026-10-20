---
description: "Deploy your blog, lock down its admin, and optionally put it on your own domain."
agent-instructions: |
  1. EmDash deploys with Wrangler, which doesn't share cf's login. Run
     `npx wrangler whoami`; if not signed in, `npx wrangler login`. If it
     stops with "More than one account available", add "account_id" to
     wrangler.jsonc.
  2. Before deploying, ask the student: will the post they wrote locally
     be on the live site? Wait for the answer. (No: production gets its
     own D1 database. Local content stays local.)
  3. Run `npm run deploy`. The first deploy creates the real D1 database
     and R2 bucket. Give the student the workers.dev URL it prints.
  4. Right away, have the student open <url>/_emdash/admin/ and finish
     the setup wizard. Explain why it's urgent: until setup is done, the
     first person to visit becomes the admin.
  5. Have them publish one post on the live site (they can paste their
     local one).
  6. Domain, optional: if their interview says they own a domain on
     Cloudflare, add "routes": [{ "pattern": "<hostname>",
     "custom_domain": true }] and "workers_dev": true to wrangler.jsonc,
     show them the change, wait for their OK, and redeploy. If they don't
     have a domain, tell them the blog is complete on workers.dev and
     they can come back to this step any time.
  7. Verify before completing: fetch the live URL (their domain if they
     added one, otherwise workers.dev) and confirm a 200 with their blog
     title, and fetch the live post's URL and confirm its title. A new
     deploy can take about 30 seconds to start serving; retry first.
     Don't trust the student saying it worked.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt
     describes. Then start "post-with-your-agent".
---

# Go live

Your blog works on your computer. Now it goes on the internet.

## Your live blog has its own data

When you deploy, Cloudflare creates a real database and a real image bucket for your blog. They start empty. The post you wrote on your computer stays on your computer, so you'll publish again on the live site.

## Lock the door first

A brand-new EmDash site lets the first visitor set up the admin account. So the moment your blog is live, open its admin and finish setup yourself.

## Your own domain (optional)

Your blog starts at a free `workers.dev` address. If you own a domain on Cloudflare, you can put the blog on it in one config change. If you don't, your blog is done without one.
