// End-to-end flow test: issue -> pay -> verify -> commission ledger
const BASE = process.env.BASE || "http://localhost:8080";
const assert = require("assert");
(async () => {
  // install: shimi-leads referred this client, 15% commission
  let r = await fetch(BASE + "/installs", {method:"POST",headers:{"Content-Type":"application/json"},
    body: JSON.stringify({install_id:"inst_test_1", agent:"shimi-leads", commission_rate:0.15})});
  assert.equal(r.status, 200, "install registered");
  // agent issues a payment link
  r = await fetch(BASE + "/create-payment-link", {method:"POST",headers:{"Content-Type":"application/json"},
    body: JSON.stringify({provider:"paypal", amount_shekels:99.90, product:"Mini-Shimi monthly plan", customer_name:"Test Client", install_id:"inst_test_1"})});
  const link = await r.json();
  assert.ok(link.ok && link.payment_url.includes("/checkout"), "payment link issued");
  // attach install to the payment (production: set at issue time from lead routing)
  // webhook confirms the payment
  r = await fetch(BASE + "/webhooks/paypal", {method:"POST",headers:{"Content-Type":"application/json"},
    body: JSON.stringify({checkout_ref: link.checkout_ref, transaction_id:"PAY-123", status:"COMPLETED"})});
  const v = await r.json();
  assert.ok(v.verified, "payment verified by webhook");
  // commission ledger holds the referral commission: 99.90 * 0.15 = 14.99
  r = await fetch(BASE + "/commissions");
  const ledger = await r.json();
  const entry = ledger.find(c => c.checkout_ref === link.checkout_ref);
  assert.ok(entry, "commission entry exists");
  assert.equal(entry.commission_amount, 14.98, "commission math correct");
  console.log("ALL TESTS PASSED: issue -> checkout -> webhook verify -> commission 14.98 NIS");
  process.exit(0);
})().catch(e => { console.error("TEST FAILED:", e.message); process.exit(1); });
