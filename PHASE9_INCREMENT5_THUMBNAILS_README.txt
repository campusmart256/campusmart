CampusMart Phase 9 Increment 5 — Conversation thumbnails

What changed:
- /messages now shows the listing photo as the main thumbnail.
- A small circular avatar appears at the bottom-right of the thumbnail.
- When a buyer is logged in, the small avatar is the seller.
- When a seller is logged in, the small avatar is the buyer.
- If the listing has no photo, a simple placeholder is shown.

No new Supabase SQL is required.

Apply from the project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment5_Thumbnails.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

Needs local verification in the user's real project.
