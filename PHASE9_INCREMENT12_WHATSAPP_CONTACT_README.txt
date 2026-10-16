CampusMart Phase 9 Increment 12 — WhatsApp contact in chat

What this update changes:
- Adds a WhatsApp contact section inside the chat three-dot Safety tools menu.
- Buyers can reveal the seller's WhatsApp contact through the existing protected reveal_whatsapp database function.
- The seller's number is not shown publicly; it is revealed only after the logged-in buyer requests it.
- Shows an Open WhatsApp button after the number is revealed.
- Uses the existing daily reveal limit and reveal log from the database.
- No new Supabase SQL is required.

How to test:
1. Sign in as the seller and go to Profile & verification.
2. Add a WhatsApp number and enable the WhatsApp switch.
3. Sign in as a buyer and open the chat for that seller's listing.
4. Tap the three-dot button at the top-right of the chat.
5. Tap Reveal WhatsApp.
6. Confirm an Open WhatsApp button appears.
7. Test from the seller account: the seller should not be able to reveal their own listing contact.

Safety note:
Keep reminding users to meet in a public campus place, inspect the item first, and never send deposits.
