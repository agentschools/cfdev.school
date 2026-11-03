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

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) sits between your application and the models it calls — whether those models run on [Workers AI](https://developers.cloudflare.com/workers-ai/), OpenAI, Anthropic, Google, or another provider. Pointing your requests through a gateway takes one option on the Workers AI binding (or one base URL change in an SDK), and gives you a single place to observe and control every request without rewriting your app.

In this course, you'll build one small Worker and layer four controls onto its AI traffic in under 30 minutes:

- **See every request:** route model calls through a gateway, attach server-side metadata (`user`, `team`), and inspect tokens, latency, and cost in the live logs.
- **Cache and rate limit:** serve repeat questions straight from the gateway's cache for `$0` and cap how many requests a minute the gateway accepts.
- **Route and fall back:** move model choice out of your code and into a named dynamic route that picks models by team, falls back on failure, and updates without redeploying your Worker.
- **Block bad prompts:** stop prompt injections and sensitive data at the gateway with Guardrails and DLP before they ever reach a model.
