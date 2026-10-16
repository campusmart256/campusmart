# CampusMart Phase 23 — Admin verification review

This update adds an admin-only verification review page at:

/admin/verification

## What it adds

- Staff-only verification request dashboard
- Pending / Approved / Rejected tabs
- Approve verification button
- Reject with reason
- Updates profile verification status after approval/rejection
- Adds desktop sidebar link for staff users

## Apply

Expand this ZIP into your CampusMart project folder, then run:

```powershell
npm run check
npm run build
npm run dev
```

## Supabase

Run:

```text
database/campusmart_migration_v0.1.8_staff_verification_review.sql
```

Then add your own account as staff using the commented SQL at the bottom of that migration file.

Do not deploy until tested locally.
