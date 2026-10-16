CampusMart Phase 9 — Increment 4: Message preview

What changed
- The /messages conversation list now shows the latest message preview.
- Sent messages show with a "You:" prefix.
- Each row shows a compact latest-message time.
- Unread rows make the preview bold.

No Supabase SQL migration is required for this increment.

Apply from the project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment4_MessagePreview.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

Testing
1. Open /messages after sending at least one message.
2. Confirm each conversation row shows the other student, item title, latest message preview, and time.
3. Send another message, refresh /messages, and confirm the preview updates.
