CampusMart Phase 20 — Responsive layout foundation

What this update changes:
- Keeps the mobile-first design intact.
- Adds tablet/laptop/desktop breakpoints.
- Expands the Home page into a wider listing grid on larger screens.
- Improves the desktop search/filter/category layout.
- Improves listing cards spacing and hover states on devices with a mouse.
- Adds a desktop listing page layout: gallery on the left, details on the right.
- Adds wider desktop containers for Messages and Chat screens.
- Updates the old Home warning text so it no longer says messaging is not built.

Files changed:
- src/app.css
- src/routes/+layout.svelte
- src/routes/+page.svelte
- src/routes/listing/[id]/+page.svelte
- src/routes/messages/+page.svelte
- src/routes/messages/[id]/+page.svelte

No Supabase SQL is needed.

How to apply:
1. From the CampusMart project folder, run:
   Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase20_ResponsiveLayout.zip" -DestinationPath . -Force

2. Then run:
   npm run check
   npm run build
   npm run dev

How to test:
- Open http://localhost:5173 on your laptop.
- Test the Home page at wide screen size.
- Resize the browser from phone width to laptop width.
- Open a listing page and confirm the large-screen layout has photos on the left and details on the right.
- Open Messages and a chat and confirm the layout is wider and still usable.
- Test on phone width again to confirm the mobile layout still works.

Status:
- Code prepared from the current local project snapshot.
- Not fully verified in this sandbox because dependencies are not installed and the sandbox Node.js version is below the project requirement.
