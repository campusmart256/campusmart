# CampusMart Phase 43 — Stock quantities and partial sales

This is an incremental ZIP. Apply it on top of Phases 40–42.

1. Extract into the CampusMart project root, overwriting changed files.
2. Run `database/campusmart_migration_v0.2.5_partial_sales_stock.sql` in Supabase SQL Editor.
3. Run `npm run check`, `npm run build`, and `npm run dev`.
4. In Sell an item enter units available (default 1); in Edit listing adjust available units.
5. In My listings > Active, choose Record sale, select buyer and units sold. Remaining stock stays live; at zero the listing moves to Sold.
6. Buyers of partial sales see their item in Bought items and can review once. Existing reviews stay intact and are shown across the seller's listings.

Important: only buyers who have messaged the seller about that listing can be selected. Outside-campus or skipped sales are recorded without buyer reviews. One review per buyer per listing, even if they purchase multiple times. A recorded sale is not reversible in this phase; seller can correct remaining stock through Edit, but this does not erase the sale history. Phase 43 has not been locally verified against your Supabase schema or app.
