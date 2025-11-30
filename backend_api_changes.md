# Backend API Changes Required

## Promotions & Promo Codes

### 1. Update Promoter Code (Alias/Handle)
**Endpoint:** `PUT /promotions/:eventId/code`
**Auth:** Required (User must be the owner of the promotion)

**Payload:**
```json
{
  "new_code": "NEWALIAS2025"
}
```

**Business Logic Requirements:**
1.  **Normalization:** Convert `new_code` to Uppercase and trim whitespace.
2.  **Uniqueness Check:** Check if `new_code` is already in use for this `eventId`.
    *   If exists (and belongs to another user), return `409 Conflict`.
3.  **Alias Creation (Crucial):**
    *   The user is asking to "change" their code, but we must ensure **previous codes** assigned to this user for this event **continue to attribute sales** to them.
    *   **Do not** simply overwrite the code in a way that orphans usage of the old code (unless your tracking is based solely on `user_id` passed via URL param, ignoring the code itself).
    *   **Recommended Schema:** `PromoCodes` table where multiple codes can map to a single `Promotion/User` entity.
    *   Mark the `new_code` as the **Primary** code (used for generating new links in the UI).
    *   Keep the old code active in the background for tracking purposes.
4.  **Response:**
    *   Success: `200 OK` `{ "success": true, "code": "NEWALIAS2025", "link": "https://..." }`

### 2. Validation Endpoint
**Endpoint:** `POST /events/:eventId/promocodes/validate`

**Requirement:**
*   Ensure this endpoint accepts **ANY** valid alias belonging to the user (old or new).
*   If `OLDCODE` is sent, it should still return `{ valid: true, discountPercent: ..., ownerName: "User Name" }`.
*   This ensures links distributed prior to the code change do not break at checkout.

### 3. Reporting Endpoint Fix (`/events/:id/report`)
**Current Bug:** The endpoint is returning entries with `promoterName: "Unknown User"` and zero stats.
**Fix:** 
*   Ensure the SQL query joins correctly on the `Users` table.
*   Filter out `promotions` rows that have `NULL` user_id or where the user no longer exists.
*   Ensure `sales` and `earned` columns correctly aggregate data from *all* aliases belonging to that user for the event.
