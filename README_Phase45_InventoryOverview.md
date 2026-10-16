# CampusMart Phase 45 — Inventory overview and low-stock alerts

This is an incremental patch **on top of Phase 44**. It changes only `src/routes/my-listings/+page.svelte` and `src/routes/my-listings/+page.server.js`.

## What's new

- `My listings → Inventory` (`/my-listings?tab=inventory`) shows active listings, sorted by fewest units left.
- Summary cards: active listings, units available, and low-stock items.
- Low-stock flag on any active listing with **3 or fewer units** (also shown in the Active tab).
- Existing Edit and Record sale links remain available, using Phase 43 stock management.
- No new database tables, SQL, or API credentials needed.

## Install

Extract ZIP into the CampusMart project root and allow the two files to be overwritten. Then run `npm run check`, `npm run build`, `npm run dev`.

## Test

Create a listing with 8 units and one with 2 units. Open Inventory: the 2-unit listing should appear first and be marked Low stock. Record a sale of 1 unit from the 8-unit listing and confirm the inventory total drops by 1. Sell out an item and confirm it disappears from active Inventory and appears under Sold.

## Limitations

The existing My Listings query loads at most 200 listings; summary numbers and stock counts are based on those fetched records. This is a UI alert, not a push notification or scheduled alert. No sales or stock changes are made by simply opening the Inventory tab. Not yet tested against your local Supabase instance.
