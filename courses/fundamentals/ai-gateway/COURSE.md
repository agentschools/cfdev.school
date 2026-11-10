---
name: ai-gateway
description: "Put a single control plane in front of the AI models your app calls to observe traffic, control spend, route across models, and enforce security policies without rewriting your code. For students who've deployed a Worker."
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

When an application calls an AI model directly, you're flying blind: you can't easily see who is driving up token spend, avoid paying twice for repeat questions, swap or fall back between models without redeploying your app, or stop sensitive data and prompt injections before they reach a provider.

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) sits between your code and the models it calls, whether those models run on [Workers AI](https://developers.cloudflare.com/workers-ai/), OpenAI, Anthropic, or another provider. In this course, you'll put one Worker behind AI Gateway and learn how to observe and govern its model traffic from a single place.
