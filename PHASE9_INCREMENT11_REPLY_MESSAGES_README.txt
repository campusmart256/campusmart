CampusMart Phase 9 Increment 11 — Reply to Specific Messages

What changed:
- Users can swipe a message from left to right to reply to it, similar to WhatsApp/Instagram.
- A small reply arrow is also shown beside each message for laptop/desktop users.
- The composer shows the selected message being replied to, with a cancel button.
- Sent replies show a quoted preview above the new message.

Important Supabase step:
Run this SQL file in Supabase SQL Editor before testing replies:
database/campusmart_migration_v0.1.4_message_replies.sql

Apply from the CampusMart project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment11_ReplyMessages.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

No secrets are included.
