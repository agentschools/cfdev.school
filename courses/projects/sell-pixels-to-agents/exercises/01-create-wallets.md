---
description: "Create disposable test wallets and fund the buyer with test USDC."
agent-instructions: |
  Guide the student end to end. Read this course's interview. Teach the body's
  concepts before using them. Keep every exercise through open-the-shop on
  eip155:84532; never silently fall back to mainnet or another token.
  
  1. Ask for a short lowercase directory and Worker name based on the shop's
     name, and wait. Use cf cli search to check current commands, then
     `cf init <name>`. This makes a Vite Worker, but doesn't initialize Git.
     If the new directory isn't already inside a Git repository, run
     `git init` there; otherwise use the existing repository. Install hono,
     viem, and all
     four x402 packages together: @x402/hono@2.28.0, @x402/core@2.28.0,
     @x402/evm@2.28.0, @x402/fetch@2.28.0. Keep the lockfile. Add an AGENTS.md
     recording the choices, cf commands, testnet-only rule, and disposable keys.
  2. Before making keys, ignore .env, .env.*, .dev.vars, .dev.vars.* and local
     state, with an exception for a key-free .env.example. Verify with
     git check-ignore. Explain what a private key authorizes and wait for
     permission to generate two disposable TESTNET keys. If the harness needs
     human key creation, have the student do it locally. Use generatePrivateKey
     and privateKeyToAccount from viem/accounts in a local script; write
     TEST_BUYER_PRIVATE_KEY and TEST_SELLER_PRIVATE_KEY directly to .env with
     mode 0600 and exclusive creation so a rerun cannot replace wallets.
     Never print keys, put them in commands/chat, or commit them. Show only
     public addresses. The Worker needs the seller's PUBLIC PAY_TO address;
     neither private key belongs in Worker bindings, browser code or logs.
  3. Ask the student to open https://faucet.circle.com/ in their browser,
     choose USDC and Base Sepolia, and paste the buyer's PUBLIC address.
     They handle login, challenges and terms themselves. Don't buy or bridge
     tokens, create provider accounts or fund with real money. Faucet limits
     change: the public page advertised 20 USDC per address/network every
     two hours when checked, enough for 2000 penny pixels. It requires no
     Circle account, but uses reCAPTCHA and links terms for the student to
     review. Record the amount actually received; don't promise delivery.
     If unavailable, report the funding blocker and leave incomplete.
  4. Verify https://x402.org/facilitator/supported includes version 2, exact,
     eip155:84532. Use a read-only viem public client on Base Sepolia to check
     the buyer's USDC balance against Circle's current contract list
     (0x036CbD53842c5426634e7929541eC2318f3dCF7e when checked). Six decimals
     means the default penny is 10000 atomic units. Confirm enough balance for
     several pixels at their chosen price. Read the native ETH balance too.
     The exact EIP-3009 path should need no buyer ETH because the facilitator
     submits settlement. Don't send approvals or buy ETH to work around a
     failure; investigate the scheme instead.
  5. Verify before completing: inspect ignore rules and permissions without
     displaying key contents, derive and compare both public addresses locally,
     and check public config contains only the receiving address. Record
     network, contract, balance and facilitator capability in project AGENTS.md.
     Don't store keys or signed authorizations in that file.
  6. Comprehension check: ask what someone with the buyer key could do, and
     whether these faucet tokens can become dollars. Wait and correct errors.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
     Then move on to draw-a-canvas.
---

# Create wallets

Your shop needs an address to receive payments, and your agent needs a separate wallet to buy a pixel. You'll make two disposable test wallets and fund the buyer with test USDC.

## Addresses and keys

A public address is like a destination on an envelope: you can share it so someone can pay you. A private key lets its holder authorize payments. It stays on your computer, in an ignored `.env` file. Your Worker only needs the receiving address.

**Never reuse these keys for real money.** The next exercises are a place to make mistakes with tokens that have no value.

## Test dollars

[USDC](https://developers.circle.com/stablecoins/what-is-usdc) is a stablecoin intended to track the US dollar. Test USDC on Base Sepolia is a practice token. Even though the price says $0.01, no dollars move during the core course.

You'll request test USDC from the [Circle faucet](https://faucet.circle.com/). Choose **Base Sepolia**, not Base. Your agent checks the balance on that network using [Circle's contract list](https://developers.circle.com/stablecoins/usdc-contract-addresses).

## The facilitator

A facilitator checks the buyer's signed authorization and submits it to the blockchain. For this course you'll use the public [x402 test facilitator](https://x402.org/facilitator/supported), without an API key. On the exact USDC payment path, it pays the transaction's gas fee, so the buyer should only need test USDC. You'll verify that with a purchase later.
