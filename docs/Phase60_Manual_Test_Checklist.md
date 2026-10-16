# CampusMart Phase 60 — Manual test checklist

Use two normal student accounts (A and B), plus a separate staff account if available. **Use dummy listings and test documents only.** Record screenshots and Console errors. Never share passwords, API secrets, student IDs, or private verification documents.

| Test | Expected result | Result (Pass/Fail/Not tested) |
|---|---|---|
| Guest visits homepage, searches and filters | Public active listings load; no sign-in required | |
| Guest tries Saved Items and Messages | Redirected to sign-in | |
| Student A creates a listing with photos | Listing appears and photos load | |
| Student B opens listing and messages seller A | Only A and B see the conversation | |
| Student B tries a conversation URL belonging to others | Access denied/not found | |
| Student B saves and unsaves A's listing | Saved Items updates | |
| Student A attempts to save own listing | Not permitted | |
| Student A records partial sale | Stock and sales history update consistently | |
| Student B tries to edit A's listing | Access denied | |
| Student A requests verification with a dummy document | Request saved; document not publicly exposed | |
| Guest/Student B tries staff document URL | Access denied | |
| Nonstaff visits admin reports/verification | Access denied | |
| Seller profile public view | Only intended public fields shown | |
| Listing image link contains unexpected file path | Request rejected | |
| Password reset, logout and login | All complete without redirecting off-site | |
| 320px, 375px, 430px mobile widths | No horizontal overflow or obscured controls | |
| Slow network/mobile device | Usable performance and readable text | |
| Footer terms, copyright, About, email and WhatsApp | All links work and contact is correct | |
| Privacy notice and consent | Actual policy available and linked at signup | |

Keep any failed test details for the next Phase 60 fix increment.
