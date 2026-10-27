---
description: "Give your agent a test-token budget and buy its first pixel."
agent-instructions: |
  Read the interview and project AGENTS.md. Keys stay in ignored local .env.
  The buyer is a local Node script, never browser or Worker code.
  
  1. Ask the student to choose a free square, color, and maximum TEST USDC
     spend for this purchase. Wait. State origin, eip155:84532, token contract,
     recipient and exact price before signing. Price and balance aren't a budget.
  2. Build scripts/buy-pixel.ts with wrapFetchWithPayment from @x402/fetch,
     x402Client from @x402/core/client, ExactEvmScheme from
     @x402/evm/exact/client, and privateKeyToAccount from viem/accounts.
     Load .env with Node --env-file and use a local TS runner if needed.
     Register ONLY eip155:84532. Set
     setSpendControls({ maxAmountPerPayment: capDecimal }) and a registerPolicy
     filter for v2, exact, expected USDC contract, expected payTo and a positive
     integer atomic amount <= cap. Reject empty results; never transform the
     advertised price. Convert the decimal cap using viem parseUnits(cap,6),
     not floating point. Reject zero/negative caps and more than six decimal
     places before parsing; don't let parseUnits round an invalid budget.
     The SDK default cap isn't the student's budget.
  3. Bind the script to the chosen origin and exact route/body. Require HTTPS
     except localhost, redirect:"error" on EVERY request, and a bounded fetch
     timeout. Never follow resource URLs supplied in payment metadata.
     Use onBeforePaymentCreation to allow at most ONE signing attempt; consume
     the allowance BEFORE signing, including failures. No recovery hook that
     signs again, no batch/retry loop, and no signed headers in logs. Save the
     non-secret authorization identity locally so lost responses can be queried.
     Use onAfterPaymentCreation to persist only network, asset, payer, nonce,
     value and validity window before sending; never persist a signed header.
     Restarting requires checking the previous purchase and a new explicit
     budget decision. Multiple purchases need a persistent aggregate budget
     journal counting committed AND unresolved spend, not just a per-call cap.
  4. Test synthetic challenges with a signer spy before using the real key:
     over-cap price, wrong network/token/recipient, malformed/negative amount,
     redirects and a second signing attempt all fail without a new signature.
     The exact approved price passes policy. Never disable checks for the demo.
  5. Record both wallets' test USDC and buyer ETH balances, then send the PUT
     with wrapFetchWithPayment. Decode PAYMENT-RESPONSE using @x402/core/http,
     require success and correct network, fetch /canvas yourself, and inspect
     https://sepolia.basescan.org/ for the transaction. Independently read its
     successful receipt and USDC transfer token, payer, payTo and amount over
     RPC. Confirm buyer/seller USDC deltas and whether buyer ETH was unchanged.
     A valid signature or a 200 without chain evidence isn't a paid pixel.
  6. On timeout, settlement error or pending status, STOP PAYING. Query the
     purchase id or locally recorded authorization identity and use the
     charge-for-pixels reconciliation procedure. Don't sign again, release
     the reservation, or buy ETH. Insufficient test USDC sends you back to the
     faucet, never to another network.
  7. Verify before completing: rejection tests pass, exactly one confirmed
     pixel matches the choice, receipt/chain/balances agree, and another unpaid
     attempt at that square returns 409. Record the public test transaction
     link and actual gas result in AGENTS.md. Leave incomplete if funded
     settlement hasn't succeeded and explain the exact blocker.
  8. Comprehension check: ask why a cap must run before signing, and why a
     timeout isn't permission to pay again. Wait and correct errors.
  9. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
     Then move on to open-the-shop.
---

# Buy a pixel

Your agent is the first customer. Choose a square and a color, give it a small test-token budget, and watch the pixel appear.

## A budget before a signature

[`@x402/fetch`](https://github.com/x402-foundation/x402/tree/main/typescript/packages/http/fetch) wraps ordinary `fetch`: it sees the 402, signs an authorization, and sends the request again. You'll add checks before signing so it can only pay the shop, token, network, and price you approved.

USDC has six decimal places. A penny is `10000` atomic units. Your agent compares integers so rounding can't turn an over-budget price into an acceptable one. This buyer gets one signing attempt per approved run. A per-payment cap alone would still allow a loop to buy thousands of pixels.

## See the payment

The pixel is one piece of evidence. You'll also look at the receipt and USDC transfer on [Base Sepolia's explorer](https://sepolia.basescan.org/), and compare the two wallets' balances. The facilitator should submit the transaction without the buyer spending ETH. You'll check that rather than assume it.

If a response gets lost, stop and check the purchase. A timeout can mean payment succeeded but the receipt never reached you. Paying again is a new action, not a harmless retry.
