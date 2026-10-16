CampusMart Phase 9 — Increment 1: Core messaging (UNVERIFIED with real Supabase)

Contents: src/ folder with the updated and existing application files.
Does not include .env, dependencies, secrets or database migrations.

Changes:
- /messages conversation list, participants only
- /messages/[id] chat history and message send via existing send_message RPC
- Listing page Message seller starts or reuses a conversation via start_conversation RPC
- Messages removed from placeholder route matcher
- Server-side login, UUID and participant checks
- Last 100 messages displayed; sending limited to 1000 characters

Apply on Windows from the campusmart-app folder containing package.json:
  1. Make a backup or git commit of your current files first.
  2. Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment1.zip" -DestinationPath . -Force
  3. npm run check
  4. npm run build
  5. npm run dev

IMPORTANT: this archive only updates src/. It should not replace package.json, .env or your database.

Test with TWO distinct confirmed accounts:
  A. Buyer opens an active listing owned by seller and presses Message seller.
  B. Buyer sends a short message, sees it after redirect.
  C. Seller signs in and sees the conversation at /messages; replies.
  D. Buyer opens conversation and sees seller's reply after refreshing.
  E. A third user must NOT be able to view that conversation by URL.
  F. An unverified user's first message with a link/phone should be rejected by DB.
  G. Check blocked users and account limits once moderation/block UI exists.

Known limitations:
- Not Realtime yet; manual refresh for incoming messages.
- No email/push notifications, report/block UI, WhatsApp reveal or read receipts.
- Real Supabase / production behavior UNVERIFIED.
- The existing database schema must already have start_conversation and send_message.
- Tests not run: the available build environment has Node 22.16, but SvelteKit requires >=22.17.
