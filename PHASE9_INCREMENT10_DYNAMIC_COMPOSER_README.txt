CampusMart Phase 9 Increment 10 — Dynamic Chat Composer

What changed:
- The message composer is no longer sticky/fixed to the bottom of the screen.
- It now scrolls naturally with the chat page.
- The large "Send message" button has been replaced with a compact round up-arrow send button.
- The message input and send button now sit on one row.
- The hidden realtime developer note remains removed.

Apply from the CampusMart project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment10_DynamicComposer.zip" -DestinationPath . -Force

Then run:
npm run check
npm run build
npm run dev

No Supabase SQL is needed.
