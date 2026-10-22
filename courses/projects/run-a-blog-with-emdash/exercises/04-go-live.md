---
description: "Deploy your blog, lock down its admin, and optionally put it on your own domain."
agent-instructions: |
  1. EmDash deploys with Wrangler, which doesn't share cf's login. Run
     `npx wrangler whoami`; if not signed in, `npx wrangler login`. If it
     stops with "More than one account available", add "account_id" to
     wrangler.jsonc.
  2. Before deploying, ask the student: will the post they wrote locally
     be on the live site? Wait for the answer. (No: local and production
     use separate D1 databases, including when production already exists.)
  3. Inspect wrangler.jsonc and the interview. If the project already has
     the student's domain as a custom-domain route, keep it. Otherwise, if
     they want to use a domain on Cloudflare, propose adding
     "routes": [{ "pattern": "<hostname>", "custom_domain": true }] and
     "workers_dev": true, then wait for their OK. If they don't have a
     domain, use the workers.dev address.
  4. Run `npm run deploy`. A new deployment creates its production D1
     database and R2 bucket; a project deployed in Publish a website reuses
     the resources named in its config. Give the student the workers.dev
     URL, and wait for the custom domain to serve the site if they added one.
  5. Choose the setup path:
     - For a new production database, immediately open the admin on the
       final address (the custom domain if added, otherwise workers.dev) and
       finish setup. Until then, the first visitor can become the admin.
     - If the site was already set up and is moving to a new domain, keep
       the old admin session open. Follow EmDash's Change domain flow
       (https://docs.emdashcms.com/guides/change-domain/), continue onto the
       new domain, and register a passkey there. Passkeys only work on the
       hostname where they were created.
     - If the existing site is staying on its current address, sign in and
       continue; don't claim its setup or resources are new.
  6. Have the student publish one post on the live site (they can paste
     their local one).
  7. Verify before completing: fetch the final live URL and confirm a 200
     with their blog title, and fetch the live post's URL and confirm its
     title. A new deploy can take about 30 seconds to start serving; retry
     first. Don't trust the student saying it worked.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt
     describes. Then start "post-with-your-agent".
---

# Go live

Your blog works on your computer. Now it goes on the internet.

## Your live blog has its own data

The first time you deploy a blog, Cloudflare creates a production database and image bucket. A blog you already deployed keeps its existing production resources. Either way, local and production data are separate, so a post written on your computer doesn't appear on the live site automatically.

## Lock the door first

A brand-new EmDash site lets the first visitor set up the admin account. So the moment your blog is live, open its admin and finish setup yourself.

## Your own domain (optional)

Your blog gets a free `workers.dev` address. If you own a domain on Cloudflare, you can route it to the blog too. Set up a new site on the address you intend to use. When moving an existing site, EmDash also moves its Site URL and asks you to register a passkey for the new hostname. If you don't have a domain, your blog is done without one.
