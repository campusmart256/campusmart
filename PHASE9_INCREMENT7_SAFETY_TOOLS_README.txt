CampusMart Phase 9 Increment 7 — Chat Safety Tools

This update adds safety controls inside the chat page:
- Block user / Unblock user
- Report conversation with a reason and optional note
- Messaging is paused in the UI after you block the other user
- Reports are stored in the existing public.reports table
- Blocks are stored in the existing public.blocks table

No new Supabase SQL is required. The base schema already has blocks, reports, and the send_message function checks blocks.

Apply from the project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment7_SafetyTools.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

How to test:
1. Open a conversation between two accounts.
2. Click Safety tools > Report this conversation.
3. Submit a reason and confirm the report success message appears.
4. Click Block user.
5. Confirm the composer is disabled and the warning appears.
6. Try sending from the other account. The database should reject the message because send_message checks is_blocked_between.
7. Click Unblock user and confirm messaging works again.

Status: NEEDS VERIFICATION on your local machine.
