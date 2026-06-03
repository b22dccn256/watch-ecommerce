#!/usr/bin/env node
// Simple test sender for local webhooks/IPN
// Usage: node send_test_webhooks.js --stripe http://localhost:5000/api/payments/webhook

import fetch from "node-fetch";
import { argv } from "process";

const args = argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i];
  const val = args[i + 1];
  if (!key || !val) continue;
  params[key.replace(/^--/, "")] = val;
}

const send = async (url, opts) => {
  console.log("POST", url);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log("Status", res.status);
    console.log(text);
  } catch (err) {
    console.error("Error sending:", err.message);
  }
};

(async () => {
  if (params.vnpay) {
    // VNPay IPN uses GET query params — send a GET
    const url =
      params.vnpay +
      "?vnp_TxnRef=ORDER123&vnp_TransactionNo=TXN123&vnp_Amount=100000&vnp_SecureHash=FAKEHASH";
    await send(url, { method: "GET" });
  }

  if (params.stripe) {
    const url = params.stripe;
    const body = {
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123", metadata: {} } },
    };
    await send(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }
})();
