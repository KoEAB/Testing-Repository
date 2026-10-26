(function () {
  "use strict";

  const classProfiles = {
    Lexington: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "SSR", weapon: "Carrier air group", accent: "#87b6d2", rgb: "135, 182, 210" },
    Ranger: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "R", weapon: "Carrier air group", accent: "#8ba4b6", rgb: "139, 164, 182" },
    Yorktown: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "SSR", weapon: "Carrier air group", accent: "#9eb7c8", rgb: "158, 183, 200" },
    Wasp: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "SR", weapon: "Carrier air group", accent: "#a38b72", rgb: "163, 139, 114" },
    Essex: { shipType: "Aircraft carrier", typeCode: "CV", rarity: "UR", weapon: "Carrier air group", accent: "#6f91aa", rgb: "111, 145, 170" },
    "North Carolina": { shipType: "Battleship", typeCode: "BB", rarity: "SSR", weapon: "9 × 16-inch guns", accent: "#789bb3", rgb: "120, 155, 179" },
    "South Dakota": { shipType: "Battleship", typeCode: "BB", rarity: "SSR", weapon: "9 × 16-inch guns", accent: "#8796a5", rgb: "135, 150, 165" },
    Pensacola: { shipType: "Heavy cruiser", typeCode: "CA", rarity: "R", weapon: "10 × 8-inch guns", accent: "#b79a63", rgb: "183, 154, 99" },
    Northampton: { shipType: "Heavy cruiser", typeCode: "CA", rarity: "R", weapon: "9 × 8-inch guns", accent: "#8da7b8", rgb: "141, 167, 184" },
    "New Orleans": { shipType: "Heavy cruiser", typeCode: "CA", rarity: "SR", weapon: "9 × 8-inch guns", accent: "#718ea4", rgb: "113, 142, 164" },
    Atlanta: { shipType: "Light cruiser", typeCode: "CL", rarity: "SR", weapon: "16 × 5-inch dual-purpose guns", accent: "#79afbd", rgb: "121, 175, 189" },
    Brooklyn: { shipType: "Light cruiser", typeCode: "CL", rarity: "SR", weapon: "15 × 6-inch guns", accent: "#9a91a8", rgb: "154, 145, 168" }
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
      name: "USS Yorktown", hullNumber: "CV-5", shipClass: "Yorktown",
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
      name: "USS North Carolina", hullNumber: "BB-55", shipClass: "North Carolina",
      description: "America's first modern fast battleship, USS North Carolina protected the carrier force at the Eastern Solomons and provided formidable antiaircraft fire before a submarine torpedo sent her to Pearl Harbor for repairs.",
      origin: "New York Naval Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Washington", hullNumber: "BB-56", shipClass: "North Carolina", rarity: "UR",
      description: "USS Washington served with the British Home Fleet before moving to the Pacific. On the night of 14–15 November 1942, her radar-directed gunfire mortally damaged the Japanese battleship Kirishima off Guadalcanal.",
      origin: "Philadelphia Naval Shipyard", affinity: "Atlantic and Pacific"
    },
    {
      name: "USS South Dakota", hullNumber: "BB-57", shipClass: "South Dakota", rarity: "UR",
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
      name: "USS Alabama", hullNumber: "BB-60", shipClass: "South Dakota",
      description: "Commissioned in August 1942, USS Alabama spent the remainder of the year completing trials and training. She would join the British Home Fleet in 1943 before transferring to the Pacific.",
      origin: "Norfolk Naval Shipyard", affinity: "Commissioning and workup"
    },
    {
      name: "USS Pensacola", hullNumber: "CA-24", shipClass: "Pensacola",
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
      name: "USS Chester", hullNumber: "CA-27", shipClass: "Northampton", rarity: "C",
      description: "USS Chester served with American carrier forces during the first year of the Pacific War. She survived both a February air attack and an October 1942 submarine torpedo hit.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Louisville", hullNumber: "CA-28", shipClass: "Northampton", rarity: "U",
      description: "USS Louisville escorted convoys and carrier groups across the Pacific during 1942, operating from the Aleutians to the South Pacific as American forces moved onto the offensive.",
      origin: "Puget Sound Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Chicago", hullNumber: "CA-29", shipClass: "Northampton",
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
      name: "USS New Orleans", hullNumber: "CA-32", shipClass: "New Orleans",
      description: "USS New Orleans screened carriers at Coral Sea, Midway, and the Eastern Solomons. At Tassafaronga a torpedo tore away her bow, yet determined damage control brought the cruiser safely back to port.",
      origin: "New York Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Astoria", hullNumber: "CA-34", shipClass: "New Orleans",
      description: "USS Astoria fought at the Coral Sea and Midway before covering the Guadalcanal landings. Japanese cruisers devastated her during the Battle of Savo Island, and she sank on 9 August 1942.",
      origin: "Puget Sound Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Minneapolis", hullNumber: "CA-36", shipClass: "New Orleans",
      description: "USS Minneapolis participated in the Coral Sea, Midway, and Guadalcanal campaigns. Two torpedo hits at Tassafaronga destroyed her bow, but temporary repairs kept the ship afloat.",
      origin: "Philadelphia Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Tuscaloosa", hullNumber: "CA-37", shipClass: "New Orleans", rarity: "R",
      description: "USS Tuscaloosa spent much of 1942 in the Atlantic, serving with the British Home Fleet, escorting convoys, and supporting Allied operations connected with the invasion of North Africa.",
      origin: "New York Shipbuilding", affinity: "Atlantic Theater"
    },
    {
      name: "USS San Francisco", hullNumber: "CA-38", shipClass: "New Orleans", rarity: "SSR",
      description: "USS San Francisco fought at Cape Esperance and served as Admiral Callaghan's flagship in the Naval Battle of Guadalcanal. She survived a brutal close-range action on 13 November 1942.",
      origin: "Mare Island Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS Quincy", hullNumber: "CA-39", shipClass: "New Orleans",
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
      name: "USS San Diego", hullNumber: "CL-53", shipClass: "Atlanta",
      description: "USS San Diego joined the Pacific Fleet in 1942 and used her rapid-firing dual-purpose guns to protect American carriers through the Solomon Islands campaign.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS San Juan", hullNumber: "CL-54", shipClass: "Atlanta", rarity: "R",
      description: "USS San Juan entered combat in the South Pacific during 1942, screening carrier groups and fighting through the Guadalcanal and Santa Cruz operations.",
      origin: "Fore River Shipyard", affinity: "Pacific Theater"
    },
    {
      name: "USS Brooklyn", hullNumber: "CL-40", shipClass: "Brooklyn",
      description: "USS Brooklyn conducted Atlantic patrol and convoy duties before supporting Operation Torch. Her fifteen 6-inch guns bombarded defenses near Fedala during the November 1942 landings.",
      origin: "New York Navy Yard", affinity: "Atlantic Theater"
    },
    {
      name: "USS Philadelphia", hullNumber: "CL-41", shipClass: "Brooklyn", rarity: "C",
      description: "USS Philadelphia escorted Atlantic convoys and provided naval gunfire during Operation Torch, supporting American landings at Safi in November 1942.",
      origin: "Philadelphia Navy Yard", affinity: "Atlantic Theater"
    },
    {
      name: "USS Savannah", hullNumber: "CL-42", shipClass: "Brooklyn", rarity: "U",
      description: "USS Savannah served on Atlantic patrols before joining Operation Torch. She supported the assault on Safi with reconnaissance aircraft and sustained naval gunfire.",
      origin: "New York Shipbuilding", affinity: "Atlantic Theater"
    },
    {
      name: "USS Nashville", hullNumber: "CL-43", shipClass: "Brooklyn",
      description: "USS Nashville escorted Hornet during the Doolittle Raid and then operated in the South Pacific, supporting the Guadalcanal campaign and Allied positions in the Solomons.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Phoenix", hullNumber: "CL-46", shipClass: "Brooklyn", rarity: "U",
      description: "USS Phoenix escaped the attack on Pearl Harbor without damage. During 1942 she escorted convoys between the United States, Australia, and the Indian Ocean.",
      origin: "New York Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Boise", hullNumber: "CL-47", shipClass: "Brooklyn",
      description: "After surviving the collapse of the Allied position in the East Indies, USS Boise fought at Cape Esperance. Japanese shells caused severe damage and heavy casualties, but the cruiser survived.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Honolulu", hullNumber: "CL-48", shipClass: "Brooklyn",
      description: "USS Honolulu served in the Pacific throughout 1942, escorting convoys, bombarding Japanese positions, and fighting in the Guadalcanal campaign at Cape Esperance and Tassafaronga.",
      origin: "New York Navy Yard", affinity: "Pacific Theater"
    },
    {
      name: "USS St. Louis", hullNumber: "CL-49", shipClass: "Brooklyn", rarity: "R",
      description: "USS St. Louis escaped Pearl Harbor and spent 1942 on convoy, Aleutian, and South Pacific duties before joining the hard-fought campaign around Guadalcanal.",
      origin: "Newport News Shipbuilding", affinity: "Pacific Theater"
    },
    {
      name: "USS Helena", hullNumber: "CL-50", shipClass: "Brooklyn", rarity: "SSR",
      description: "Repaired after Pearl Harbor, USS Helena returned with modern radar and fought aggressively at Cape Esperance and in the Naval Battle of Guadalcanal during 1942.",
      origin: "New York Navy Yard", affinity: "Pacific Theater"
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

  placeholderNames.forEach((name, index) => {
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
