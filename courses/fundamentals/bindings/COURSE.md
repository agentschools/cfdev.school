---
name: bindings
description: "Learn what a Cloudflare binding is and why Workers are built around them: a permission and an API in one object, with no keys to leak and no URLs to forge, that you can point at different resources without changing your code. For students who've deployed a Worker."
compatibility: "Requires a Cloudflare account and the cf CLI, both set up in the Agent setup course. Builds on a deployed Worker, like the one from Workers basics."
metadata:
  author: Cloudflare Dev School
---

# Bindings

On most platforms, your code reaches a database or another service with a URL and a secret key. On Cloudflare, your Worker gets bindings instead: objects on `env` that are already connected to a resource, like a KV namespace, another Worker, or an AI model. This course is about why that design matters.

You'll see what a binding actually is, call one Worker from another without a public URL, point the same code at different resources, and finally hand a piece of untrusted code exactly the capabilities you choose and nothing else.

The course follows the ideas in Kenton Varda's post [Why Workers environment variables contain live objects](https://blog.cloudflare.com/workers-environment-live-object-bindings/), plus what Cloudflare has shipped since. Every exercise builds on the same Worker, and your agent checks each step itself before marking it complete.
