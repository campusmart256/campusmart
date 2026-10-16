# CampusMart Phase 60 — Pre-launch testing & security audit (Part 1)

This is a **read-only audit kit**. It adds test scripts and documentation; it does not overwrite your Svelte components, change Supabase data, or deploy the site.

## Install in PowerShell (from the folder containing package.json)

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase60_AuditKit.zip" -DestinationPath . -Force
node --test tests/phase60-validation.test.mjs
node scripts/phase60-audit.mjs
npm run check
npm run build
```

## Read the findings

- `docs/Phase60_Audit_Findings.md` — prioritized issues and limits of this review.
- `docs/Phase60_Manual_Test_Checklist.md` — real browser tests using two student accounts.
- `docs/Phase60_RLS_ReadOnly.sql` — optional **read-only** policy inventory in Supabase SQL Editor. Don't paste private output into public chats; share only relevant redacted information.

## Important

- The static audit is not a penetration test or live Supabase security certification.
- A missing Privacy Policy page was found; this needs to be addressed before public launch.
- Send any test failures (without private account data) and we'll prepare Phase 60 Part 2 targeted fixes.
