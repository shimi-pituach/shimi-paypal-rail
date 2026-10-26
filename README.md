# Shimi Network: Agent Economy on PayPal

A production payment rail for autonomous AI agents. Built for the
[PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).

Shimi Network is a live economy of 58 autonomous AI agents (lead-gen, finance,
development, client service) that serve real clients. The open question this
project answers: **how does an agent move money safely — and prove it?**

## The architecture

```
Agent (closes a service)
   │  POST /create-payment-link {provider, amount, product, customer}
   ▼
Payment rail  ────► dynamic checkout page (one page per product, PayPal first)
   ▲                        │ client pays
   │                        ▼
   └──── PayPal webhook (the ONLY accepted evidence)
   │
   ▼
PaymentRecord → verification protocol → flips business object (appointment → paid)
   │
   ▼
Referral commission ledger (which agent sourced the client, 10–15%, per payment)
```

## Core principles

1. **Agents issue checkout, humans confirm it.** Any agent that closes a deal
   calls one endpoint and gets a live payment page. No human needs to build
   the payment step.
2. **A claim is not evidence.** An agent saying "payment received" proves
   nothing. Only the webhook-verified `PaymentRecord` counts — the same
   verification discipline we apply to every agent action (see
   [LandingVerify](https://github.com/sunraz2/shimi-landingverify)).
3. **The money trail is auditable.** Every payment link issued, payment
   verified and commission owed is logged on the shared network board.
4. **Fail-closed key management.** Payment hook keys rotate without warning;
   the rail returns `make_api_key_rotated` and no key is ever embedded in code.

## This repo

The production system runs this contract as serverless functions on Base44
(agent platform). This repository is the open, runnable **reference
implementation** of the same contract:

- `server.js` — the full rail: create-payment-link, dynamic checkout,
  PayPal webhook verification, install registry, commission ledger.
- `test.js` — end-to-end flow test: agent issues → client pays → webhook
  verifies → commission lands in the ledger.

## Run it

```bash
npm install express
node server.js          # in another shell:
node test.js             # ALL TESTS PASSED: issue -> checkout -> webhook verify -> commission
```

## API contract (as verified in production)

```bash
# Agent issues a payment link
curl -X POST $HOST/create-payment-link -H 'Content-Type: application/json' \
  -d '{"provider":"paypal","amount_shekels":99.90,"product":"Mini-Shimi monthly plan"}'
# -> {"ok":true,"payment_url":".../checkout?ref=chr_xxx&amount=99.90&...","checkout_ref":"chr_xxx"}

# PayPal webhook (verification is the only accepted payment evidence)
curl -X POST $HOST/webhooks/paypal -H 'Content-Type: application/json' \
  -d '{"checkout_ref":"chr_xxx","transaction_id":"PAY-123","status":"COMPLETED"}'
# -> {"ok":true,"verified":true,"commission_amount":14.99}
```

## What's next

- PayPal Orders API (create/capture inside the agent conversation)
- Payouts API for settling the referral commission ledger agent-to-agent
- Subscriptions for recurring agent services

MIT license. Built by Shimi Network.
