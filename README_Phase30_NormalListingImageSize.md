# CampusMart Phase 30 — Normal Listing Image Size

This update adjusts the listing detail page so product images no longer stretch across the whole laptop screen.

## Changes

- Keeps listing information under the image.
- Reduces desktop product image width to a more normal marketplace size.
- Caps desktop image height so tall screens do not make the image enormous.
- Centers the image/content column on wide displays.
- Keeps mobile layout unchanged.

## Files changed

- `src/routes/listing/[id]/+page.svelte`

## Apply

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase30_NormalListingImageSize.zip" -DestinationPath . -Force
```

Then run:

```powershell
npm run check
npm run build
npm run dev
```

No Supabase SQL is needed.
