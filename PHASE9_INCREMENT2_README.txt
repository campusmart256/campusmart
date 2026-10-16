CampusMart Phase 9 Messaging - Increment 2

What this update adds:
- Live message refresh on the individual conversation page using Supabase Realtime.
- A status pill that says whether live updates are connected or falling back to manual refresh.
- Better chat layout, auto-scroll to newest messages, and a sticky composer.

Important verification notes:
- This does not prove Supabase Realtime works on the user's real Supabase project until tested with two accounts.
- Message sending still uses the existing protected database function send_message.
- If Realtime is disabled or unavailable locally, sending messages should still work after refreshing.

Apply from the project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment2_Realtime.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

Manual test:
1. Sign in as seller in one browser.
2. Sign in as buyer in another browser or private window.
3. Open the same conversation on both sides.
4. Send a message from one side and check whether it appears on the other side without refresh.
