---
name: publish-a-website
description: "Build a website you actually want, publish it on Cloudflare, give it a guestbook backed by a SQL database, and put it on your own domain. For students who've finished Agent setup; no other course required."
compatibility: "Requires a Cloudflare account (the Workers Free plan works) and the cf CLI, both set up in the Agent setup course. A domain is optional: use one you have, buy one, or skip that part."
metadata:
  author: Cloudflare Dev School
---

# Publish a website

This is a project course: you start from something you want, a personal site, a page for a project, a small portfolio, and pick up the Cloudflare pieces you need along the way.

You'll describe the site to your agent, it'll help you build it, and you'll publish it as a Worker with [static assets](https://developers.cloudflare.com/workers/static-assets/). Then you'll add a guestbook that stores what visitors write in a [D1](https://developers.cloudflare.com/d1/) database, and finally put the whole thing on your own domain.

Want to go deeper on the pieces? The Workers course covers deploying Workers, and Bindings covers why `env.DB` works the way it does. Neither is required, and your agent adjusts if you've taken them.
