# CampusMart Phase 24 — Verification badge counter

Adds a pending verification request badge for staff users.

## What changed

- The root layout server now counts pending verification requests for staff users.
- The desktop sidebar shows a badge beside **Verification requests**.
- The mobile hamburger drawer also shows the same badge for staff users.
- The badge is hidden when there are 0 pending requests.
- No new Supabase SQL is required.

## Apply

From the CampusMart project folder:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase24_VerificationBadgeCounter.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Test

1. Log in as a staff/super_admin account.
2. Make sure at least one user has a pending verification request.
3. Check the desktop sidebar: **Verification requests** should show a number badge.
4. Check the mobile hamburger menu: the same badge should appear.
5. Approve/reject the request and refresh. The badge should reduce or disappear.
