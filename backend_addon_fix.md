
# 🚨 CRITICAL BACKEND BUG: Add-On Duplication

## Severity: High
**Impact:** Updating event add-ons duplicates them in the database instead of updating existing records. This leads to data bloat and potentially incorrect inventory tracking.

## The Issue
When a `PATCH /events/:id` request is sent with an `addOns` array:
1.  The backend appears to be iterating through the list and executing `INSERT` for every item.
2.  It fails to check if the item already exists (via ID) to perform an `UPDATE`.
3.  It fails to remove items that are no longer in the list (if the list represents the full state).

## Frontend Change Applied
The frontend has been updated to **explicitly include the `id` field** in the `addOns` payload objects when an item already exists.

**New Payload Format:**
```json
{
  "addOns": [
    {
      "id": "8f52d871-...",  <-- NOW INCLUDED
      "name": "VIP",
      "price": 20,
      "quantity_total": 1000,
      "min_donation": 10
    },
    {
      "name": "New Merch",   <-- NO ID (New Item)
      "price": 50
    }
  ]
}
```

## Required Backend Fixes

Please update the `PATCH /events/:id` handler logic for `addOns` (and `inventory` if similar logic applies):

1.  **Check for ID:**
    *   Iterate through the incoming `addOns` array.
    *   **If `id` is present:** Execute an `UPDATE inventory SET ... WHERE id = ?`.
    *   **If `id` is missing:** Execute an `INSERT INTO inventory ...`.

2.  **Handle Removals (Smart Sync):**
    *   The frontend sends the *entire* list of active add-ons.
    *   Identify IDs currently in the database for this event (category='ADD_ON') that are **NOT** in the incoming payload.
    *   **Delete** or **Archive** these missing records to prevent orphans.

3.  **Snake Case Mapping:**
    *   Ensure `minDonation` from frontend maps to `min_donation` in DB.
    *   Ensure `quantityTotal` maps to `quantity_total`.

## Verification Steps
1.  Create an event with 1 add-on.
2.  Edit the event, change the add-on's price, and save.
3.  **Success:** `GET /events/:id` should return 1 updated add-on, not 2.
