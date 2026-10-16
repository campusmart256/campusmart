# CampusMart Phase 32 — Listing Focus Sidebar

This update minimizes the left desktop sidebar only on item detail pages.

## What changed

- On `/listing/[id]`, the wide desktop sidebar becomes a compact icon-only sidebar.
- The item detail page gets more horizontal space.
- Navigation is still available through icons.
- Hover/title labels remain available for accessibility.
- Other pages keep the full left sidebar.
- Mobile layout is unchanged.

## Files changed

- `src/routes/+layout.svelte`
- `src/lib/components/DesktopSidebar.svelte`

## Apply

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase32_ListingFocusSidebar.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

No Supabase SQL is needed.
