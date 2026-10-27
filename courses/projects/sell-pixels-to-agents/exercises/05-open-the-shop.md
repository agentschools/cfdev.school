---
description: "Deploy your testnet shop and help another agent buy a pixel."
agent-instructions: |
  Read the interview and project AGENTS.md. This remains testnet-only.
  
  1. Add free GET /llms.txt with the canonical origin, dimensions, price,
     eip155:84532, USDC contract, payTo, GET /canvas, PUT /pixels/:x/:y body
     { color: "#rrggbb" }, and purchase status lookup. Document bounds,
     400/413 invalid request, 409 occupied, 402 required, 202 pending,
     201 confirmed, payment headers, budget checks and uncertain outcomes.
     Require visiting agents to ask their user for a test-token budget before
     signing. Include the buyer example without keys. Discovery isn't consent.
  2. Keep body limits and add a modest shared rate limit before facilitator
     calls using current cf rateLimit binding docs. A rejected request gets
     429 without reservation/payment. Never echo arbitrary HTML or signed
     headers. No free writer, test bypass, signing key or seller private key
     may enter the bundle. Keep operator repair private; never expose an
     unauthenticated confirm/release endpoint.
  3. Run typecheck and cf build, show the student the config and public page,
     then cf deploy on Workers Free with SQLite Durable Objects. If a plan
     upgrade or paid resource is required, stop and explain the requirement;
     don't accept it for them. Deployed state starts separately: local SQLite
     pixels aren't uploaded. Keep Base Sepolia/test USDC labels visible.
  4. Fetch deployed /, /canvas and /llms.txt yourself. Check an available pixel
     gives v2 402 with the correct testnet, payTo and price; malformed and
     oversized inputs fail. Ask for a deployed square/color and explicit
     test-token cap, wait, and buy with the bounded script. Verify the chain
     receipt and pixel. Local payment doesn't verify the deployed path.
     If auth/deploy/facilitator is unavailable, report it and leave incomplete.
  5. Have the student share the URL with a fresh agent session or a friend's
     agent; do not message anyone yourself. A fresh session of their own is
     sufficient. Ask them to predict what the visitor needs from /llms.txt,
     then compare with its request. The visitor needs its own disposable
     wallet and user's budget. Never share the first buyer's key for convenience.
     Apply create-wallets and buy-a-pixel safety rules to the second customer.
  6. Verify before completing: fetch /canvas and compare the second customer's
     coordinate/color and receipt with its test USDC transfer; an unpaid
     repeat returns 409. Test rate limiting with a local stub or a small bounded
     test, without flooding the facilitator. Record deployment URL, public
     test transaction links and known limitations; show both paid pixels.
  7. Comprehension check: ask whether /llms.txt gives an agent permission to
     spend, and what happens to local pixels on deploy. Wait and correct errors.
     Introduce accept-real-payments as optional; staying on testnet counts.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
     Then move on to accept-real-payments.
---

# Open the shop

Put your canvas on a public URL and invite another agent to buy a pixel. The shop still takes test USDC on Base Sepolia. Making the page public doesn't turn test tokens into money.

## A page agents can read

Your `/llms.txt` explains what the shop sells and how to buy it: coordinates, color, price, network, and request format. The page and canvas are free to read. Paying always requires the visitor's own budget decision.

You'll try the deployed shop with your buyer, then let a second agent follow those instructions. A new session with your own agent counts. It gets its own disposable wallet rather than borrowing your private key.

## A little shop still needs limits

Bad requests should fail before reaching the facilitator. You'll limit request size and frequency, and check the free writer from your first canvas is gone. You'll also keep unfinished payments visible as pending so a visitor knows to check a purchase instead of paying twice.

Your deployed canvas starts with its own storage. The pixels you drew locally stay local.
