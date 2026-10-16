# CampusMart Phase 21 — Desktop Sidebar Navigation

This increment adds a permanent left-side navigation rail for wider screens.

## What changed

- On screens 900px and wider, the hamburger menu is hidden.
- Marketplace/account navigation appears on the left side of the screen.
- Messages unread badge appears in the sidebar.
- The existing mobile hamburger drawer and bottom nav remain unchanged for phones.
- Main content is shifted right on desktop so it does not sit under the sidebar.

## Files changed

- `src/routes/+layout.svelte`
- `src/lib/components/DesktopSidebar.svelte`

## Apply

Run from the CampusMart project folder:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase21_DesktopSidebar.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

No Supabase SQL is needed.
