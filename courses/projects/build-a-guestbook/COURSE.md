---
name: build-a-guestbook
description: "Add a guestbook to a website: a form and a list of entries, saved in a D1 database, screened for spam by a decision model, with a notification for each new entry. For students who've finished Agent setup; Publish a website is a good place to start, but not required."
compatibility: "Requires a Cloudflare account (the Workers Free plan works) and the cf CLI, both set up in the Agent setup course. Email notifications need a domain on Cloudflare; without one, notifications go to a Discord or Slack webhook instead."
metadata:
  author: Cloudflare Dev School
---

# Build a guestbook

A guestbook is a small feature with most of what a real app needs: a form, somewhere to keep what people write, a way to keep out spam, and a way to hear about new entries.

You can add it to the site you built in [Publish a website](/courses/publish-a-website), to any other app you have on Cloudflare, or to a new Worker made just for it. You'll build the form and list first, then store entries in a [D1](https://developers.cloudflare.com/d1/) database, screen each one with [Clef](https://developers.cloudflare.com/workers-ai/models/clef-flash/), a decision model on Workers AI, and get a notification whenever someone signs it.
