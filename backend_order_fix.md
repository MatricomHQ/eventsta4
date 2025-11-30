# 🚨 CRITICAL BACKEND BUG: Orders Stuck in 'Pending'

## Analysis of Logs (Req-7y)
**Timestamp:** `15:50:44`
**Endpoint:** `GET /eventsta/orders/mine`
**Response Payload:**
```json
[
  {
    "orderId": "f7e796a6-3f1f-42d1-8c6a-1bdd81870165",
    "status": "Pending", 
    "totalPaid": 11.94,
    ...
  },
  {
    "orderId": "7b1b122c-b98b-48c5-95b2-5bcafbedcc2f",
    "status": "Pending",
    "totalPaid": 11.94,
    ...
  }
]
```

## Issue
Orders are being created successfully (`200 OK` response) but remain in the `Pending` state indefinitely. 
This indicates the payment confirmation logic (Webhook or Post-Payment processing) is not firing or failing to update the `Order` table status to `Completed`.

The frontend treats `Pending` orders as "Processing", which prevents the user from accessing their QR code.

## Required Fixes

### 1. Fix Status Transition
Ensure that when a payment is successful (Stripe `payment_intent.succeeded`), the database record for that Order is updated:
`UPDATE orders SET status = 'Completed' WHERE order_id = ...`

### 2. Check Webhooks
Verify that your local or staging environment is receiving Stripe webhooks. If not, the status will never update.

### 3. (Optional) Manual Finalize Endpoint
If webhooks are unreliable in this environment, expose an endpoint `POST /orders/:id/finalize` that checks the Stripe status on-demand and updates the database. The frontend can call this immediately after the client-side checkout flow completes.