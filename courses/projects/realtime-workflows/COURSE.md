---
name: realtime-workflows
description: "Build real-time notifications for background jobs using Cloudflare Workflows, Durable Objects, RPC, and WebSockets."
metadata:
  author: James Quick
compatibility: "An AI coding agent with terminal access, Git, pnpm 11.9+, and Node.js 22.23+, 24.22+, or 26.12+. A Cloudflare account with Workers, Workflows, and Durable Objects access is needed for deployment. The project uses the cf CLI beta."
---

# Build real-time notifications

Learn how to enable real-time updates in a React app for asynchronous background jobs using:

- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [RPC](https://developers.cloudflare.com/workers/runtime-apis/rpc/)
- [WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

## What you'll build

By the end of this course, you'll have a React app that shows real-time status updates for background jobs. Behind the scenes, the background jobs are implemented using Cloudflare Workflows and real-time messages are coordinated using Durable Objects. This includes:

- A [Worker](https://developers.cloudflare.com/workers/) to handle HTTP and WebSocket requests
- Cloudflare Workflows to run durable stepped jobs
- A Durable Object to handle publishing status updates
- React app that receives updates over a WebSocket

In this specific example, you'll be building real-time updates around an AI powered blog post generation workflow. However, since the focus of this course is specifically on implementing real-time updates, you won't be implementing the blog post generation itself. Instead, you build the individual steps and simulate the work being done by waiting for a few seconds on each step.

## Prerequisites

To follow along, you'll need the following:

- Git
- Node.js 22+
- pnpm 11.9 or newer
- A Cloudflare account

With your Cloudflare account, you'll need access to Workers, Workflows, and Durable Objects for the final deployment.

Optionally, you'll need an AI coding agent if you'd like to follow the agentic learning flow.
