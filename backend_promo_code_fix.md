# 🚨 CRITICAL BACKEND BUG: Promo Code Deletion Fails to Persist

## Severity: High
**Impact:** Event hosts cannot delete promo codes. This breaks a core part of marketing and promotion management, leading to user frustration and potentially unwanted discounts remaining active.

## The Issue
The API endpoint for deleting a promo code is responding with a success message, but the data is not being removed from the database.

## Evidence from Logs
A sequence of API calls shows the following behavior:
1.  `DELETE /events/{eventId}/promocodes/{codeId}` is called.
2.  The API correctly responds with `200 OK` and `{"success":true}`.
3.  An immediate `GET /events/{eventId}/promocodes` is called.
4.  The API response for the `GET` request **still contains the supposedly deleted promo code**.

This confirms that the delete operation is not being persisted, despite the API claiming success.

## Likely Causes (Using StaxDB ORM)
Given that an ORM is in use, the issue is likely not with raw SQL but with how the ORM is being instructed to handle the data modification. Common causes include:
1.  **Transaction Not Committed:** The delete operation is performed within a transaction that is never committed to the database.
2.  **Incorrect Entity State:** The ORM's `delete()` or `remove()` method is called, but the changes are not saved or flushed to the database (e.g., a required `unitOfWork.commit()` or `entityManager.flush()` call is missing).
3.  **"Soft Delete" Misconfiguration:** If the system uses soft deletes (e.g., setting an `is_deleted` flag), the `DELETE` handler might be setting the flag, but the `GET` handler is not filtering out records where `is_deleted = true`.
4.  **Entity Not Found:** The logic to find the `PromoCode` entity before deleting it might be failing silently, but the controller proceeds to return a success message regardless.

## Required Fix (For Backend Team)

Please investigate the controller/handler for the following endpoint:
**`DELETE /events/:eventId/promocodes/:codeId`**

1.  **Verify Entity Retrieval:** Ensure that the `PromoCode` entity is being correctly fetched from the database using the `codeId` from the URL. If no entity is found, the endpoint should return a `404 Not Found` error, not a success message.

2.  **Ensure Deletion Logic:** Confirm that the appropriate StaxDB method to delete an entity is being called on the fetched `PromoCode` object.

3.  **Commit the Transaction:** **This is the most likely culprit.** After calling the delete method, ensure that the transaction or session is explicitly committed to persist the change. The exact method will depend on your StaxDB setup (e.g., `StaxDB.save()`, `transaction.commit()`, etc.).

4.  **Check Soft Delete Logic:**
    *   If you are using soft deletes, verify that the `DELETE` handler correctly sets the `is_deleted` (or similar) flag.
    *   Crucially, you must also update the `GET /events/:eventId/promocodes` handler to filter out these records by adding a condition like `WHERE is_deleted = false`.

## Verification Steps
To confirm the fix:
1.  Create a new, temporary promo code for an event using the API.
2.  Call the `DELETE /events/{eventId}/promocodes/{newCodeId}` endpoint for the new code. Verify it returns `200 OK`.
3.  Immediately call `GET /events/{eventId}/promocodes`.
4.  **Success:** The response should **NOT** contain the deleted promo code.
5.  Check the database directly to confirm the record is either physically gone or its soft-delete flag is set correctly.
