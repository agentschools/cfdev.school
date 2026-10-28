---
description: "Choose whether to keep your shop on testnet or prepare a separate shop for real payments."
agent-instructions: |
  Two outcomes are valid. Taking this course isn't permission for real spending,
  new credentials, paid services or legal acceptance. Read project AGENTS.md first.
  
  1. Explain the paths: keep the shop on testnet (default), or prepare a separate
     mainnet shop. Ask which they want and WAIT for an explicit choice. If unsure
     or declining, use step 2. Real spending is never needed for completion.
  2. For staying on testnet, run a synthetic eip155:8453 challenge through the
     buyer's policy with a signer spy and confirm zero signatures. Fetch the
     deployed unpaid challenge to confirm 84532; inspect config and the testnet
     label. Write their decision and evidence in AGENTS.md. Go to steps 7-8.
     Don't make a mainnet wallet or another deployment on this path.
  3. For mainnet, prepare a reviewable config diff/readiness note BEFORE making
     credentials or spending. Re-check official facilitator and Circle docs.
     Base is eip155:8453 with a DIFFERENT USDC contract. The public x402.org test
     facilitator is not this course's mainnet provider. CDP is one option:
     API key ID/secret, authenticated facilitator, usage-based fees above its
     free tier, screening and eligibility requirements. Verify current terms,
     supported networks and installed-SDK integration; don't guess endpoints
     or replace only a network string. Keep all existing testnet files,
     deployment, buyer and inventory unchanged.
  4. The student reviews provider setup, terms and possible charges themselves.
     Ask separately before credential creation, legal acceptance or a paid
     resource. They supply a receiving address they control and check its
     network. Never reuse disposable test keys for real funds. Store facilitator
     credentials as server secret bindings with current cf commands, never
     in config, git or browser code. The seller doesn't need a signing key.
     Explain that receiving USDC isn't a bank deposit: off-ramping has separate
     provider/eligibility/fee/tax questions. Don't open exchange accounts,
     bridge, cash out or transfer funds on their behalf.
  5. Build a SEPARATE mainnet project/Worker and inventory with a Real USDC /
     Base label, correct recipient/token/network and authenticated facilitator.
     Fail startup on missing settings; no fallback to production defaults.
     Verify authenticated /supported includes v2 exact on Base. Repeat race,
     replay, cap, failure and crash tests locally without funds. Establish an
     operator reconciliation procedure with durable receipts, authoritative
     chain checks and idempotent repair; don't advertise real sales before
     recovery is ready. Deploy only within their approved Cloudflare plan,
     and verify a mainnet 402 WITHOUT signing. Offer to stop at preparation.
  6. If they want one real purchase, present exact origin, square, color, Base
     network, USDC contract, payTo, amount, maximum TOTAL spend including known
     fees, and who pays fees. WAIT for explicit authorization for that one
     transaction. If funding, eligibility or fees can't be verified, stop at
     preparation. The student funds a dedicated buyer and handles sensitive
     credentials in their own secure environment. Never use the test key.
     Apply the one-attempt buyer with fresh mainnet allowlists, approved cap
     and redirect refusal. Make ONE purchase, independently verify the Base
     receipt/USDC transfer/pixel, then stop. On uncertainty reconcile first;
     no automatic retries, refunds or extra authorizations.
  7. Verify before completing: testnet path passed step 2; mainnet preparation
     passed steps 3-5 and its readiness note states whether a real purchase
     was approved/verified or deliberately not attempted. Never claim live
     settlement without chain evidence. A provider/credential/recovery/deploy
     blocker means preparation is incomplete: offer the verified testnet
     path or leave incomplete. Comprehension check: ask why changing only
     the network isn't enough and what approval real spending needs. Wait.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
     Congratulate the student and state the chosen network and whether any
     real money moved.
---

# Accept real payments

Your testnet shop already demonstrates the payment flow. You can keep it there and finish by proving the buyer refuses a mainnet request. Or prepare a separate shop that accepts real USDC on Base, then decide whether to make one small real purchase.

## Choose deliberately

Real USDC has value. A real payment needs your explicit approval for the amount, recipient, network, and any fees. Starting this exercise doesn't give your agent permission to spend, open accounts, create credentials, or accept terms for you.

Keep your testnet shop intact. A mainnet shop uses separate inventory, a receiving address you control, a different USDC contract, and a facilitator that supports mainnet. The disposable keys from this course stay disposable.

## Prepare a separate shop

The [CDP facilitator](https://docs.cdp.coinbase.com/x402/seller/facilitator) is one mainnet option. It requires authentication and has its own eligibility, screening, and pricing. Your agent will check the current [production integration](https://docs.cdp.coinbase.com/x402/seller/production-configuration) before proposing a change. You review account setup, credentials, terms, and potential charges yourself.

You'll check the new shop's unpaid 402 and run failure tests before deciding whether to pay. The shop also needs a way to reconcile payments that settled but never made it onto the canvas. A penny is still someone's penny.

## Decide whether to pay

You can stop after preparation. If you choose a real purchase, your agent shows the exact transaction and waits for approval, makes one attempt, and checks the payment and pixel afterward. If the response is uncertain, it stops and investigates.

Receiving USDC is separate from turning it into money in a bank account. This exercise doesn't open an exchange account, bridge tokens, or cash anything out.
