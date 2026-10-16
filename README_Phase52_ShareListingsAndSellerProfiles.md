# CampusMart Phase 52 — Share Listings and Seller Profiles

Incremental update. Install **after Phase 51**.

## Features
- Share button on active listing pages and public seller profiles.
- Uses the phone's native share sheet when available.
- Falls back to copying the page link; if clipboard permission is denied, a selectable URL is displayed.
- WhatsApp link opens a new tab/app with a prefilled message and the public page URL.
- Does not share seller phone numbers, emails, draft listings, or private messages.
- Sharing a `localhost` URL works only on your own computer; public sharing requires deployment and a public site URL.

## Install
Extract the ZIP in your CampusMart project folder, overwriting the three included Svelte files, then run:

```powershell
npm run check
npm run build
npm run dev
```

No Supabase SQL changes.

## Test
1. Open an **active** listing, click Share link, and check clipboard/native share.
2. Click WhatsApp, confirm the item title, price, and link are populated.
3. Open the seller's profile, share that profile, and verify the URL points to `/seller/[id]`.
4. Check mobile layout and confirm Save, Message seller, reviews, seller filters, and gallery arrows still work.
5. Check that a draft listing does not display the sharing controls.

## Status
Files packaged and structurally checked; npm/Svelte compilation and browser testing remain unverified.
