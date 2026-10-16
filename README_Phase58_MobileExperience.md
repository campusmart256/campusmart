# CampusMart Phase 58 — Mobile Experience

Incremental patch for the tested Phase 57 CampusMart project. Install on top of Phase 57; this is **not** a full project ZIP.

## Changes
- Redesigned 5-tab mobile navigation with visible Sell label, consistent active states (including nested Messages pages), unread-message badge and larger touch targets.
- Bottom navigation and page spacing respect iPhone/Android safe-area insets.
- Mobile header now has a Search shortcut linking to the homepage search field; redundant header Sell button is hidden on phones because Sell is already in the bottom navigation.
- Inputs, search fields, and dropdowns use at least 16px text on mobile to avoid unwanted iOS Safari zoom.
- Better spacing for narrow phones, responsive photo-upload slots, focus indicators and reduced-motion support.

No database migrations. No changes to server routes, auth, payment or messaging logic.

## Install (PowerShell, from project root containing package.json)
1. Back up your project folder.
2. Download CampusMart_Phase58_MobileExperience.zip into Downloads.
3. Run:

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase58_MobileExperience.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Test
1. In browser DevTools, simulate widths 320px, 375px, 430px, 768px, and desktop.
2. On a phone, check all five bottom tabs, including unread message counts and active state inside a conversation.
3. Tap Search in the top header; confirm it navigates to the homepage search field.
4. Open the Sell form and focus text fields; confirm the page doesn't unexpectedly zoom on iPhone Safari.
5. Verify gallery, Saved, Recently Viewed, seller profiles and messages still work.
6. On iPhones with a home indicator, confirm the bottom bar stays above the safe area.

## Verification
Svelte compiler successfully compiled the three modified Svelte components with zero warnings. `npm run check` could not run in the Linux testing environment due to a missing native rolldown binding in the Windows-oriented uploaded dependencies. Run the checks on your Windows PC before continuing.
