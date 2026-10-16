# CampusMart Phase 9 Increment 17 — Safe Message Delete-for-Me

This update adds safe message deletion inside chats.

## What it does

- Users can delete a message from **their own view only**.
- The other participant still sees the message.
- The original message stays in the database so reports and moderation evidence are preserved.
- It does not add "delete for everyone" or "unsend" because that can destroy safety evidence.

## Supabase step

Run this SQL file once in Supabase SQL Editor:

`database/campusmart_migration_v0.1.6_message_delete_for_me.sql`

## Test

1. Apply the ZIP.
2. Run the SQL migration.
3. Run `npm run check`, `npm run build`, and `npm run dev`.
4. Open a chat.
5. Click the × button beside a message.
6. Confirm the delete.
7. The message should disappear for that logged-in account only.
8. Open the other account and confirm the same message still appears there.
