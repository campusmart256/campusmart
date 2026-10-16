# CampusMart Phase 53 — Recently Viewed Listings

Install **after Phase 52**. This is an incremental update, not a full project.

## What's included
- Recently viewed page at `/recently-viewed`.
- A link in the desktop sidebar and mobile navigation drawer.
- Active listing pages automatically add a history entry when a non-owner opens them.
- Keeps up to 24 unique listings, newest first, in the current browser's localStorage.
- Remove individual items or clear the entire history with confirmation.
- No personal data or browser history is sent to Supabase. No SQL required.

## Install
Extract the ZIP into your CampusMart project directory with overwrite enabled, then run:

```powershell
npm run check
npm run build
npm run dev
```

## Test
1. Open two active listings as a visitor or buyer, then open `/recently-viewed`.
2. Confirm the two items appear in newest-first order.
3. Open the first item again and verify it moves to the top.
4. Remove one item, refresh, then clear the remaining history.
5. Verify listing galleries, sharing, saving, seller profile links, and mobile navigation still work.

## Notes
- History is device/browser specific; it is not synchronized between accounts or devices.
- The listing card stores a *snapshot* of title, photo and price. Opening it checks current availability. Sold/removed listings may still appear until cleared.
- Browsers with localStorage disabled will still allow normal browsing, but history will not persist.
- Svelte compilation and integration with your local project have not been verified in this environment.
