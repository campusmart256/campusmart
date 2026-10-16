# CampusMart Phase 37 — Moderator Reports Dashboard

Adds a staff-only reports dashboard so moderators can review reported items/chats/users.

## Added

- New staff page: `/admin/reports`
- Sidebar/mobile menu link: `Reports`
- Badge counter for open reports
- Tabs: Open / Actioned / Dismissed
- Report details: reason, note, reporter, reported user, item preview
- Actions:
  - Remove listing
  - Mark actioned
  - Dismiss

## Apply

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase37_ModeratorReports.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Supabase

Run:

```text
database/campusmart_migration_v0.2.1_moderator_reports.sql
```

Then wait 10–20 seconds and restart `npm run dev`.

## Test

1. Use a normal account to report an item.
2. Log in as your staff/super_admin account.
3. Open `/admin/reports`.
4. Confirm the report appears.
5. Test Dismiss first.
6. Test Remove listing on a test listing only.

Status: NEEDS VERIFICATION until tested locally.
