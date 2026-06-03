# Payments — Local setup & testing

This document summarizes required environment variables and local testing commands for payment providers used in this project.

## Env variables (payments)

- VNPay
  - `VNP_TMN_CODE` (required)
  - `VNP_HASH_SECRET` (preferred) — secure hash secret used to verify callbacks
  - `VNP_SECRET` (legacy fallback; code accepts both)
  - `VNP_URL` (payment gateway URL, sandbox default used)
  - `VNP_RETURN_URL` (frontend return URL)
  - `VNP_IPN_URL` (backend IPN URL, default path `/api/payments/vnpay-ipn`)

- Stripe
  - `STRIPE_SECRET_KEY` (required for creating sessions)
  - `STRIPE_PUBLISHABLE_KEY` (frontend)
  - `STRIPE_WEBHOOK_SECRET` (recommended for webhook verification in production)

Notes:

- The code now prefers `VNP_HASH_SECRET` (as present in `backend/.env`) and accepts `VNP_SECRET` as a fallback. Do not rename your existing secret unless you update `.env` accordingly.
- Email/send notifications may rely on `BACKEND_URL`, `EMAIL_USER`, and `EMAIL_PASS`.

## Local testing (curl)

- VNPay IPN (GET query params)

Replace `http://localhost:5000` with your backend URL if different.

```bash
curl "http://localhost:5000/api/payments/vnpay/ipn?vnp_TxnRef=ORDER123&vnp_TransactionNo=TXN123&vnp_Amount=100000&vnp_SecureHash=FAKEHASH"
```

- Stripe webhook (dev fallback — signature optional)

If `STRIPE_WEBHOOK_SECRET` is set in your `.env`, the service will verify the signature. If not set and `NODE_ENV` is not `production`, the server will parse and accept a JSON body for local testing.

Example:

```bash
curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_123","metadata":{}}}}'
```

## Test script (Node)

There's a small helper script at `backend/scripts/send_test_webhooks.js` to POST sample events to your local endpoints. Run it with Node:

```bash
node backend/scripts/send_test_webhooks.js --vnpay http://localhost:5000/api/payments/vnpay/ipn
node backend/scripts/send_test_webhooks.js --stripe http://localhost:5000/api/payments/webhook
```

## Production notes

- Always set `STRIPE_WEBHOOK_SECRET` in production and protect the endpoint behind the correct URL/secret.
- Keep payment secrets out of VCS and use a secrets manager in production.
- Ensure `VNP_HASH_SECRET` is never logged.
