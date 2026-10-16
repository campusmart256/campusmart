CampusMart Phase 9 — Increment 3: Unread message badges

What changed:
- Adds unread message counts to the Messages item in the side drawer.
- Adds unread message counts to the bottom mobile Messages tab.
- Highlights conversations with unread messages on /messages.
- Adds a small database helper function to mark messages as read when a participant opens the conversation.

Important database step:
Run database/campusmart_migration_v0.1.3_message_read_status.sql once in Supabase SQL Editor.
This migration does not create a new table. It uses the existing public.messages.read_at column.

How to apply:
1. From the project folder, run:
   Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment3_Unread.zip" -DestinationPath . -Force

2. In Supabase SQL Editor, run the contents of:
   database/campusmart_migration_v0.1.3_message_read_status.sql

3. Restart local dev:
   npm run check
   npm run build
   npm run dev

Expected test:
- Log in as buyer in one browser and seller in another.
- Send a message from buyer to seller.
- Refresh seller's page or navigate to another page.
- The Messages nav item should show an unread badge.
- Open the conversation as seller.
- The badge should clear after the page loads or after one extra refresh.

Notes:
- This update does not depend on realtime working.
- Because your local live updates are not working yet, unread counts update when the page is loaded/refreshed or when navigating.
