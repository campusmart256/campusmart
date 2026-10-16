# CampusMart Phase 59.7 — Sitewide Liquid Glass Design

A **CSS-only** visual upgrade for the existing Phase 59.6 project. Updates `src/app.css` only.

## Install (from project folder)

```powershell
Copy-Item -LiteralPath 'src\app.css' -Destination 'src\app.css.before-glass-everywhere' -Force
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase59_7_SitewideLiquidGlass.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## What changes
- Luminous, soft-gradient page background
- Frosted glass cards, listing tiles, seller metrics, inbox surfaces, filters and dialogs
- Soft elevation and subtle hover motion on desktop
- Glass-style form controls and secondary buttons
- Preserves the existing dark navy banners, red primary buttons, images, message bubbles, and Phase 59.6 glass header/mobile dock
- Respects `prefers-reduced-transparency` and `prefers-reduced-motion`

## Test
1. Hard refresh with Ctrl+Shift+R.
2. Browse home, listing details, Saved Items, seller dashboard, account, messages, and sell form.
3. Test at 375px and desktop widths.
4. Confirm text remains legible, forms and messages work, and mobile scrolling stays smooth.

## Rollback

```powershell
Copy-Item -LiteralPath 'src\app.css.before-glass-everywhere' -Destination 'src\app.css' -Force
```

No Supabase SQL required. The stylesheet is based on the previously approved Phase 59.5 CSS; if you have manually edited `src/app.css` since then, compare/merge instead of blindly overwriting.
