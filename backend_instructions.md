# Backend API Changes: Support for Ordered Inventory

## Overview
The frontend now supports drag-and-drop reordering for tickets and add-ons within the Event Admin panel. To persist this custom order, the backend needs to store and serve the inventory items in their specified sequence.

## Required Changes

### 1. Database Schema Update
**Table:** `inventory` (or whichever table stores tickets and add-ons)
**Action:** Add a new column to store the display order.

```sql
-- Example for PostgreSQL
ALTER TABLE inventory ADD COLUMN display_order INTEGER DEFAULT 0;
```
*   **Column Name:** `display_order`, `position`, `sort_order`, etc.
*   **Type:** `INTEGER`
*   **Default:** `0` or `NULL`

### 2. Modify Event Update Endpoint (`PATCH /events/:id`)
When the backend receives an `inventory` array in the request body, it now represents the complete, ordered list of tickets and add-ons for that event. The backend must process this array to reflect the new order.

**Logic:**
1.  Begin a transaction.
2.  Iterate through the incoming `inventory` array. For each item at index `i`:
    *   **If the item has an `id`:**
        *   Execute an `UPDATE inventory SET ..., display_order = i WHERE id = item.id;`
    *   **If the item does NOT have an `id`:**
        *   Execute an `INSERT INTO inventory (..., display_order) VALUES (..., i);`
3.  **Handle Deletions:**
    *   Get a list of all `id`s from the incoming `inventory` array.
    *   `DELETE FROM inventory WHERE event_id = :eventId AND id NOT IN (:incoming_ids);`
4.  Commit the transaction.

This "sync" approach ensures that added, removed, and reordered items are all handled correctly.

### 3. Modify Event Fetch Endpoint (`GET /events/:id`)
When fetching inventory items for an event, they must be returned in the correct order.

**Logic:**
*   Modify the SQL query to include an `ORDER BY` clause.

```sql
-- Example
SELECT * FROM inventory WHERE event_id = $1 ORDER BY display_order ASC;
```

This ensures that both the public Event Details page and the Event Admin panel will display tickets and add-ons in the user-defined order.