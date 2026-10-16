# CampusMart Phase 36 — Messages green check

Adds the universal green check beside verified users in the Messages conversation list.

## Changes
- Loads `verification_status` for buyer/seller profiles in `/messages`.
- Shows the compact green check circle next to the username when the other user is verified.
- Keeps the text-free universal verification style.
- No Supabase SQL needed.

## Apply
```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase36_MessagesGreenCheck.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```
