CampusMart Phase 9 Increment 16 — Form action fix

Fixes SvelteKit error: action_default_with_named.

Why: SvelteKit does not allow a default form action in the same page that also has named actions like whatsapp, report, block, and unblock.

Change:
- Renames the default message-send action to send.
- Updates the message composer form to use action="?/send".

No Supabase SQL is needed.
