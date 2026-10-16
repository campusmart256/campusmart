# CampusMart Phase 28 — Listing info under image

## What this changes

On wide screens, the listing detail page now keeps more product information under the image:

- Price
- Negotiable tag
- Item title
- Condition/category/posted tags
- Seller card
- Description
- Similar items

The right side remains focused on the safety warning and seller action button.

## Files changed

- `src/routes/listing/[id]/+page.svelte`

## Supabase

No Supabase SQL required.

## Test

1. Run `npm run check`
2. Run `npm run build`
3. Run `npm run dev`
4. Open a listing on a laptop/desktop width.
5. Confirm price, title, tags, seller, description, and similar items appear under the image.
6. Confirm the phone layout still works.
