# Phase 59.6 — Liquid Glass Header & Mobile Navigation

This patch updates only `src/routes/+layout.svelte` and `src/lib/components/BottomNav.svelte`.

- Frosted sticky header with subtle depth when scrolling.
- Floating translucent mobile bottom navigation with backdrop blur, refined active tabs, and a raised Sell button.
- Main content bottom spacing adjusted so the floating navigation does not obscure page content.
- Safe-area support, reduced-transparency and reduced-motion fallbacks.
- No new SQL or database changes.

## Install from your CampusMart project root

```powershell
Copy-Item -LiteralPath 'src\routes\+layout.svelte' -Destination 'src\routes\+layout.svelte.before-glass' -Force
Copy-Item -LiteralPath 'src\lib\components\BottomNav.svelte' -Destination 'src\lib\components\BottomNav.svelte.before-glass' -Force
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase59_6_LiquidGlassHeader.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Test

- Desktop homepage: scroll down and inspect the sticky header and contrast.
- Mobile 320, 375 and 430px: scroll the homepage; bottom tabs should have a translucent glass look.
- Check Browse, Saved, Sell, Messages, Profile and unread badges.
- Open a listing, the Messages page, and a form to ensure bottom navigation does not hide content.
- Check on an actual phone when possible: browser simulators may not reproduce iOS backdrop filters exactly.
