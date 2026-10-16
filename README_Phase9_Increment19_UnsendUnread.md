# CampusMart Phase 9 — Increment 19: Safe Unsend for Unread Messages

## What this adds

- Adds **Unsend** inside the long-press message menu.
- The option appears only on messages you sent.
- The option disappears after the other person opens/reads the message.
- Unsent messages are hidden from normal chat screens.
- The original message stays in the database for safety/moderation review.

## Install

From the CampusMart project folder:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment19_UnsendUnread.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Supabase SQL

Run this once in Supabase SQL Editor:

```text
database/campusmart_migration_v0.1.7_message_unsend.sql
```

Do not paste the file path. Paste the SQL inside the file.

## Test

1. Buyer sends a message to seller.
2. Before seller opens the conversation, buyer long-presses the message.
3. Buyer should see **Unsend**.
4. Buyer unsends the message.
5. The message should disappear from both normal chat screens after refresh.
6. Send another message.
7. Let seller open the conversation.
8. Buyer long-presses the message again.
9. **Unsend** should no longer appear. **Delete for me** can still appear.

## Verification status

Needs local verification.
