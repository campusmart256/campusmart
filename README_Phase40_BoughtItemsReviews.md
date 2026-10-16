# CampusMart Phase 40 — Bought items & reviews

Adds a **Bought items** tab to `/my-listings?tab=bought` for the signed-in buyer. The tab shows items whose `sold_to_user_id` is that user and whose status is `sold`. Each item offers a one-time 1–5 star review with optional feedback, or displays the submitted review.

## Install
Extract the ZIP into the root of the existing CampusMart project, preserving folders and overwriting only matching files. Do not extract a full old project snapshot.

## SQL
If Phase 39 item reviews SQL has already been applied successfully, no new SQL is needed. **Important:** the earlier chat SQL used the wrong RPC name (`create_item_review`); the actual frontend calls `submit_item_review`. If you used the chat SQL rather than the migration file, run the included `database/campusmart_migration_v0.2.2_item_reviews.sql` in Supabase SQL Editor to create the expected RPC. Check for migration errors and stop if any occur.

## Test
1. Seller marks an item sold to a specific buyer account.
2. Buyer logs in, visits `/my-listings?tab=bought`, and sees that item.
3. Buyer submits a rating and optional feedback.
4. Refresh: the rating appears, and the form is gone.
5. Another account cannot review the item; seller cannot review own item.

Run `npm run check`, `npm run build`, and `npm run dev` locally. The phase has not been verified against your live Supabase or local build.
