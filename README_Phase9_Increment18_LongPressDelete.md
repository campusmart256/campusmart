# CampusMart Phase 9 — Increment 18: Long-press delete

This update changes the delete-for-me UI so the delete button only appears after long-pressing a message.

## What changed

- The delete button is hidden by default.
- Long-press a message for about half a second to reveal the delete button.
- The selected message gets a subtle highlight.
- The delete action still only deletes the message for the current user.
- Reply by swipe and the small reply button still work.

## Apply

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment18_LongPressDelete.zip" -DestinationPath . -Force
```

Then run:

```powershell
npm run check
npm run build
npm run dev
```

No new Supabase SQL is needed if v0.1.6 delete-for-me SQL already ran.
