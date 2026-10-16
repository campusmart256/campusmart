# Phase 39 — Buyer Item Reviews

Adds a safe review option for the buyer after an item is marked as sold to them.

## What changed

- Adds buyer-only review form on the item detail page.
- The review appears only when:
  - the item is marked as sold,
  - the logged-in user is the selected buyer,
  - the buyer has not reviewed that item yet.
- Adds seller feedback count and average rating to the listing action panel.
- Keeps reviews one-per-sold-listing so users cannot spam the seller.

## Apply

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase39_BuyerItemReviews.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Supabase SQL

Run:

```text
database/campusmart_migration_v0.2.2_item_reviews.sql
```

## Test

1. Seller marks a listing as sold to a buyer who messaged them.
2. Buyer opens that listing page.
3. Buyer should see **Review your purchase**.
4. Submit a rating/comment.
5. Refresh the page. The form should be replaced by the submitted review.
