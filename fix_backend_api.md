# 🚨 CRITICAL BACKEND BUG REPORT: Draft Events Unreachable

## Severity: High
**Impact:** Hosts cannot see their own events in the dashboard if they are in 'DRAFT' status. This effectively breaks the event creation/publishing flow.

## The Issue
The frontend is correctly sending the query parameter `include_drafts=true` when fetching events for a host, but the API continues to return an empty array `[]`. This indicates the API is enforcing a `status = 'PUBLISHED'` filter regardless of the query parameter.

## Evidence from Logs
**Request:**
```http
GET /eventsta/events?host_id=4a96015a-6930-4b21-bc9c-5c55c59f87c8&include_drafts=true
```
**Response:**
```json
[]
```
*(The host `4a96015a...` has created events, but they are stuck in DRAFT status and thus invisible).*

## Required Fixes (For Backend Team)

Please update the `GET /events` endpoint handler immediately:

1.  **Parse Query Parameter:**
    Ensure you are checking `req.query.include_drafts`.
    *   *Note:* Query parameters are strings. Ensure your check handles `"true"` (string) and not just `true` (boolean).

2.  **Fix Filtering Logic:**
    The SQL/Database query logic must conditionally remove the status filter.
    
    *Current (Suspected) Logic:*
    ```sql
    SELECT * FROM events WHERE host_id = $1 AND status = 'PUBLISHED'
    ```

    *Required Logic:*
    ```javascript
    // Pseudo-code
    const { host_id, include_drafts } = req.query;
    
    let query = "SELECT * FROM events WHERE host_id = $1";
    const params = [host_id];

    // ONLY apply status filter if we are NOT explicitly asking for drafts
    if (include_drafts !== 'true') {
        query += " AND status = 'PUBLISHED'";
    }
    
    // execute(query, params)...
    ```

3.  **Verify Data Integrity:**
    Double check that `POST /events` is correctly saving the `host_id`. If `host_id` is null in the database, even the correct query will return nothing.

## Verification Steps
1.  Create an event via `POST /events`.
2.  Call `GET /events?host_id={...}&include_drafts=true`.
3.  **Success:** The API returns a JSON array containing the new draft event.
