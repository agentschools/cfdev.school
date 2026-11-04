---
description: "Return a payment request and reserve each pixel until its payment is settled."
agent-instructions: |
  Read the interview and project AGENTS.md. Use x402 v2 exact USDC on
  eip155:84532 only. The body shows middleware registration, not a complete
  inventory implementation. Build and test the state machine before payments.
  
  1. Ask the student to predict the status/body of an unpaid PUT after a
     paywall is added. Wait. Add paymentMiddleware and x402ResourceServer
     from @x402/hono, HTTPFacilitatorClient from @x402/core/server, and
     ExactEvmScheme from @x402/evm/exact/server. Gate precisely
     PUT /pixels/:x/:y with their price as a decimal dollar string, seller
     public address and https://x402.org/facilitator. Check /supported first.
     Leave GET /, /canvas and later /llms.txt free. Remove ALL free write
     paths, aliases and debug routes.
  2. In the object's Hono app, put validation and an occupied/pending check
     BEFORE paymentMiddleware: invalid requests get 400/413 and taken squares
     get 409 even without a signature. This isn't a lock: concurrent requests
     can both pass during verification. Add an atomic claim in the verified
     handler too. The default exact flow skips settlement for handler >=400,
     but settles AFTER a successful handler. Don't publish the pixel there.
  3. Add purchases with an opaque random id, x, y, color, network, asset,
     payer, authorization nonce, status and settlement transaction. Unique
     (x,y) reserves inventory; UNIQUE(network,asset,payer,nonce) binds a USDC
     EIP-3009 authorization to one purchase. Normalize addresses. Decode the
     PAYMENT-SIGNATURE with decodePaymentSignatureHeader from @x402/core/http
     INSIDE the verified handler, and only accept the USDC EIP-3009 shape.
     Reject other flows such as Permit2/upto in this lesson. Never trust a
     client-supplied payer/receipt, or identify payments by raw signature/header
     hashes: equivalent encodings can differ. Never reuse an authorization
     for another coordinate or color. Don't log signed headers.
  4. Within this SAME object: validate -> SDK verify -> synchronous SQL
     transaction reserving square and payment identity as pending -> handler
     returns a small provisional 202 -> SDK settles -> persist the confirmed
     transaction and publish. Register outer Hono middleware BEFORE
     paymentMiddleware: its code after await next() sees the final SDK
     response. Commit only for a successful response with decoded
     PAYMENT-RESPONSE success:true and network eip155:84532 (decode with
     @x402/core/http). Associate the reservation using request-local context,
     never shared mutable state. Replace the provisional body with a confirmed
     receipt and 201 only after committing. Failed verification never reserves;
     a claim loser returns 409 before settlement. GET /canvas includes confirmed
     pixels plus the clearly identified free demo pixels from exercise 02.
  5. Pending/unknown is neither free nor sold. Persist BEFORE external I/O,
     without holding a SQL transaction or blockConcurrencyWhile across a
     facilitator request. Never auto-release a pending reservation on timeout:
     settlement may have succeeded. Add free GET /purchases/:id with status
     and public receipt data, no signed authorization. Return the opaque id
     on pending/error responses whenever a reservation was made, so clients
     can recover it; also let a client query by its authorization identity.
     On a repeated identity, first validate its binding to coordinate/color:
     existing confirmed returns its receipt, pending returns 202, changed
     target returns 409, all WITHOUT another settle. A lookup before SDK
     verification may return public status only; it must never grant ownership
     or trigger repair. Never release/reconfirm on a buyer's word.
  6. A crash after settlement but before confirmation needs reconciliation.
     Preserve pending records and the non-secret authorization identity/value
     and validity window. Read USDC authorizationState plus the matching
     AuthorizationUsed/Transfer events and transaction receipt to establish
     nonce, payer, recipient and amount before an operator confirms a pixel.
     Never infer payment from an account balance or client transaction hash
     alone. Leave uncertain pixels locked and pause sales rather than refunding
     or retrying transfers. Operator repair is private and idempotent.
  7. Send an unpaid curl PUT and decode PAYMENT-REQUIRED. Compare their
     prediction with version 2, exact, eip155:84532, USDC contract, payTo,
     amount and timeout. Default $0.01 is 10000 atomic units. Test malformed
     signature, invalid JSON, out-of-range coordinates and a free demo pixel:
     the occupied pixel gives 409 and is never resold.
  8. Verify before completing: typecheck/build pass; unpaid valid PUT is 402
     with correct requirements and no inventory change; invalid/occupied
     requests avoid verify/settle. With an injected fake facilitator in LOCAL
     TESTS ONLY, prove handler 409 never settles, simultaneous verified claims
     settle once, failed settlement doesn't publish, restart retains pending,
     duplicate/changed-target identities never settle again, and success
     publishes once. Inject a crash between settle and commit and prove pending
     remains for repair. Keep mocks/bypasses out of the deployed entrypoint.
     Record evidence and recovery limitations in project AGENTS.md.
  9. Comprehension check: ask how verification differs from settlement, and
     why a pre-middleware availability check doesn't settle the race. Wait.
  10. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
      Then move on to buy-a-pixel.
---

# Charge for pixels

Turn the free writer into a shop. A request for an available pixel now receives `402 Payment Required`, with instructions for paying in test USDC. An occupied square returns `409 Conflict` without asking for payment.

## The payment handshake

The first request has no payment. The server replies with a `PAYMENT-REQUIRED` header: base64-encoded JSON describing the price, token, network, and recipient. The buyer signs an authorization and sends a second request with `PAYMENT-SIGNATURE`. The facilitator verifies it, then settles it on the blockchain.

Your agent will use the [x402 v2 Hono integration](https://github.com/x402-foundation/x402/tree/main/typescript/packages/http/hono). This fragment shows the paywall; reservation and confirmation logic surrounds it:

```ts
const server = new x402ResourceServer(
  new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" }),
).register("eip155:84532", new ExactEvmScheme());

app.use(paymentMiddleware({
  "PUT /pixels/:x/:y": {
    accepts: [{
      scheme: "exact",
      price: "$0.01", // use your chosen price
      network: "eip155:84532",
      payTo: PAY_TO, // your public receiving address
    }],
    description: "Buy one pixel with test USDC",
  },
}, server));
```

## Reserve, settle, confirm

Verification checks whether an authorization is valid. Settlement moves the tokens. A valid authorization can still fail to settle.

The middleware runs your handler before settlement. If the handler returns an error such as `409`, the default exact flow skips settlement. But if the handler paints the square and settlement fails afterward, you've given away a pixel. Instead, reserve the square, wait for settlement, and publish only a confirmed pixel.

```text
available -> pending -> confirmed
                |
                +-> unknown outcome: keep reserved, investigate
```

Two verified buyers can race. The database admits one reservation, and the loser returns `409` before being charged. If the network disappears after a payment, the pending record survives a restart. A retry checks that record instead of buying again. There is no transaction that atomically spans SQLite and a blockchain; recovering an uncertain payment takes a separate check.
