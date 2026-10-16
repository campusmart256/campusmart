# CampusMart Phase 29 — Full-width listing detail

## What changed

This phase changes the desktop/laptop listing detail page so the right-hand column is removed.

On wider screens, the listing detail page now uses the full available content width and shows this order:

1. Product image gallery
2. Price
3. Item title
4. Condition/category/posted tags
5. Seller card
6. Safety warning
7. Message seller button
8. Description
9. Similar items
10. Back to home link

The mobile layout remains unchanged.

## Files changed

- `src/routes/listing/[id]/+page.svelte`

## How to apply

From the CampusMart project folder, run:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase29_FullWidthListingDetail.zip" -DestinationPath . -Force
```

Then run:

```powershell
npm run check
npm run build
npm run dev
```

## Supabase

No new Supabase SQL is needed.

## Test

Open a listing page on a laptop or wide browser window. Confirm that:

- the right-hand column is gone,
- the image uses more horizontal space,
- price, seller card, message button, description, and similar items appear under the image,
- the phone layout still works.
