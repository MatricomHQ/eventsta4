
# 🚨 CRITICAL BACKEND BUGS: Data Persistence & Duplication

## 1. Ticket Inventory Persistence Failure
**Impact:** Tickets are not being saved or updated correctly. When a user updates tickets, the response echoes the changes, but subsequent GET requests show missing data or old data.

**Diagnosis:**
The backend `PATCH /events/:id` endpoint for `inventory` seems to rely on the presence of an `id` field to trigger an UPDATE.
*   The frontend was previously generating temporary UUIDs for new tickets, which the backend likely tried to UPDATE (finding no match) instead of INSERT.
*   **The frontend has been fixed** to send `id` ONLY if it matches an existing backend record. New tickets will have no `id`.

**Required Backend Logic (Inventory):**
*   **Iterate** through the incoming `inventory` array.
*   **If `id` is present:** Execute `UPDATE inventory SET ... WHERE id = ?`.
*   **If `id` is missing/null:** Execute `INSERT INTO inventory ...`.
*   **Handle Deletions:** If the incoming list is the "full source of truth", identify IDs present in DB but missing from payload, and DELETE or archive them.

## 2. Add-On Duplication
**Impact:** Editing an event duplicates its Add-Ons instead of updating them.

**Diagnosis:**
Similar to tickets, the backend was treating every add-on in the payload as a new item because the frontend was stripping IDs.
*   **The frontend has been fixed** to preserve IDs for existing add-ons.

**Required Backend Logic (AddOns):**
*   Same logic as Inventory: Update if ID exists, Insert if not.
*   Ensure `category` is set to 'ADD_ON' (or however your schema distinguishes them).
*   Map `min_donation` correctly.

## 3. Host Visibility (Drafts)
**Impact:** Draft events are not returned for hosts.
**Fix:** Ensure `GET /events?host_id=X&include_drafts=true` correctly bypasses the `status='PUBLISHED'` filter.

## 4. Promo Code Updates
**Impact:** Changing a promo code might break existing links.
**Recommendation:** Implement an alias system where the old code remains valid for tracking/redemption, but the new code becomes the primary display code.
