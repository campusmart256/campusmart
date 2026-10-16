# CampusMart Phase 46 — Inventory Search & Filters

Incremental update on top of Phase 45. Only replaces `src/routes/my-listings/+page.svelte`.

## What's new
- Search active inventory by item name as you type.
- Filter for all items, low stock (1–3 units), or in stock (4+ units).
- Sort by fewest units, most units, or item name A–Z.
- Result count and Clear filters action, with a useful empty-results state.
- Existing sales history, buyer reviews, inventory counts, and record-sale/edit links are unchanged.

## Installation
Extract this ZIP into the CampusMart project root, allowing overwrites. Run `npm run check`, `npm run build`, `npm run dev`.

## Test
Visit `/my-listings?tab=inventory`. Create two active listings with 2 and 8 units. Filter Low stock to see only the 2-unit listing, search by name, then sort. Clear filters to restore both. Record a sale and check the displayed units refresh.

## Notes
No SQL migration required. Filtering is client-side on the existing first 200 seller listings fetched by the Phase 45 server code. No background alerts or changes to the database. Not tested against your local running CampusMart project.
