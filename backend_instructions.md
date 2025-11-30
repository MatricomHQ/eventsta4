
# 🚨 CRITICAL BACKEND DATA INTEGRITY FIXES

## Overview
The frontend is receiving corrupted or incorrectly calculated data in several key endpoints. These issues affect financial reporting and analytics. Please implement the following fixes immediately.

## 1. Commission Calculation Logic (Ledger)
**Severity: High**
**Issue:** Commission entries in the ledger are returning raw values (e.g., `100` for $1.00) or are calculated incorrectly.
**Endpoint:** `GET /users/:userId/ledger` (and internal commission calculation logic)

**Current Behavior:**
*   A $10.00 ticket with 10% commission results in a ledger entry of `amount: 100`.
*   The frontend displays this as `$100.00` because the platform standard is to treat API amounts as Float/Dollars (e.g. `grossSales: 70.94`).

**Required Fix:**
*   Ensure commission calculation logic divides by 100 if working with percentages.
    *   Formula: `Commission = TicketPrice * (CommissionRate / 100)`
*   Ensure the `amount` stored in the `Ledger` table is consistent with other monetary values in the system (i.e., if `grossSales` is Dollars, `commission` must be Dollars).
*   **Backfill:** Run a script to fix existing `COMMISSION` entries that are 100x their correct value.

## 2. Report Data Corruption (Stringified Promises)
**Severity: High**
**Issue:** The `promoterSales` and `salesVolume` fields in the report endpoint return the string `"[object Promise][object Promise]..."`.
**Endpoint:** `GET /events/:id/report`

**Current Behavior:**
```json
{
  "kpis": {
    "promoterSales": "00[object Promise][object Promise][object Promise]"
  },
  "promotions": [
    { "salesVolume": "0[object Promise][object Promise]..." }
  ]
}
```

**Diagnosis:**
The backend code likely looks like this:
```javascript
// BAD CODE EXAMPLE
const promoterSales = 0 + promotions.map(async p => await getSales(p)); // Result: "0[object Promise]..."
```
You are concatenating an array of Promises to a number or string instead of resolving them.

**Required Fix:**
*   Use `Promise.all()` to resolve async operations before aggregating.
*   Example:
    ```javascript
    const salesPromises = promotions.map(p => getSales(p));
    const salesResults = await Promise.all(salesPromises);
    const totalPromoterSales = salesResults.reduce((a, b) => a + b, 0);
    ```

## 3. Page Views Accuracy
**Severity: Medium**
**Issue:** Page views are reported as exactly `50` in logs, regardless of traffic. This indicates a hardcoded value or broken tracking.
**Endpoint:** `GET /events/:id/report`

**Required Fix:**
*   Ensure the page view counter is actually incrementing on `GET /events/:id` (public view).
*   Remove any hardcoded mock data for `pageViews`.

## 4. Transaction History Types
**Severity: Medium**
**Issue:** Inconsistent number types in `GET /users/:userId/ledger`.
*   Some entries might be integers (cents?) while others are floats.
*   Standardize ALL monetary return values to Floats (representing Dollars) for consistency with the rest of the API (e.g. `70.94`).

## Testing Instructions
1.  **Commission Test:**
    *   Create an event with ticket price $10 and commission 10%.
    *   Buy a ticket via a promoter link.
    *   Check `GET /users/:promoterId/ledger`.
    *   **Expect:** `amount: 1.0` (or `1.00`).
    *   **Fail:** `amount: 100` or `amount: 10`.

2.  **Report Test:**
    *   Call `GET /events/:id/report`.
    *   Check `kpis.promoterSales`.
    *   **Expect:** A Number (e.g. `150.50` or `0`).
    *   **Fail:** A String containing "Promise" or "object".
