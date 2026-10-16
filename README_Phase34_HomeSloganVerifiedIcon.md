# CampusMart Phase 34 — Home slogan + compact verified icon

## Changes

- On tablet/laptop/desktop, the top bar no longer repeats the CampusMart logo/name when the left sidebar already shows it.
- The top bar now shows the short slogan: **Buy and sell safely on campus**.
- Listing cards now show verified users with one green check-circle icon instead of text such as “Verified seller”.
- Listing detail seller card now uses the same compact green verified icon.
- Mobile keeps the normal CampusMart logo in the top bar because the desktop sidebar is hidden there.

## Test

Run:

```powershell
npm run check
npm run build
npm run dev
```

Then check:

- Browse marketplace page on laptop/tablet width
- Listing cards
- Listing detail seller card
- Phone width top bar
