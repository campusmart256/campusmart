# CampusMart Phase 44 — Seller Sales History

Apply this incremental ZIP on top of Phase 43 (and previous Phases 40–42).

1. Extract ZIP into your CampusMart project folder, replacing the two My Listings route files.
2. No new SQL is needed **if the Phase 43 `listing_sales` table and seller-read policy are already installed**.
3. Run `npm run check`, `npm run build`, `npm run dev`.
4. Open `http://localhost:5173/my-listings?tab=sales` or click **Sales history** in My listings.
5. Record two partial sales of the same listing; expect two history entries, quantities, buyers and dates, and a units-sold summary.

Only the logged-in seller's sales are queried. Buyer display names use public profiles; if unavailable, the UI falls back to a generic label. These records are seller-reported transactions, **not proof of payment**. No price/revenue totals are shown because Phase 43 did not record actual transaction prices. Older sales from before Phase 43 do not appear in this history.

This is a targeted code patch and has not been tested against your local Supabase database. The list currently shows the most recent 200 sale events.
