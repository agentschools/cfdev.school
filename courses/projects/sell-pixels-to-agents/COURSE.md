---
name: sell-pixels-to-agents
description: "Build a pixel canvas on a Worker and charge agents a penny per pixel with x402. Your own agent is the first customer."
compatibility: "Requires Agent setup, Node.js 22 or later, cf, and a Cloudflare account. SQLite Durable Objects work on Workers Free. The core course uses Base Sepolia and faucet USDC with no real value. An optional final exercise requires a separate, explicit decision about real funds and a mainnet facilitator."
metadata:
  author: Cloudflare Dev School
---

# Sell pixels to agents

Build a little shop where an agent buys a pixel, picks its color, and leaves a mark. Your own agent will be the first customer. The default canvas is 100×100, and each pixel costs a penny in test USDC.

The inspiration is Alex Tew's [Million Dollar Homepage](https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage), which sold space on a 1000×1000 grid for $1 a pixel in 2005. We're borrowing the idea of selling something small, over and over, to whoever shows up. You'll make your own page, without copying its assets, branding, or layout.

You'll use [x402](https://www.x402.org/), a payment protocol built around HTTP's `402 Payment Required` response, with Hono on a Worker and one SQLite-backed [Durable Object](https://developers.cloudflare.com/durable-objects/) keeping track of the canvas. You don't need the Durable Objects course first; your agent will explain the parts you use.

Everything through **Open the shop** uses Base Sepolia, a test network, and test USDC from the [Circle faucet](https://faucet.circle.com/). These tokens have no real value. The optional **Accept real payments** exercise lets you prepare a separate mainnet shop and, only if you choose, make one explicitly approved real payment. You can finish that exercise by keeping your shop on testnet and verifying that its buyer refuses mainnet.
