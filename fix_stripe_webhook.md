# 🚨 CRITICAL: Stripe Webhook Failure on Port 8181

## Diagnosis
The frontend reports successful payments (`payment_intent.succeeded`) via the Stripe Element, but orders remain `Pending` in the database. This confirms that **Stripe Webhooks are not reaching the backend**.

**Likely Causes:**
1.  **Port 8181:** Stripe does not officially restrict ports, but intermediate firewalls, cloud security groups (AWS/GCP), or corporate networks often block INBOUND traffic on non-standard ports like 8181.
2.  **SSL/TLS:** If `https://api.eventsta.com:8181` is using a self-signed certificate or an invalid chain, Stripe will fail to deliver the webhook event.
3.  **Webhook Configuration:** The URL in the Stripe Dashboard might be set to the main domain (port 443) instead of specifically `:8181`.

## 🛠️ REQUIRED FIX: Implement Manual Confirmation Endpoint (Robust Fallback)

Since we cannot rely solely on webhooks (especially in dev/staging environments or with port restrictions), you **MUST** implement a manual confirmation endpoint. The frontend has been updated to call this immediately after a successful payment to force-sync the status.

### New Endpoint Specification

**Method:** `POST`
**URL:** `/orders/:id/confirm`
**Auth:** Protected (User must own the order)

**Required Backend Logic:**
1.  **Lookup:** Find the Order by `:id`.
2.  **Retrieve:** Get the associated `payment_intent_id` stored in your DB for this order.
3.  **Stripe API Call:** Perform a direct API call to Stripe:
    ```javascript
    const paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id);
    ```
4.  **Verify & Update:**
    *   **If `paymentIntent.status === 'succeeded'`:**
        *   Update the Order `status` to `'Completed'` in the database.
        *   Trigger ticket generation and email confirmation logic (same logic as your webhook handler).
        *   Return `200 OK` `{ status: 'Completed' }`.
    *   **If not succeeded:**
        *   Return the current status or `400 Bad Request`.

### Why this fixes it:
The frontend *knows* the payment succeeded because the Stripe JS SDK returns `success`. By calling this endpoint, the frontend tells the server "I paid, please double-check Stripe now!" This bypasses the blocked webhook channel entirely for the critical user path.
