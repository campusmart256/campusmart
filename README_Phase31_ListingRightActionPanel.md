# CampusMart Phase 31 — Listing right action panel

This update changes the desktop listing detail page to match a more familiar marketplace layout.

## What changed

- Product image stays at a normal marketplace size on the left.
- Right side now shows the important action cards:
  - price
  - negotiable/fixed tag
  - safety warning
  - message seller button
  - seller card
  - reviews and feedback preview
  - report this item form
- Description and similar items stay below the image on the left.
- Mobile layout stays stacked and phone-friendly.

## Files changed

- `src/routes/listing/[id]/+page.svelte`
- `src/routes/listing/[id]/+page.server.js`
- `database/campusmart_migration_v0.2.0_listing_action_panel.sql`

## Supabase

No SQL should be needed if your `reports` table already has `listing_id`.

If reporting an item fails with a missing `listing_id` column, run:

`database/campusmart_migration_v0.2.0_listing_action_panel.sql`

## Test

1. Open a listing on laptop/desktop width.
2. Confirm the image is normal-sized on the left.
3. Confirm price/message/seller/reviews/report are on the right.
4. Test Message seller.
5. Test Report this item with a non-owner account.
