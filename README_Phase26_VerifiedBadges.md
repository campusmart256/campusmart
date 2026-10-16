# CampusMart Phase 26 — Verified Student Badges

## What this update adds

This phase makes approved verification visible across the marketplace.

### Added

- New reusable `VerifiedBadge` component.
- Listing cards now show a clearer verified student badge.
- Listing detail seller card now uses the verified badge.
- Messages list now shows a compact verified badge beside verified users.
- Chat header now shows a compact verified badge beside the other person's name.

## Files changed

- `src/lib/components/VerifiedBadge.svelte`
- `src/lib/components/ListingCard.svelte`
- `src/routes/listing/[id]/+page.svelte`
- `src/routes/messages/+page.server.js`
- `src/routes/messages/+page.svelte`
- `src/routes/messages/[id]/+page.server.js`
- `src/routes/messages/[id]/+page.svelte`

## Supabase

No new SQL is needed.

This phase uses the existing `profiles.verification_status = 'verified'` value.

## Test checklist

1. Approve a user from `/admin/verification`.
2. Check a listing created by that user.
3. Confirm the listing card shows a verified badge.
4. Open the listing detail page and confirm the seller card shows a verified badge.
5. Open a conversation with the verified user and confirm the badge appears in messages and chat.
6. Confirm unverified users do not show the verified badge.

## Status

NEEDS VERIFICATION until tested locally.
