# CampusMart Phase 59.4 — Messages UI Redesign

Install after Phase 59.3. This is a **design-focused incremental patch** with two Svelte files and no database changes.

## Changes
- Navy inbox hero, clearer conversation cards, better spacing and unread badges.
- Inbox search by seller/buyer name, listing title, or latest message, plus an unread-only filter. Filters apply to conversations already loaded by the server.
- Navy conversation header, polished message bubbles, a slim message scrollbar and improved composer.
- Better mobile layout at 320px, 375px, and 430px.
- Preserves existing Supabase actions, realtime, replies, swipe-to-reply, delete/unsend, WhatsApp, safety reports, and blocking.

## Install
Back up the project first. In PowerShell, from the folder containing `package.json`:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase59_4_MessagesRedesign.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

No Supabase SQL required.

## Test
1. Open `/messages`. Search by person and listing title, toggle unread-only, open a conversation.
2. Send and reply to a message. Check incoming messages and unread badges.
3. Test the safety menu, report, block/unblock, WhatsApp reveal, delete/unsend.
4. Test at 320px, 375px, 430px, and desktop widths. Check there is no horizontal overflow.
5. Verify saved items and listing page still work.
