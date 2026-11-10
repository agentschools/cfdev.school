---
name: realtime-workflows
description: "Build a React app that reports background-job progress in real time with Cloudflare Workflows, Durable Objects, RPC, and WebSockets."
metadata:
  author: James Quick
compatibility: "Git, pnpm 11.9+, and Node.js ^22.23.0, ^24.22.0, or >=26.12.0. The starter pins the cf CLI beta. A Cloudflare account with Workers, Workflows, and Durable Objects access is needed for deployment."
---

# Build real-time notifications

Start with a supplied React app, then build the backend that reports progress for background jobs. A Cloudflare [Workflow](https://developers.cloudflare.com/workflows/) runs each job through 4 simulated stages. A [Durable Object](https://developers.cloudflare.com/durable-objects/) stores the latest progress snapshot and sends updates over [WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/). The Worker calls the Durable Object through [RPC](https://developers.cloudflare.com/workers/runtime-apis/rpc/), and the React app displays the updates.

The stages simulate work; they do not call an AI service. The app has no authentication, so anyone with a job link can view that job's progress. Treat job links as shareable.
