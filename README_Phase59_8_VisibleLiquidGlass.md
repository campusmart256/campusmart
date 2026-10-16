# CampusMart Phase 59.8 — Visible Liquid Glass

## Install

Back up `src/app.css` before extraction. Extract this ZIP into the CampusMart project root, replacing `src/app.css`.

```powershell
Copy-Item -LiteralPath 'src\app.css' -Destination 'src\app.css.before-phase59-8' -Force
Expand-Archive -Path "$HOME\Downloads\CampusMart_Phase59_8_VisibleLiquidGlass.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

No SQL changes. This patch is based on the previous Phase 59.7 stylesheet and preserves earlier navigation and layout fixes.

## Visual differences

- More colorful ambient background, especially behind homepage search and category tiles.
- Stronger transparency and reflective borders on cards, tiles, and secondary controls.
- Search field no longer renders an opaque inner rectangle.
- Polished glass header; existing floating mobile dock remains unchanged.
- Readability and reduced-transparency/motion fallbacks included.

## Test

Hard refresh Chrome (Ctrl+Shift+R). Compare homepage search/categories before and after; test active category, search, filters, product cards, messages, account, seller dashboard, and mobile 375px. On slower phones, check scrolling performance.

If the result is too translucent, restore the backup CSS. This is an iOS-inspired CSS visual effect, not native Apple optical refraction.
