# CampusMart Phase 48 — Saved items page

This is an incremental update on top of Phase 47. Extract into your CampusMart project root with overwrite enabled. It modifies only saved-items-related routes/components, not the My Listings inventory/sales tabs.

## What changed
- `/saved` is a real, sign-in-required Saved items page.
- Heart button on marketplace listing cards, similar items and listing detail pages.
- Save/unsave is stored per logged-in user in Supabase, so it persists across devices.
- Saved page displays current active listings with images, seller, price and an unsave heart.
- Sold, removed and deleted items are hidden from the available saved list.
- Owners cannot save their own listings; RLS ensures only the account owner sees or modifies their saved items.

## Install
1. Unzip the patch into your project root, preserving paths.
2. In Supabase SQL Editor, run `database/campusmart_migration_v0.2.6_saved_items.sql`.
3. Run `npm run check`, `npm run build`, `npm run dev`.
4. Sign in, browse items, tap a heart, visit `/saved`, unsave and refresh. Confirm another account cannot see your saved items.

## Important
The SQL must be run before testing. This update has not been tested against your local SvelteKit app or live Supabase project; validate before deployment.
