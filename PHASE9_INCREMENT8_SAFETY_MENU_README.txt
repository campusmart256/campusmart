CampusMart Phase 9 Increment 8 — Safety Menu

What changed:
- Moves the chat safety tools into a three-dot button at the top-right of the chat header.
- The menu contains Block/Unblock user and Report this conversation.
- Removes the large Safety tools card from the bottom of the chat.
- No new Supabase SQL is required.

Apply from the CampusMart project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment8_SafetyMenu.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

Verification:
- Open any conversation.
- Click the three-dot button at the top-right.
- Confirm the Safety tools menu opens.
- Test Block/Unblock and Report conversation.
