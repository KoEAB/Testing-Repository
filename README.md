# Naval Command warship selection

A responsive, framework-free browser game shell with a title screen, Home Port lobby, section navigation, four selectable combat maps with square footprints, a separate concealment demo, and a 64-slot Shipyard containing 60 historical warship records, four reserve slots, type-and-rarity filters, and switchable portraits.

The combat demo uses four hex-only maps. Their land cells are saved in `map-terrain-data.js`, including the supplied terrain corrections, and block movement and firing. Northern Lights is 48 × 48 km on a 56 × 48 hex grid; the other maps are 42 × 42 km on 49 × 42 hex grids. The developer terrain editor paints land or sea and generates an `NC-T1` code containing further changes for the active map. Edits remain available while switching maps during the same session. Switching maps clears deployed ships. Developer setting up mode can place friendly and enemy units on any unoccupied hex and export or import a separate layout code. Ships travel directly when the route is clear and detour around land. Gunships choose AP or HE with keys 1 and 2; changing ammunition reloads guns until the next turn. Fire remaining salvos stops before launching an unnecessary salvo. HE that hits a DD or DE always penetrates. Torpedo launches turn destroyers to broadside and submarines toward the launch direction. Movement, guns, and torpedoes are tracked independently each turn.

Every turn has a green phase followed by a red phase. `Q` activates the phase button: **Change Phase** passes from green to red without restoring anything; **Next Turn** ends red, advances the turn, restores actions, and ticks reloads and wreck lifetimes once. Only the active side can issue orders, and only its action bars are visible.

Terms supplied in square brackets are literal game terms. A turn contains both phases; Change Phase is distinct from Next Turn. Green maps to the internal `friendly` team and red to `enemy`, regardless of whose phase or perspective is active. Action bars are the segmented resource bars beneath unit health bars.

Torpedoes select a maximum-range hex; hovering previews the selected red hex and its two adjacent range-limit hexes, including at ring bends. The actual spread ends inside those same three hexes, and the reaction-fire sector follows all three. DDs and DEs turn to their nearer broadside; submarines fire ahead. A spotted destroyer receives one free reaction salvo from every enemy gunship inside the launch sector that has loaded guns, range, line of fire, and turrets bearing on it. Used normal salvos do not prevent this free reaction; changing ammo still locks the guns until the next turn. A destroyer sunk by reaction fire cannot launch.

Torpedoes that miss a visible ship show a rising **Miss** popup at that ship when the encounter occurs. Hits show the damage actually dealt, using the gun-damage popup animation. Multiple popups are offset to remain readable, and misses do not reroll or repeat at the next waypoint for a stationary target.

Each torpedo starts in the adjacent hex and advances simultaneously with its owner's other torpedoes when that side ends its phase. Waypoints are fractions `1/N`, `2/N`, … of the original launch range, ending in the three preview hexes. Collision checks cover the entire animated segment; land stops torpedoes, friendly ships are immune, and a stationary target receives only one hit roll per torpedo, even across a waypoint boundary. A perpendicular hull has the highest hit chance (85%); 45-degree, bow, and stern presentations have large miss penalties. Moving torpedoes have temporary foam trails and take at most 720 ms to travel per phase.

Fletcher launches five torpedoes with 190 alpha each, 10-hex range, 66-knot speed, a three-turn reload, `N = 2`, and a **Torpedo concealment range** of 2 hexes. In Player and VS modes, enemy torpedoes are visible only within their own Torpedo concealment range of an opposing ship; Developer mode sees all torpedoes. `torpedo-rules.js` also stores `rangeKm * 1000 / (speedKnots * 2.6)` for future real-time travel; current phase movement does not use this formula. Unspecified generic torpedo units keep approximately their old total launch damage split across three torpedoes, with `N = 2` and Torpedo concealment range 2 until individual data is supplied.

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

The Shipyard primary/alternate portrait choice is saved in this browser by `ship-portraits.js`. The In game ship info pop up window uses the same portrait mapping and choice, including an empty frame when that picture is unavailable. It displays the actual ship type (such as Destroyer or Heavy cruiser) and omits speed, shell velocity, and torpedo speed; those statistics remain in the Shipyard and gameplay calculations.

Shipyard combat statistics are grouped into Hull & mobility, Main battery (with AP and HE ammunition subsections), and Torpedoes when equipped. Helena's traits are Scouting and Barrage Fire. Her capabilities and consumable icons come from the shared definitions in `combat-skills.js`.

Helena's Surveillance Radar (`Y`) reveals opposing warships within 10 hexes until Next Turn, including through land. Main Battery Reload Booster (`O`) immediately adds one salvo per turn until the second Next Turn. Each consumable has three charges; after its effect expires, four additional Next Turns are required before reuse. Change Phase does not tick durations or cooldowns. Adrenaline Rush passively adds one salvo per turn while HP is below 50% and stacks with Reload Booster, for up to five salvos. Bonuses preserve salvos already spent and do not bypass ammunition reloading. Consumable buttons match the square ammunition buttons; remaining charges and durations are available in tooltips and the ship info popup.

- Selection card: 3:4
- Detail image: 3:4

Ship names, historical summaries, type codes, rarities, placeholder capabilities, colors, and links are all managed in `data.js`.

## Combat code

`ship-combat-data.js` defines ship types and named combat statistics shared by the Shipyard and combat demos. Adding a named combat ship there makes it available in the developer panel; add its historical profile in `data.js` to show it in the Shipyard. `combat-rules.js` contains damage, detection, and shell calculations. `combat-phases.js` defines turn progression and control/view permissions for all three modes. `torpedo-rules.js` contains spread geometry, collision planning, and hit probabilities. Run their checks with `node --test tests/*.test.js`.
