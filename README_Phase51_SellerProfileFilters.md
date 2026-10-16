# CampusMart Phase 51 — Seller Profile Search & Review Filters

Incremental patch to install **after Phase 50**. Only changes the public seller profile page.

## Added
- Search a seller’s loaded active listings by item name.
- Filter those items by category.
- Keep the existing newest / lowest price sort links.
- Filter purchase reviews by 1–5 stars.
- Results counts and clear-filter actions; accessible form labels.
- Filtering happens in the browser; it does not expose unpublished listings or private buyer details.

## Install
Extract this ZIP into your CampusMart project root (overwrite when prompted). Then run:

```powershell
npm run check
npm run build
npm run dev
```

**No SQL needed.** Uses existing Phase 50 public seller profile data.

## Test
1. Open a seller profile with multiple active listings.
2. Search for part of a listing title; check only matching cards appear.
3. Change category and clear filters.
4. Filter reviews to a specific star rating; confirm the average rating at the top stays the overall rating.
5. Click Newest or Lowest price; verify the sort works and filters still work after navigation.
6. Test on mobile, and check Saved hearts still work.

## Limits
The existing Phase 50 server loads up to 60 active listings. The search and category filter apply to **those loaded items only**. Review filters apply to reviews returned by the existing RPC. Build and Supabase behavior still require local verification.
