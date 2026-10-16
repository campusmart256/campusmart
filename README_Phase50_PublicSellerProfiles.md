# CampusMart Phase 50 — Public Seller Profiles

Incremental ZIP patch. Apply after your working Phase 49 installation.

## Features
- Every item detail page now links the seller's name to `/seller/<seller-uuid>`.
- Public seller profile shows display name, avatar, verified-student check if applicable, active listings, and buyer feedback.
- Listings can be sorted by newest or lowest price. Heart/save controls remain available on cards.
- Reviews include reviewer display name, purchased item title, stars, comment, and date.
- No private email, phone, drafts, or transaction details are exposed by this new page.
- Reviews come from the existing `get_public_seller_reviews` RPC, and listings from active status only.

## Install
Extract the ZIP into your project root, overwriting the listing detail page. Run `npm run check`, `npm run build`, `npm run dev`.

**No new Supabase SQL is needed** if Phase 42/43 public seller review RPC already works.

## Test
1. Open a listing and click the seller's display name.
2. Confirm only that seller's active listings appear, with working links and save hearts.
3. Check the review list for buyer names, purchased item names and stars.
4. Sign out and verify the seller profile is still viewable.
5. Verify seller detail gallery arrows, compact sidebar, and existing review/report forms still work.

## Limits
Up to 60 active listings are shown, and the review RPC returns the reviews it has access to. These figures are not guaranteed lifetime totals. Local Svelte compilation and Supabase integration remain unverified until tested.
