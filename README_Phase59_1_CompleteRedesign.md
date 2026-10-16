# CampusMart Phase 59.1 — Seller Studio & Account Redesign

A visually substantial redesign of the existing Phase 59 pages. This patch contains ONLY the two changed Svelte page components. Install on top of Phase 59 and the earlier updates.

## Changes
- Seller dashboard: dark navy/red hero, quick inventory and listing actions, four distinct metric tiles, draft/sold mini-summary, polished recent activity panels, and a reworked navigation bar.
- Account: dark header, branded profile card, avatar overlay, verification status, quick-access settings tiles, and cleaner form sections.
- Mobile-first at 320px, 375px and 430px with no database changes.
- Existing Supabase loaders, forms, actions, sales export, stock tools, reviews, verification, and tab routes remain intact.

## Install (PowerShell in project root)

```powershell
# Optional backup of the current pages
Copy-Item -LiteralPath 'src\routes\my-listings\+page.svelte' -Destination 'src\routes\my-listings\+page.svelte.phase59-backup' -Force
Copy-Item -LiteralPath 'src\routes\account\+page.svelte' -Destination 'src\routes\account\+page.svelte.phase59-backup' -Force

Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase59_1_CompleteRedesign.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

No Supabase SQL required.

## Test
1. `/my-listings?tab=dashboard`: dark header, four visually distinct metrics, draft/sold summary, recent sales and ratings.
2. Navigate Active, Drafts, Sold, Bought, Inventory, Sales History. Test filters, sale recording, reviews, CSV export, and listing editing.
3. `/account`: new cover/profile card, settings shortcuts; test avatar, display name, contact preferences and verification forms.
4. Use DevTools responsive view at 320, 375, 430px and desktop. Look for overflow and missing buttons.

The dashboard numbers and sales remain seller-recorded and are not verified payments.
