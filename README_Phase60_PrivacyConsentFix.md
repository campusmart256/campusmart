# CampusMart Phase 60 — Privacy Policy and Consent Fix

This incremental patch resolves the two actions from the Phase 60 audit: a missing Privacy Policy page and missing clickable signup legal links.

## Files
- `src/routes/privacy/+page.svelte` — new `/privacy` route; draft privacy notice styled like existing legal pages.
- `src/routes/signup/+page.svelte` — checkbox now links to `/terms` and `/privacy` in separate tabs.
- `src/routes/+page.svelte` — adds Privacy Policy to the existing homepage footer; preserves the homepage redesign.
- `scripts/phase60-audit.mjs` — checks that privacy page and actual signup/footer links exist.

## Install (from project root)
```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase60_PrivacyConsentFix.zip" -DestinationPath . -Force
node scripts/phase60-audit.mjs
npm run check
npm run build
npm run dev
```

## Test
1. Open `/privacy` and read the policy.
2. Open `/signup`; click Terms & Conditions and Privacy Policy; both should open real pages.
3. Try submitting signup without checking the box; consent must still be required.
4. Check the homepage footer's Privacy Policy link.
5. Run the Phase 60 audit again; the two original ACTION entries should now be PASS.

## Legal and operational review
The privacy notice is a starter draft based on visible application functionality, not legal approval or proof of real operational practices. Before public launch, confirm the actual service providers, access controls, data retention/deletion procedures, student verification document handling, and applicable Ugandan data protection requirements. Do not treat a passing static audit as a security certification.

No SQL migration required. No changes to Supabase or existing data.
