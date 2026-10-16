# Phase 42 — Reviewer display names on seller feedback

On every listing, seller feedback now shows the buyer's public CampusMart display name, purchased item name, star rating, comment and date. It does not expose the buyer's email, phone number or ID. A missing/blank display name is shown as "CampusMart buyer".

1. Extract this ZIP into your CampusMart project folder (overwrite files).
2. Run `database/campusmart_migration_v0.2.4_reviewer_display_names.sql` in Supabase SQL Editor. The migration safely drops and recreates the Phase 41 read-only RPC in a single transaction because its return columns changed. Existing reviews remain untouched.
3. Run `npm run check`, `npm run build`, `npm run dev`.
4. Test reviews on a seller's listings with a buyer account that has a display name.

This is an incremental patch over Phase 41, not a full project. Not yet locally tested.
