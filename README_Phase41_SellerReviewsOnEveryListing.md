# Phase 41 — Seller reviews on every listing

Shows every completed-purchase review received by the seller on all their item pages, including the original item title, stars, comment and date. This is *seller feedback* from buyers, not feedback about the buyer. No private buyer information is exposed.

## Apply
1. Back up your local project or commit it to Git.
2. Extract this ZIP into your CampusMart project root with overwrite enabled.
3. In Supabase SQL Editor, run `database/campusmart_migration_v0.2.3_public_seller_reviews.sql`.
4. Run `npm run check`, `npm run build`, and `npm run dev`.
5. Sign in as a buyer and review a sold item; open any other listing by the same seller to confirm the original item title, stars, and comment appear. Open a listing by a different seller to confirm the review does not leak across sellers.

## Safety and limitations
- Read-only public RPC returns only the sold item's title, rating, comment and date; not buyer identifiers.
- Only reviews tied to items with status `sold` are returned.
- Existing review creation restrictions remain unchanged.
- Needs local testing; do not assume Supabase or RLS are verified.
- Feedback count and average are calculated from the same public, completed-purchase reviews, including for visitors who are not signed in.
