# CampusMart Phase 56 — Homepage Redesign

This is an **incremental patch** based on the source code in the `campusmart-app.rar` archive you uploaded. It is **not** a full project and does not include your `.env`, database, or credentials.

## What's changed
- New responsive homepage hero with a clear Explore listings and Start selling call to action.
- Refined search, category chips, result headings, verified-seller toggle and sorting.
- Removable filter chips, clearer empty states, and a short safe-trading reminder.
- Refined listing cards: condition on the photo, clearer prices, verified seller label, and save hearts preserved.
- No changes to database schema, authentication, route server loaders, or APIs.

## Install on Windows PowerShell

Run from the CampusMart project root (the folder containing `package.json`). **Back up your project first.**

```powershell
Copy-Item "src\routes\+page.svelte" "src\routes\+page.svelte.phase55-backup" -Force
Copy-Item "src\lib\components\ListingCard.svelte" "src\lib\components\ListingCard.svelte.phase55-backup" -Force
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase56_HomepageRedesign.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

Open `http://localhost:5173`.

## Test
1. Open homepage at desktop and phone widths; verify the hero and cards fit without horizontal scrolling.
2. Search for an item or seller; clear the search chip.
3. Change categories; clear category and all filters.
4. Toggle verified sellers and change sort order.
5. Save and unsave an item using the heart (signed in); confirm it still appears in Saved Items.
6. Open a listing from a card; test sign-in links and Start selling.
7. Check a seller profile and Saved Items page to verify listing cards still display correctly.

## Verification notes
- Both changed Svelte components compiled successfully with the Svelte compiler (zero warnings).
- `npm run check` could not complete in the sandbox because the uploaded `node_modules` contains Windows-native packages; the sandbox runs Linux and lacks the matching Rolldown binding. Run the commands on your Windows PC.
- No Supabase SQL needed.
