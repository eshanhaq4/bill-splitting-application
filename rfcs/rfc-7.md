# RFC-7: Tax & Tip Calculation

**Author:** Joanna
**Must be approved by:** Chris, Ade

---

## Overview

This RFC defines how tax and tip are allocated across users in the bill-splitting application. It covers how tax and tip are split, when calculations are shown in the UI, how unclaimed items are handled, and whether the calculation logic belongs on the frontend or backend.

The goal is to ensure that each user pays a fair share of the total bill based on the items they actually claimed.

---

## 1. Allocation Rule

Tax and tip will be split proportionally by claimed item subtotal, not evenly. This means that each user’s share of tax and tip will be based on the percentage of the claimed subtotal that belongs to them.

**Example:**
- User A claimed $20 of items
- User B claimed $30 of items
- Total claimed subtotal = $50
**Then:**
- User A pays 40% of tax and 40% of tip
- User B pays 60% of tax and 60% of tip

---

## 2. Calculation Timing

Tax and tip should be calculated live as items are claimed or released. Therefore, as item ownership changes and different items are claimed, the UI should update each user’s subtotal, tax share, tip share, and total in real time.

This allows users to immediately understand how their current selections affect what they owe, rather than waiting until the very end of the session.

The final authoritative values are still confirmed when the session closes.

---

## 3. Unclaimed Items

Unclaimed items are not automatically distributed across users. Instead, they remain in an unclaimed pool until they are explicitly claimed.

**Because of this:**
- Unclaimed items will be excluded from user subtotal calculations
- The tax and tip associated with unclaimed items are also excluded from the user allocations until those items are claimed
- Number of unclaimed items along with their corresponding price total including tax and tip will be showcased on the summary page after session is closed

This avoids unfairly charging users for items they did not select.

---

## 4. Frontend vs Backend Responsibility

The calculation logic will fully live on the frontend

- The frontend will compute and display a live preview of subtotal, tax, tip, and total as the user interacts with the bill.
- When creating the summary when the session has completed, the frontend will look through the final list of items, determine which items were claimed by each user, and it will calculate the same proportional formula on each user to display the final summary of everyone at the end.

---

## 5. Calculation Formula

For a given user:
- `userSubtotal` = sum of prices of items claimed by that user
- `totalSubtotal` = sum of prices of all items
- `userTaxShare` = totalTax * (userSubtotal / totalSubtotal)
- `userTipShare` = totalTip * (userSubtotal / totalSubtotal)
- `userTotal` = userSubtotal + userTaxShare + userTipShare
- `claimedTotal` = sum of prices of all claimed items in the session including their share of tax and tip

---

## 6. UI Impact

The `ItemsSummaryContainer` on the `ReceiptPage` should display the current user’s:
- number of claimed items
- subtotal
- tax share
- tip share
- total

These values should update live as item claim state changes.
