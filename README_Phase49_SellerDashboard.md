# CampusMart Phase 49 — Seller Dashboard

Incremental patch on top of your working Phase 48 Saved Items release. Extract into the project root, overwriting only `src/routes/my-listings/+page.server.js` and `src/routes/my-listings/+page.svelte`.

## New feature
- **Dashboard** tab in My Listings at `/my-listings?tab=dashboard`.
- Active listings, units available, low-stock warnings, recorded transactions, units sold, drafts/pending, sold-out listings.
- Quick links to Sell, Inventory, Sales History, Drafts, Sold.
- Last 5 recorded sales with item names and quantities.
- Buyer rating average and last 3 ratings from existing `item_reviews` table.
- Responsive layout for phone and desktop.

## Installation
1. Extract ZIP into CampusMart project folder with overwrite enabled.
2. **No new Supabase SQL** required. Existing `listing_sales`, `item_reviews`, `listings` tables are used.
3. Run `npm run check`, `npm run build`, `npm run dev`.
4. Open `http://localhost:5173/my-listings?tab=dashboard`.

## Test
1. Confirm counts match Active, Inventory, Drafts and Sold tabs.
2. Record a partial sale; refresh Dashboard and verify recorded sales and units sold change.
3. Leave a buyer review; refresh Dashboard and check rating.
4. Verify all existing tabs, including Bought items and Saved items, still work.

## Caveats
Sales and ratings summaries currently reflect at most the latest 200 loaded records each, not necessarily lifetime totals. Sales are seller-recorded, not proof of payment. No live Supabase integration or local Svelte build verification was performed.
