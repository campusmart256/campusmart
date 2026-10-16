CampusMart Phase 9 Increment 6 — Messages Left Thumbnail Fix

This update replaces the /messages list files so each conversation row shows:
- listing image thumbnail on the far left
- other participant profile picture in a small circle at the bottom-right of that thumbnail
- name, item title, and latest message preview to the right

No new Supabase SQL is required.

Apply from the project folder:
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase9_Messaging_Increment6_LeftThumbnails_Fix.zip" -DestinationPath . -Force

Then restart:
npm run check
npm run build
npm run dev

If it still does not appear, verify the file was overwritten by running:
Get-Content .\src\routes\messages\+page.svelte | Select-String "thumb-wrap"

You should see lines containing thumb-wrap. If not, the zip was not extracted into the correct project folder.
