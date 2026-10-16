# CampusMart — Phase 60: Initial pre-launch audit

**Scope:** Static review of the latest reconstructable CampusMart source snapshot: the project uploaded before Phase 56, with the incremental updates through Phase 59.9, legal footer, and removal of pre-launch notices applied in order. Your local files and live Supabase configuration may differ. No live credentials or production database were accessed.

## Findings

| Priority | Finding | Evidence from source | Action |
|---|---|---|---|
| **High — before launch** | **Privacy notice missing** | `src/routes/signup/+page.svelte` asks users to agree to the “Terms of Use and Privacy Policy”, but no `/privacy` or `/privacy-policy` route was present. | Draft a real privacy notice explaining data collection, student verification documents, retention, support contacts and users' rights; review under applicable Ugandan law. Link both documents at signup. Do not claim compliance until reviewed. |
| **High — verify in live Supabase** | **Database row-level security not independently verified** | Source includes migration SQL and user-scoped Supabase queries; local files do not show what policies are actually installed in the project database. | Run the included *read-only* RLS inventory SQL in Supabase and inspect tables/policies. Test access using two ordinary accounts and one staff account. |
| **High — before launch** | **Student verification documents require live access testing** | `src/routes/admin/verification/document/[id]/+server.js` checks `staff` before reading private R2 objects; `src/lib/server/verification-documents.js` stores documents with private cache settings. | Confirm unauthenticated users, other students and unapproved staff cannot fetch any document. Review R2 bucket access and retention. |
| **Medium** | **No automated application test suite was found in the uploaded snapshot** | `package.json` has `check` and `build` scripts but no test script. | Run included Node validation tests; add browser integration tests before launch. |
| **Medium** | **Marketplace homepage limits listings** | `src/routes/+page.server.js` caps feed results at 48 after fetching up to 100. | Plan pagination and verify filtering/search expectations when inventory grows. |
| **Medium** | **Legal policy text needs review** | `/terms` and `/copyright-policy` are draft pages added during earlier phases. | Review actual business policies, prohibited items, disputes, copyright notices and contact procedures before public launch. |
| **Positive observation** | **Authenticated server actions use verified identity** | `src/hooks.server.js` uses Supabase `auth.getClaims()`; messaging route checks conversation participants. | Retest against a second user to validate database RLS and RPC protections. |
| **Positive observation** | **Verification documents are not served by the public photo route** | Public `/photos/[...key]` accepts only `listings/` or `avatars/` key prefixes. | Keep this separation and test it in staging. |

## What was NOT verified

- Live Supabase RLS policies, RPC function permissions, SQL security-definer behavior, or auth settings.
- Actual R2 bucket configuration, Cloudflare deployment bindings, secrets, or DNS.
- Real browser workflows, email verification, WhatsApp, live chat, purchases, accessibility or mobile performance.
- Full build on the user's Windows computer.

**Launch gate:** Do not treat this audit as approval to deploy. Resolve the privacy-notice gap, review legal terms, verify live RLS, and complete manual multi-user tests first.
