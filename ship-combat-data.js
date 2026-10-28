(function () {
  "use strict";

  // Shared ship-type definitions for the Shipyard and combat demos.
  globalThis.NAVAL_UNIT_TYPES = [
    { code: "SS", label: "Submarine", group: "submarine", health: 70, torpedo: 110, size: 1, wreck: "Subs", actions: ["move", "torpedo"], noCitadel: true },
    { code: "SSV", label: "Aviation submarine", group: "submarine", health: 80, torpedo: 100, size: 1, wreck: "Subs", actions: ["move", "torpedo", "air"], noCitadel: true },
    { code: "DD", label: "Destroyer", group: "escort", health: 100, gun: 35, torpedo: 85, caliber: 127, size: 2, wreck: "Light", actions: ["move", "gun", "torpedo"], noCitadel: true },
    { code: "DE", label: "Destroyer escort", group: "escort", health: 110, gun: 30, torpedo: 75, caliber: 127, size: 2, wreck: "Light", actions: ["move", "gun", "torpedo"], noCitadel: true },
    { code: "CL", label: "Light cruiser", group: "cruiser", health: 180, gun: 45, caliber: 152, size: 3, wreck: "Med", actions: ["move", "gun"] },
    { code: "CA", label: "Heavy cruiser", group: "cruiser", health: 240, gun: 60, caliber: 203, size: 3, wreck: "Med", actions: ["move", "gun"] },
    { code: "CB", label: "Large cruiser", group: "cruiser", health: 320, gun: 75, caliber: 305, size: 4, wreck: "Heavy", actions: ["move", "gun"] },
    { code: "BC", label: "Battlecruiser", group: "capital", health: 380, gun: 85, caliber: 356, size: 4, wreck: "Heavy", actions: ["move", "gun"] },
    { code: "BB", label: "Battleship", group: "capital", health: 450, gun: 100, caliber: 406, size: 5, wreck: "Heavy", actions: ["move", "gun"] },
    { code: "BBV", label: "Aviation battleship", group: "capital", health: 430, gun: 95, caliber: 356, size: 5, wreck: "Heavy", actions: ["move", "gun", "air"] },
    { code: "CV", label: "Aircraft carrier", group: "aviation", health: 360, gun: 20, caliber: 127, size: 4, wreck: "Heavy", actions: ["move", "gun", "air"] },
    { code: "CVL", label: "Light aircraft carrier", group: "aviation", health: 280, size: 3, wreck: "Med", actions: ["move", "air"] },
    { code: "CVE", label: "Escort aircraft carrier", group: "aviation", health: 220, size: 3, wreck: "Med", actions: ["move", "air"] },
    { code: "BM", label: "Monitor", group: "coastal", health: 200, gun: 55, caliber: 305, size: 3, wreck: "Med", actions: ["move", "gun"] },
    { code: "AR", label: "Repair ship", group: "support", health: 180, size: 3, wreck: "Med", actions: ["move"] }
  ];

  // Named combat units and shipyard profiles read the same values.
  globalThis.SHIP_COMBAT_DATA = {
    "USS North Carolina": {
      code: "BB",
      health: 660, speedKnots: 27.5, movementRange: 3, concealmentRange: 15,
      shellCount: 9, salvoPattern: [3, 3, 3], turretPositions: ["forward", "forward", "aft"],
      forwardFiringAngle: 32, backwardFiringAngle: 31, alphaDamage: 131, apShellVelocity: 701,
      heAlphaDamage: 57, heShellVelocity: 820, mainGunCaliberMm: 406,
      gunRange: 23, gunAttacksPerTurn: 1, accuracyProfile: "north-carolina"
    },
    "USS New Orleans": {
      code: "CA",
      health: 350, speedKnots: 32.5, movementRange: 5, concealmentRange: 12,
      shellCount: 9, salvoPattern: [3, 3, 3], turretPositions: ["forward", "forward", "aft"],
      forwardFiringAngle: 34, backwardFiringAngle: 30, alphaDamage: 46, apShellVelocity: 853,
      heAlphaDamage: 28, heShellVelocity: 853, mainGunCaliberMm: 203,
      gunRange: 16, gunAttacksPerTurn: 2
    },
    "USS Helena": {
      code: "CL",
      health: 333, speedKnots: 32.5, movementRange: 5, concealmentRange: 11,
      shellCount: 15, salvoPattern: [3, 3, 3, 3, 3],
      turretPositions: ["forward", "forward", "forward", "aft", "aft"],
      forwardFiringAngle: 30, backwardFiringAngle: 33, alphaDamage: 32, apShellVelocity: 762,
      heAlphaDamage: 22, heShellVelocity: 812, mainGunCaliberMm: 152,
      gunRange: 15, gunAttacksPerTurn: 3
    },
    "USS Des Moines": {
      code: "CA",
      health: 506, speedKnots: 33, movementRange: 5, concealmentRange: 13,
      shellCount: 9, salvoPattern: [3, 3, 3], turretPositions: ["forward", "forward", "aft"],
      forwardFiringAngle: 30, backwardFiringAngle: 31, alphaDamage: 50, apShellVelocity: 762,
      heAlphaDamage: 28, heShellVelocity: 823, mainGunCaliberMm: 203,
      gunRange: 16, gunAttacksPerTurn: 6
    },
    "USS Fletcher": {
      code: "DD",
      health: 170, speedKnots: 36.5, movementRange: 6, concealmentRange: 7,
      shellCount: 5, salvoPattern: [1, 1, 1, 1, 1], turretPositions: ["forward", "forward", "aft", "aft", "aft"],
      forwardFiringAngle: 30, backwardFiringAngle: 38, alphaDamage: 21, apShellVelocity: 792,
      heAlphaDamage: 18, heShellVelocity: 792, mainGunCaliberMm: 127,
      gunRange: 13, gunAttacksPerTurn: 4, salvoGroupGapMs: 75,
      torpedoRange: 10, torpedoDamage: 85, torpedoReloadDuration: 3
    }
  };
})();
