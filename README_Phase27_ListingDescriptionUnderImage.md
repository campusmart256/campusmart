# CampusMart Phase 27 — Listing description under image

This update changes the desktop/tablet listing detail layout.

## What changed

- On wider screens, the item description now appears under the product image.
- Similar items now appear under the product image and description.
- The seller/action panel stays on the right side.
- Mobile layout is kept safe and unchanged in spirit.
- No Supabase SQL is needed.

## Apply

From your CampusMart project folder:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase27_ListingDescriptionUnderImage.zip" -DestinationPath . -Force
```

Then run:

```powershell
npm run check
npm run build
npm run dev
```

## Test

Open a listing page on laptop/tablet width and confirm:

- product image stays on the left
- description appears below the image
- similar items appear below the description
- price, seller, and message button stay on the right
