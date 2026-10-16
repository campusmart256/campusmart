# CampusMart — Homepage footer mobile layout fix

This small patch updates only `src/routes/+page.svelte`. It removes the **Open messages** footer hyperlink and allows the safety heading and paragraph to use the remaining available width. The mobile Messages tab is unchanged.

## Install (PowerShell, from your CampusMart project root)

```powershell
Expand-Archive -Path "$HOME\Downloads\CampusMart_HomepageFooter_MobileFix.zip" -DestinationPath . -Force
npm run check
npm run build
npm run dev
```

## Test

Visit `http://localhost:5173`, scroll below the listings, and check the green safety footer at 320px, 375px and 430px. The heading and paragraph should wrap normally and the **Open messages** link should be absent. Messages in the bottom navigation still work.

No Supabase SQL required.
