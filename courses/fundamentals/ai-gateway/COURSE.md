---
name: ai-gateway
description: "See and control your app's AI traffic without rewriting your code: log every request with who sent it, cut repeat model calls with caching and rate limits, route and fall back between models without redeploying, and block sensitive data or prompt injection before it reaches a model. For students who've deployed a Worker."
compatibility: "Requires a Cloudflare account (the Workers Free plan works) and the cf CLI, both set up in the Agent setup course. Uses Workers AI out of the box, with no external API keys required."
metadata:
  author: Cloudflare Dev School
---

# AI Gateway

<figure>
<video controls playsinline preload="none" width="1920" height="1080" crossorigin="anonymous" poster="/media/courses/ai-gateway/overview-poster.jpg">
<source src="/media/courses/ai-gateway/overview.mp4" type="video/mp4">
<track kind="captions" src="/media/courses/ai-gateway/overview-captions.vtt" srclang="en" label="English">
<a href="/media/courses/ai-gateway/overview.mp4">Watch the overview video</a>.
</video>
<figcaption>Why put a gateway in front of your model calls: visibility first, then control, by Thomas Desmond. <a href="/media/courses/ai-gateway/overview.mp4">Direct video link</a></figcaption>
</figure>

When an application calls an AI model directly, you're flying blind. Requests go straight from your code to a provider, and it's hard to answer basic questions: which feature or team is running up the bill, how often users ask the exact same question, what happens when a model slows down or errors out, or whether someone just pasted a credit card number or a prompt injection into your chat box.

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) sits between your application and the models it calls, whether those models run on [Workers AI](https://developers.cloudflare.com/workers-ai/), OpenAI, Anthropic, Google, or another provider. Pointing your requests through a gateway takes one option on the Workers AI binding (or one base URL change in an SDK), and gives you a single place to observe and control every request without rewriting your app.

Every exercise in this course builds on the same Worker, and your agent checks each step itself before marking it complete.
