# Naval Command warship selection

A responsive, framework-free browser game shell with a title screen, Home Port lobby, section navigation, a full-screen 50-by-50 zoomable hex-map combat demo, and a 64-slot Shipyard containing 58 historical warship records, six reserve slots, type-and-rarity filters, and switchable portraits.

The combat demo uses green top-down naval symbols with health and segmented action-readiness bars. Left-click selection provides five-hex movement: ships travel in one straight geometric line when clear, and use simplified detours only when land blocks that line. Gunships can choose AP or HE with the square buttons or keys 1 and 2. Changing ammunition reloads their guns until the next turn; the selected type then persists. HE penetrations deal one-third of listed alpha and cannot ricochet, overpenetrate, or strike citadels. Submarines and destroyers also have torpedo attacks. A collapsible developer panel can deploy, control, and delete friendly or enemy units. Movement, guns, and torpedoes are tracked independently each turn.

## Current flow

`Title screen → Home Port → Combat / Shipyard / Shop / Shipbuilding / Gear`

## Run locally

From this directory, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Add warship images

The current transparent anime artwork is stored in `images/warships/` and mapped through each ship's `alternateImage` field in `data.js`. Future primary artwork belongs in `defaultImage`. Both image frames use the artwork's native 3:4 ratio and `object-fit: contain`, so supplied PNGs are never cropped.

- Selection card: 3:4
- Detail image: 3:4

Ship names, historical summaries, type codes, rarities, placeholder capabilities, colors, and links are all managed in `data.js`.
