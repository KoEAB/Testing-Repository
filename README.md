# Naval Command warship selection

A responsive, framework-free browser game shell with a title screen, Home Port lobby, section navigation, four selectable combat maps with square footprints, a separate concealment demo, and a 64-slot Shipyard containing 60 historical warship records, four reserve slots, type-and-rarity filters, and switchable portraits.

The combat demo uses four hex-only maps. Their land cells are saved in `map-terrain-data.js`, including the supplied terrain corrections, and block movement and firing. Northern Lights is 48 × 48 km on a 56 × 48 hex grid; the other maps are 42 × 42 km on 49 × 42 hex grids. The developer terrain editor paints land or sea and generates an `NC-T1` code containing further changes for the active map. Edits remain available while switching maps during the same session. Switching maps clears deployed ships. Developer setting up mode can place friendly and enemy units on any unoccupied hex and export or import a separate layout code. Ships travel directly when the route is clear and detour around land. Gunships choose AP or HE with keys 1 and 2; changing ammunition reloads guns until the next turn. Fire remaining salvos stops before launching an unnecessary salvo. HE that hits a DD or DE always penetrates. Torpedoes automatically turn the attacker broadside toward the target. Movement, guns, and torpedoes are tracked independently each turn.

Every turn has a green phase followed by a red phase. `Q` activates the phase button: **Change Phase** passes from green to red without restoring anything; **Next Turn** ends red, advances the turn, restores actions, and ticks reloads and wreck lifetimes once. Only the active side can issue orders, and only its action bars are visible.

Terms supplied in square brackets are literal game terms. A turn contains both phases; Change Phase is distinct from Next Turn. Green maps to the internal `friendly` team and red to `enemy`, regardless of whose phase or perspective is active. Action bars are the segmented resource bars beneath unit health bars.

Combat demo is Developer mode: both fleets stay visible, with the existing fleet, map, terrain, and setup tools. Concealment demo is Player mode: the player always sees the green perspective; **Next Phase** hands off to the red AI placeholder, which immediately ends its phase and starts the next turn. VS mode is for two humans sharing a computer: map visibility, inspection, and the combat log switch to the active side. Neither player gets hidden opposing contacts, action state, or private logs. All modes start in the green phase. Open **Log** to review events available to the current side.

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

## Combat code

`ship-combat-data.js` defines ship types and named combat statistics shared by the Shipyard and combat demos. Adding a named combat ship there makes it available in the developer panel; add its historical profile in `data.js` to show it in the Shipyard. `combat-rules.js` contains damage, detection, and shell calculations. `combat-phases.js` defines turn progression and control/view permissions for all three modes. Run their checks with `node --test tests/*.test.js`.
