# CampusMart Phase 47 — Sales History Search & CSV Export

Incremental patch on top of the working Phase 46 update. Replaces only two files:
- `src/routes/my-listings/+page.svelte`
- `src/routes/my-listings/+page.server.js`

## Features
- Search recorded sales by item name or buyer display name.
- Filter CampusMart buyers, outside sales, or sales without a recorded buyer.
- Filter to the last 30 or 90 days; sort by date or quantity.
- View matching transaction count and total units sold in the filtered list.
- Download a UTF-8 CSV of the **currently displayed** transactions (date, item, buyer, buyer type, quantity, listing ID).
- Export escapes spreadsheet formula-like cells for safer opening in Excel.
- Does not alter stock, payment status, sales, or reviews.

## Install
Extract ZIP into the CampusMart project root, overwriting the two files. Run `npm run check`, `npm run build`, `npm run dev`.

## Test
1. Open `/my-listings?tab=sales` with at least two recorded sales.
2. Search by item/buyer, filter buyer type and last 30 days, change sort order.
3. Export shown as CSV and verify its rows match the filtered transactions.
4. Clear filters; check all transactions reappear and other My Listings tabs still work.

## Notes
No Supabase SQL required. The sales-history server query currently limits results to the most recent 200 transactions; filtering/export operate on that loaded subset, not a complete account-wide archive. Transactions are seller-recorded, not verified payments. No local Svelte build or Supabase integration test has been run in this environment.
