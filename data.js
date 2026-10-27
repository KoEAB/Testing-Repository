(function () {
  "use strict";

  const classProfiles = {
    Lexington: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "SSR", weapon: "Carrier air group", accent: "#87b6d2", rgb: "135, 182, 210" },
    Ranger: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "SR", weapon: "Carrier air group", accent: "#8ba4b6", rgb: "139, 164, 182" },
    Yorktown: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "SSR", weapon: "Carrier air group", accent: "#9eb7c8", rgb: "158, 183, 200" },
    Wasp: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "SR", weapon: "Carrier air group", accent: "#a38b72", rgb: "163, 139, 114" },
    Essex: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "UR", weapon: "Carrier air group", accent: "#6f91aa", rgb: "111, 145, 170" },
    "North Carolina": { shipType: "Battleship", typeCode: "BB", rarity: "SSR", weapon: "9 × 16-inch guns", accent: "#789bb3", rgb: "120, 155, 179" },
    "South Dakota": { shipType: "Battleship", typeCode: "BB", rarity: "SSR", weapon: "9 × 16-inch guns", accent: "#8796a5", rgb: "135, 150, 165" },
    Pensacola: { shipType: "Heavy cruiser", typeCode: "CA", rarity: "SR", weapon: "10 × 8-inch guns", accent: "#b79a63", rgb: "183, 154, 99" },
    Northampton: { shipType: "Heavy cruiser", typeCode: "CA", rarity: "SR", weapon: "9 × 8-inch guns", accent: "#8da7b8", rgb: "141, 167, 184" },
    "New Orleans": { shipType: "Heavy cruiser", typeCode: "CA", rarity: "SR", weapon: "9 × 8-inch guns", accent: "#718ea4", rgb: "113, 142, 164" },
    "Des Moines": { shipType: "Heavy cruiser", typeCode: "CA", rarity: "UR", weapon: "9 × 8-inch automatic guns", accent: "#8299ae", rgb: "130, 153, 174" },
    Atlanta: { shipType: "Light cruiser", typeCode: "CL", rarity: "SR", weapon: "16 × 5-inch dual-purpose guns", accent: "#79afbd", rgb: "121, 175, 189" },
    Brooklyn: { shipType: "Light cruiser", typeCode: "CL", rarity: "SR", weapon: "15 × 6-inch guns", accent: "#9a91a8", rgb: "154, 145, 168" },
    Omaha: { shipType: "Light cruiser", typeCode: "CL", rarity: "U", weapon: "12 × 6-inch guns", accent: "#7d94a6", rgb: "125, 148, 166" },
    Porter: { shipType: "Destroyer", typeCode: "DD", rarity: "C", weapon: "8 × 5-inch guns", accent: "#7794a8", rgb: "119, 148, 168" },
    Benham: { shipType: "Destroyer", typeCode: "DD", rarity: "U", weapon: "4 × 5-inch guns", accent: "#829bab", rgb: "130, 155, 171" },
    Sims: { shipType: "Destroyer", typeCode: "DD", rarity: "R", weapon: "5 × 5-inch guns", accent: "#7395ad", rgb: "115, 149, 173" },
    Benson: { shipType: "Destroyer", typeCode: "DD", rarity: "U", weapon: "5 × 5-inch guns", accent: "#8196a6", rgb: "129, 150, 166" },
    Fletcher: { shipType: "Destroyer", typeCode: "DD", rarity: "SSR", weapon: "5 × 5-inch guns", accent: "#799bac", rgb: "121, 155, 172" }
  };

  const ships = [
    {
      name: "USS Lexington", hullNumber: "CV-2", shipClass: "Lexington",
      alternateImage: "images/warships/lexington-shipyard-icon.png",
      description: "Originally laid down as a battlecruiser, USS Lexington was completed as one of the U.S. Navy's first large aircraft carriers. She helped shape American carrier aviation before being lost at the Battle of the Coral Sea in May 1942.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Saratoga", hullNumber: "CV-3", shipClass: "Lexington",
      description: "USS Saratoga entered 1942 as one of America's most experienced carriers. Twice torpedoed by Japanese submarines during the year, she returned from each repair period to support operations around Guadalcanal.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater", accent: "#d7b568", rgb: "215, 181, 104"
    },
    {
      name: "USS Ranger", hullNumber: "CV-4", shipClass: "Ranger",
      description: "The first American warship designed from the keel up as an aircraft carrier, USS Ranger remained in the Atlantic during 1942. Her aircraft supported Operation Torch and struck Vichy French targets around Casablanca.",
      origin: "Newport News Shipbuilding", affinity: "Atlantic Theater"
    },
    {
      name: "USS Yorktown", hullNumber: "CV-5", shipClass: "Yorktown", rarity: "UR",
      alternateImage: "images/warships/yorktown-shipyard-icon.png",
      description: "USS Yorktown fought at the Battle of the Coral Sea and returned to Pearl Harbor badly damaged. Rapidly repaired for Midway, she helped break the Japanese carrier force before being lost in June 1942.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Enterprise", hullNumber: "CV-6", shipClass: "Yorktown", rarity: "UR",
      alternateImage: "images/warships/enterprise-shipyard-icon.png",
      description: "USS Enterprise served in more major actions against Japan than any other American ship. During 1942 she fought from Midway through the Guadalcanal campaign and became the indispensable carrier of the Pacific Fleet.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater", accent: "#d7b568", rgb: "215, 181, 104"
    },
    {
      name: "USS Wasp", hullNumber: "CV-7", shipClass: "Wasp",
      description: "After ferrying fighters to Malta, USS Wasp transferred to the Pacific and supported the Guadalcanal landings. Japanese submarine I-19 torpedoed and fatally damaged her on 15 September 1942.",
      origin: "Fore River Shipyard", affinity: "Atlantic and Pacific"
    },
    {
      name: "USS Hornet", hullNumber: "CV-8", shipClass: "Yorktown",
      alternateImage: "images/warships/hornet-shipyard-icon.png",
      description: "USS Hornet carried the Doolittle Raiders on the first American air strike against the Japanese home islands. She later fought at Midway and was lost after sustained attack at the Battle of the Santa Cruz Islands.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater", accent: "#c8776d", rgb: "200, 119, 109"
    },
    {
      name: "USS Essex", hullNumber: "CV-9", shipClass: "Essex",
      description: "USS Essex was commissioned on 31 December 1942 as the lead ship of the carrier class that would drive the later Pacific offensive. Her combat career began in 1943.",
      origin: "Newport News Shipbuilding", affinity: "Commissioning and workup"
    },
    {
      name: "USS North Carolina", hullNumber: "BB-55", shipClass: "North Carolina", rarity: "UR",
      description: "America's first modern fast battleship, USS North Carolina protected the carrier force at the Eastern Solomons and provided formidable antiaircraft fire before a submarine torpedo sent her to Pearl Harbor for repairs.",
      origin: "New York Naval Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Washington", hullNumber: "BB-56", shipClass: "North Carolina", rarity: "UR",
      description: "USS Washington served with the British Home Fleet before moving to the Pacific. On the night of 14–15 November 1942, her radar-directed gunfire mortally damaged the Japanese battleship Kirishima off Guadalcanal.",
      origin: "Philadelphia Naval Shipyard", affinity: "Atlantic and Pacific"
    },
    {
      name: "USS South Dakota", hullNumber: "BB-57", shipClass: "South Dakota", rarity: "SSR",
      description: "Commissioned in March 1942, USS South Dakota defended Enterprise at Santa Cruz and fought in the night action off Guadalcanal. Electrical failures left her exposed, but she survived heavy Japanese gunfire.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Indiana", hullNumber: "BB-58", shipClass: "South Dakota", rarity: "SR",
      description: "USS Indiana was commissioned in April 1942 and reached the South Pacific late that year. She reinforced the fast battleship force and began carrier-screening operations around Guadalcanal.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Massachusetts", hullNumber: "BB-59", shipClass: "South Dakota",
      description: "USS Massachusetts entered combat during Operation Torch. At Casablanca in November 1942, her 16-inch guns engaged the unfinished French battleship Jean Bart, shore batteries, and Vichy warships.",
      origin: "Fore River Shipyard", affinity: "Atlantic Theater"
    },
    {
      name: "USS Alabama", hullNumber: "BB-60", shipClass: "South Dakota", rarity: "SR",
      description: "Commissioned in August 1942, USS Alabama spent the remainder of the year completing trials and training. She would join the British Home Fleet in 1943 before transferring to the Pacific.",
      origin: "Norfolk Naval Shipyard", affinity: "Commissioning and workup"
    },
    {
      name: "USS Pensacola", hullNumber: "CA-24", shipClass: "Pensacola", rarity: "SSR",
      description: "USS Pensacola screened American carriers through the opening Pacific campaigns. At Tassafaronga in November 1942, a Japanese torpedo caused severe damage and fires but the cruiser survived.",
      origin: "New York Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Salt Lake City", hullNumber: "CA-25", shipClass: "Pensacola", rarity: "SR",
      description: "USS Salt Lake City supported the Doolittle Raid and fought at the Battle of Cape Esperance in October 1942, trading heavy gunfire with Japanese cruisers during the Guadalcanal campaign.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Northampton", hullNumber: "CA-26", shipClass: "Northampton",
      description: "USS Northampton escorted the Doolittle Raid, fought at Midway and Santa Cruz, and attempted to tow the damaged Hornet. She was sunk by Japanese torpedoes at Tassafaronga on 30 November 1942.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Chester", hullNumber: "CA-27", shipClass: "Northampton", rarity: "SR",
      description: "USS Chester served with American carrier forces during the first year of the Pacific War. She survived both a February air attack and an October 1942 submarine torpedo hit.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Louisville", hullNumber: "CA-28", shipClass: "Northampton", rarity: "SSR",
      description: "USS Louisville escorted convoys and carrier groups across the Pacific during 1942, operating from the Aleutians to the South Pacific as American forces moved onto the offensive.",
      origin: "Puget Sound Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Chicago", hullNumber: "CA-29", shipClass: "Northampton", rarity: "R",
      description: "USS Chicago fought at the Coral Sea and guarded the Allied transports off Guadalcanal. A Japanese torpedo badly damaged her during the Battle of Savo Island in August 1942.",
      origin: "Mare Island Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Houston", hullNumber: "CA-30", shipClass: "Northampton", rarity: "SSR",
      description: "Flagship of the United States Asiatic Fleet, USS Houston fought through the failed defense of the Netherlands East Indies. She was overwhelmed and sunk at the Battle of Sunda Strait on 1 March 1942.",
      origin: "Newport News Shipbuilding", affinity: "Southwest Pacific"
    },
    {
      name: "USS Augusta", hullNumber: "CA-31", shipClass: "Northampton",
      description: "USS Augusta served as an Atlantic Fleet flagship and carried senior commanders during Operation Torch. Her guns supported the landings and engaged Vichy French defenses around Casablanca.",
      origin: "Newport News Shipbuilding", affinity: "Atlantic Theater"
    },
    {
      name: "USS New Orleans", hullNumber: "CA-32", shipClass: "New Orleans", rarity: "UR",
      description: "USS New Orleans screened carriers at Coral Sea, Midway, and the Eastern Solomons. At Tassafaronga a torpedo tore away her bow, yet determined damage control brought the cruiser safely back to port.",
      origin: "New York Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Astoria", hullNumber: "CA-34", shipClass: "New Orleans",
      description: "USS Astoria fought at the Coral Sea and Midway before covering the Guadalcanal landings. Japanese cruisers devastated her during the Battle of Savo Island, and she sank on 9 August 1942.",
      origin: "Puget Sound Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Minneapolis", hullNumber: "CA-36", shipClass: "New Orleans", rarity: "UR",
      description: "USS Minneapolis participated in the Coral Sea, Midway, and Guadalcanal campaigns. Two torpedo hits at Tassafaronga destroyed her bow, but temporary repairs kept the ship afloat.",
      origin: "Philadelphia Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Tuscaloosa", hullNumber: "CA-37", shipClass: "New Orleans", rarity: "SR",
      description: "USS Tuscaloosa spent much of 1942 in the Atlantic, serving with the British Home Fleet, escorting convoys, and supporting Allied operations connected with the invasion of North Africa.",
      origin: "New York Shipbuilding", affinity: "Atlantic Theater"
    },
    {
      name: "USS San Francisco", hullNumber: "CA-38", shipClass: "New Orleans", rarity: "UR",
      description: "USS San Francisco fought at Cape Esperance and served as Admiral Callaghan's flagship in the Naval Battle of Guadalcanal. She survived a brutal close-range action on 13 November 1942.",
      origin: "Mare Island Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Quincy", hullNumber: "CA-39", shipClass: "New Orleans", rarity: "R",
      description: "After Atlantic service, USS Quincy transferred to the Pacific and covered the Guadalcanal invasion. She was caught by surprise and sunk during the Battle of Savo Island in August 1942.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Vincennes", hullNumber: "CA-44", shipClass: "New Orleans",
      description: "USS Vincennes supported the Doolittle Raid and fought at Midway before joining the Guadalcanal operation. She was sunk alongside Astoria and Quincy at Savo Island.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Atlanta", hullNumber: "CL-51", shipClass: "Atlanta", rarity: "SSR",
      description: "Designed as a fast antiaircraft cruiser, USS Atlanta escorted carriers and fought around Guadalcanal. Heavy damage during the night action of 13 November 1942 forced her crew to scuttle the ship.",
      origin: "Federal Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Juneau", hullNumber: "CL-52", shipClass: "Atlanta",
      description: "USS Juneau fought in the Guadalcanal campaign and was damaged in the night battle of 13 November. Submarine I-26 then struck her with a torpedo, causing a catastrophic explosion and enormous loss of life.",
      origin: "Federal Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS San Diego", hullNumber: "CL-53", shipClass: "Atlanta", rarity: "UR",
      description: "USS San Diego joined the Pacific Fleet in 1942 and used her rapid-firing dual-purpose guns to protect American carriers through the Solomon Islands campaign.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS San Juan", hullNumber: "CL-54", shipClass: "Atlanta", rarity: "SSR",
      description: "USS San Juan entered combat in the South Pacific during 1942, screening carrier groups and fighting through the Guadalcanal and Santa Cruz operations.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Brooklyn", hullNumber: "CL-40", shipClass: "Brooklyn",
      description: "USS Brooklyn conducted Atlantic patrol and convoy duties before supporting Operation Torch. Her fifteen 6-inch guns bombarded defenses near Fedala during the November 1942 landings.",
      origin: "New York Navy Yard", affinity: "Atlantic Theater"
    },
    {
      name: "USS Philadelphia", hullNumber: "CL-41", shipClass: "Brooklyn", rarity: "SR",
      description: "USS Philadelphia escorted Atlantic convoys and provided naval gunfire during Operation Torch, supporting American landings at Safi in November 1942.",
      origin: "Philadelphia Navy Yard", affinity: "Atlantic Theater"
    },
    {
      name: "USS Savannah", hullNumber: "CL-42", shipClass: "Brooklyn", rarity: "R",
      description: "USS Savannah served on Atlantic patrols before joining Operation Torch. She supported the assault on Safi with reconnaissance aircraft and sustained naval gunfire.",
      origin: "New York Shipbuilding", affinity: "Atlantic Theater"
    },
    {
      name: "USS Nashville", hullNumber: "CL-43", shipClass: "Brooklyn", rarity: "SSR",
      description: "USS Nashville escorted Hornet during the Doolittle Raid and then operated in the South Pacific, supporting the Guadalcanal campaign and Allied positions in the Solomons.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Phoenix", hullNumber: "CL-46", shipClass: "Brooklyn", rarity: "SR",
      description: "USS Phoenix escaped the attack on Pearl Harbor without damage. During 1942 she escorted convoys between the United States, Australia, and the Indian Ocean.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Boise", hullNumber: "CL-47", shipClass: "Brooklyn", rarity: "SSR",
      description: "After surviving the collapse of the Allied position in the East Indies, USS Boise fought at Cape Esperance. Japanese shells caused severe damage and heavy casualties, but the cruiser survived.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Honolulu", hullNumber: "CL-48", shipClass: "Brooklyn",
      description: "USS Honolulu served in the Pacific throughout 1942, escorting convoys, bombarding Japanese positions, and fighting in the Guadalcanal campaign at Cape Esperance and Tassafaronga.",
      origin: "New York Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS St. Louis", hullNumber: "CL-49", shipClass: "Brooklyn", rarity: "SSR",
      description: "USS St. Louis escaped Pearl Harbor and spent 1942 on convoy, Aleutian, and South Pacific duties before joining the hard-fought campaign around Guadalcanal.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Helena", hullNumber: "CL-50", shipClass: "Brooklyn", rarity: "SSR",
      description: "Repaired after Pearl Harbor, USS Helena returned with modern radar and fought aggressively at Cape Esperance and in the Naval Battle of Guadalcanal during 1942.",
      origin: "New York Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Des Moines", hullNumber: "CA-134", shipClass: "Des Moines",
      description: "Commissioned in 1948, USS Des Moines was the lead ship of the U.S. Navy's final heavy-cruiser class. Her automatic 8-inch guns gave her an exceptional rate of fire; she served with the Atlantic and Sixth Fleets but did not see combat.",
      origin: "Fore River Shipyard", affinity: "Atlantic and Mediterranean"
    },
    {
      name: "USS Omaha", hullNumber: "CL-4", shipClass: "Omaha", rarity: "R",
      description: "Lead ship of America's first postwar scout-cruiser class, USS Omaha served mainly on Atlantic and South Atlantic patrols. Her boarding party captured the German blockade runner Odenwald before American entry into the war.",
      origin: "Todd Dry Dock", affinity: "Atlantic Theater"
    },
    {
      name: "USS Milwaukee", hullNumber: "CL-5", shipClass: "Omaha", rarity: "C",
      description: "USS Milwaukee performed neutrality, convoy, and South Atlantic patrol duties before transferring to the Soviet Navy in 1944 as Murmansk. Her American wartime career involved steady service but few major engagements.",
      origin: "Todd Dry Dock", affinity: "Atlantic Theater"
    },
    {
      name: "USS Cincinnati", hullNumber: "CL-6", shipClass: "Omaha", rarity: "C",
      description: "USS Cincinnati patrolled the Atlantic and helped intercept German blockade runners, including Annaliese Essberger in 1942. She spent most of the war on escort and patrol assignments away from major fleet battles.",
      origin: "Todd Dry Dock", affinity: "Atlantic Theater"
    },
    {
      name: "USS Raleigh", hullNumber: "CL-7", shipClass: "Omaha", rarity: "U",
      description: "Torpedoed during the attack on Pearl Harbor, USS Raleigh survived and returned to duty. She later served in the Aleutians and North Pacific, earning three battle stars during the war.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Detroit", hullNumber: "CL-8", shipClass: "Omaha", rarity: "U",
      description: "USS Detroit escaped Pearl Harbor and spent much of the war in the Aleutians and North Pacific. She performed dependable escort and bombardment service and earned six battle stars.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Richmond", hullNumber: "CL-9", shipClass: "Omaha", rarity: "R",
      description: "USS Richmond served as a flagship in the Aleutians and fought at the Battle of the Komandorski Islands in 1943. She continued North Pacific operations through the end of the war.",
      origin: "William Cramp & Sons", affinity: "North Pacific"
    },
    {
      name: "USS Concord", hullNumber: "CL-10", shipClass: "Omaha", rarity: "C",
      description: "USS Concord conducted Southeast Pacific patrols before joining the Aleutian campaign. Her later service included shore bombardment in the Kuril Islands, but few major surface engagements.",
      origin: "William Cramp & Sons", affinity: "Pacific Theater"
    },
    {
      name: "USS Trenton", hullNumber: "CL-11", shipClass: "Omaha", rarity: "C",
      description: "USS Trenton patrolled the Southeast Pacific and later supported operations in the Aleutians and Kuril Islands. Her wartime duties were useful but largely removed from the Navy's decisive fleet actions.",
      origin: "William Cramp & Sons", affinity: "Pacific Theater"
    },
    {
      name: "USS Marblehead", hullNumber: "CL-12", shipClass: "Omaha", rarity: "SR",
      description: "Badly damaged while fighting with the ABDA forces in 1942, USS Marblehead survived bombing, steering failure, and flooding. Her crew brought the crippled cruiser more than 9,000 miles home for repair.",
      origin: "William Cramp & Sons", affinity: "Southwest Pacific"
    },
    {
      name: "USS Memphis", hullNumber: "CL-13", shipClass: "Omaha", rarity: "C",
      description: "USS Memphis served as a South Atlantic flagship and carried out patrol, diplomatic, and convoy duties. She completed the war without the prominent battle record of many Pacific cruisers.",
      origin: "William Cramp & Sons", affinity: "Atlantic Theater"
    },
    {
      name: "USS Clark", hullNumber: "DD-361", shipClass: "Porter", rarity: "C",
      description: "USS Clark spent much of the war escorting Atlantic convoys and supporting training operations before transferring to the Pacific. Her service was valuable but included few major combat actions.",
      origin: "Fore River Shipyard", affinity: "Atlantic and Pacific"
    },
    {
      name: "USS Moffett", hullNumber: "DD-362", shipClass: "Porter", rarity: "C",
      description: "USS Moffett performed neutrality patrols and Atlantic convoy escort throughout much of the war. She later supported operations in the Mediterranean and Pacific without developing a major independent combat record.",
      origin: "Fore River Shipyard", affinity: "Atlantic Theater"
    },
    {
      name: "USS Rhind", hullNumber: "DD-404", shipClass: "Benham", rarity: "U",
      description: "USS Rhind escorted convoys, supported Operation Torch and the invasion of Sicily, and later served in the Pacific. She earned four battle stars across several theaters.",
      origin: "Federal Shipbuilding", affinity: "Atlantic and Pacific"
    },
    {
      name: "USS Roe", hullNumber: "DD-418", shipClass: "Sims", rarity: "R",
      description: "USS Roe served from the Atlantic and Mediterranean to the Aleutians and Southwest Pacific. Her broad combat career earned six battle stars, though she was not associated with a single famous action.",
      origin: "Charleston Navy Yard", affinity: "Multiple theaters"
    },
    {
      name: "USS Mayo", hullNumber: "DD-422", shipClass: "Benson", rarity: "U",
      description: "USS Mayo escorted Atlantic convoys and supported landings in North Africa, Sicily, Salerno, and Anzio. A mine badly damaged her in 1944, and she finished the war with two battle stars.",
      origin: "Fore River Shipyard", affinity: "Atlantic and Mediterranean"
    },
    {
      name: "USS Madison", hullNumber: "DD-425", shipClass: "Benson", rarity: "U",
      description: "USS Madison protected convoys and supported amphibious operations from Operation Torch through the Mediterranean campaigns before later Pacific service. She earned five battle stars.",
      origin: "Boston Navy Yard", affinity: "Atlantic and Pacific"
    },
    {
      name: "USS Fletcher", hullNumber: "DD-445", shipClass: "Fletcher", rarity: "SSR",
      description: "Lead ship of the Fletcher-class destroyers, USS Fletcher entered Pacific service in 1942. She fought through the Solomon Islands and later campaigns, earning fifteen battle stars during World War II.",
      origin: "Federal Shipbuilding", affinity: "Pacific Theater"
    }
  ];

  function createAbilities(shipType) {
    const category = shipType.toLowerCase();
    return [
      { name: "Capability Placeholder I", text: `Reserved space for a future ${category} attack or tactical effect.` },
      { name: "Capability Placeholder II", text: "Reserved space for a future fleet-support or defensive effect." },
      { name: "Capability Placeholder III", text: "Reserved space for a future signature ability or special maneuver." }
    ];
  }

  function createId(ship) {
    const name = ship.name.replace(/^USS /, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const hull = ship.hullNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `uss-${name}-${hull}`;
  }

  window.CHARACTERS = ships.map((ship, index) => {
    const profile = classProfiles[ship.shipClass];
    return {
      id: createId(ship),
      number: String(index + 1).padStart(2, "0"),
      name: ship.name,
      defaultImage: null,
      alternateImage: ship.alternateImage || null,
      shipClass: ship.shipClass,
      shipType: profile.shipType,
      typeCode: profile.typeCode,
      hullNumber: ship.hullNumber,
      rarity: ship.rarity || profile.rarity,
      role: `${ship.shipClass}-class ${profile.shipType.toLowerCase()} · ${ship.hullNumber}`,
      description: ship.description,
      origin: ship.origin,
      affinity: ship.affinity,
      weapon: profile.weapon,
      traits: ["Trait placeholder A", "Trait placeholder B", "Trait placeholder C"],
      abilities: createAbilities(profile.shipType),
      combatStats: window.SHIP_COMBAT_DATA?.[ship.name] || null,
      accent: ship.accent || profile.accent,
      rgb: ship.rgb || profile.rgb
    };
  });

  const placeholderNames = ["玄霜", "苍澜", "赤羽", "云岚", "星璃", "墨潮"];
  const placeholderPalette = [
    { accent: "#6f91aa", rgb: "111, 145, 170" },
    { accent: "#8ba4b6", rgb: "139, 164, 182" },
    { accent: "#a38b72", rgb: "163, 139, 114" },
    { accent: "#7e8797", rgb: "126, 135, 151" }
  ];

  placeholderNames.slice(0, Math.max(0, 64 - ships.length)).forEach((name, index) => {
    const number = ships.length + index + 1;
    const color = placeholderPalette[index % placeholderPalette.length];
    window.CHARACTERS.push({
      id: `empty-slot-${String(number).padStart(2, "0")}`,
      number: String(number).padStart(2, "0"),
      name,
      shipClass: "资料未定",
      shipType: "舰种待录",
      typeCode: null,
      hullNumber: "舷号待定",
      rarity: null,
      role: "舰籍待录 · 资料未定",
      defaultImage: null,
      alternateImage: null,
      placeholder: true,
      accent: color.accent,
      rgb: color.rgb
    });
  });
})();
