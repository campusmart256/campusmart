# CampusMart Phase 25 — Verification proof document upload

Adds a required student-proof document to the student verification request flow.

## What changed

- The `/account` verification form now asks the user to upload proof that they are a student.
- Accepted proof examples: student ID, admission letter, or recent tuition payment receipt.
- Accepted file types: JPG, PNG, WebP, or PDF.
- Maximum size: 5 MB.
- The file is stored privately in R2 under `verification/...`, not served by the public `/photos` route.
- Staff can open the document from `/admin/verification` through a protected admin-only route.
- The admin verification cards now show the document name, type, size, and an **Open document** link.

## Apply

From the CampusMart project folder:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase25_VerificationDocuments.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Supabase SQL

Run this file in Supabase SQL Editor:

```text
database/campusmart_migration_v0.1.9_verification_documents.sql
```

## Test

1. Log in as a normal user whose verification status is not pending/verified.
2. Go to `/account`.
3. Fill in verification details and upload a JPG, PNG, WebP, or PDF proof document.
4. Submit the request.
5. Log in as staff/admin.
6. Go to `/admin/verification`.
7. Confirm the card shows the document details.
8. Click **Open document** and confirm only staff can view it.

## Safety note

Tell users not to upload passwords, bank card details, or private payment PINs. The form text already warns them.
