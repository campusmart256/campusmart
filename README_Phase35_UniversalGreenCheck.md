# CampusMart Phase 35 — Universal Green Check

This update makes the verified/trusted state use the green check icon instead of writing the word "Verified" in normal user-facing UI.

## Changes

- Listing cards use only the green check circle.
- Listing detail seller card uses only the green check circle.
- Account profile status shows the green check circle when the account has the trust mark.
- Buyer selection on the sold flow shows the green check circle instead of a text badge.
- The home filter says "Green check only" instead of "Verified sellers only".
- Text that previously said "Verified students" now says "Students with the green check".

## Apply

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase35_UniversalGreenCheck.zip" -DestinationPath . -Force
```

Then run:

```powershell
npm run check
npm run build
npm run dev
```

## Supabase

No Supabase SQL is needed.
