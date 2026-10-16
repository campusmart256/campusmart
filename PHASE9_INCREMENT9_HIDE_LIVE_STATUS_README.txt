CampusMart Phase 9 Increment 9 — Hide live update status

What changed:
- Removes the visible "Live updates are on" status pill from the chat header.
- Removes the developer note about live updates from the chat bottom.
- Keeps the realtime subscription running in the background.
- Keeps the three-dot safety menu at the top-right.

Apply from the CampusMart project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment9_HideLiveStatus.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

No Supabase SQL is needed.
