---
name: durable-objects
description: "Learn what a Durable Object is and when you need one: a small piece of compute with its own storage, addressed by name, that every request for that name reaches. Build a counter that can't lose updates, a message store in SQLite, and a real-time room over WebSockets. For students who've deployed a Worker."
compatibility: "Requires a Cloudflare account (the Workers Free plan works) and the cf CLI, both set up in the Agent setup course. Builds on deploying a Worker, like in the Workers course."
metadata:
  author: Cloudflare Dev School
---

# Durable Objects

A Worker runs wherever a request lands, and any number of copies can run at once. That's what makes it fast and cheap, but it also means two requests can't easily agree on anything: there's no one place where "the current count" or "everyone in this chat room" lives.

A [Durable Object](https://developers.cloudflare.com/durable-objects/) is that one place. You give it a name, and every request for that name, from anywhere in the world, reaches the same object, with its own private storage right next to its code.

In this course you'll build one Worker with two kinds of Durable Objects: a counter that stays correct under a burst of simultaneous requests, and a room that stores messages in its own SQLite database and broadcasts them to everyone connected over WebSockets. Your agent checks each step itself before marking it complete.
