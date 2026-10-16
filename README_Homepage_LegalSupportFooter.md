# CampusMart — Homepage Legal & Support Footer

This incremental patch adds a responsive footer **at the bottom of the homepage**, after the existing safety reminder. It does not change the existing liquid-glass stylesheet, Supabase, messages, listings, or other features.

## Included
- `src/routes/+page.svelte` — footer with links and contact details
- `src/routes/about/+page.svelte` — About CampusMart page
- `src/routes/terms/+page.svelte` — starter Terms & Conditions
- `src/routes/copyright-policy/+page.svelte` — starter Copyright Infringement Policy

## Contacts
- Support email: campusmart256@gmail.com
- WhatsApp: +256741448912 (opens https://wa.me/256741448912)

## Install (PowerShell from project root)
```powershell
Copy-Item -LiteralPath 'src\routes\+page.svelte' -Destination 'src\routes\+page.svelte.before-legal-footer' -Force
Expand-Archive -Path "$HOME\Downloads\CampusMart_Homepage_LegalSupportFooter.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

No SQL migration required.

## Test
1. Scroll to the very bottom of the homepage and confirm the footer appears after the safety reminder.
2. Click About CampusMart, Terms & Conditions, and Copyright Infringement Policy.
3. Check the support email opens an email app, and WhatsApp opens the support chat.
4. Check the footer at 320px, 375px, and desktop widths.
5. Confirm the homepage search, filters, and saved-item hearts still work.

## Before public launch
The Terms and Copyright pages are **starter policy drafts**, not legal advice. Have them reviewed and tailored to your actual operations and applicable Ugandan law before public deployment. Confirm that the support contacts are monitored.
