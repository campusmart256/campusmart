# CampusMart Phase 22 — Verification Request Button

Adds a Student verification section to `/account` where a user can request verification.

## What changed

- Profile tab now has a Student verification card.
- Unverified/rejected users can submit:
  - full name
  - course/programme
  - year of study
  - registration number
- After submission, the request is inserted into `verification_requests`.
- Existing database trigger should set `profiles.verification_status` to `pending`.
- Verified users see that they are already verified.
- Pending users see that their request is pending.

## Supabase

No new SQL is needed if your existing CampusMart schema already includes `verification_requests`.

If the request fails with `relation "verification_requests" does not exist`, your earlier database schema/migration was not fully applied.

## Test

1. Open `/account`.
2. Go to Student verification.
3. Fill the form.
4. Click Request verification.
5. Confirm the profile badge changes to Verification pending.
