(function () {
  "use strict";

  // Named combat units and shipyard profiles read the same values.
  window.SHIP_COMBAT_DATA = {
    "USS North Carolina": {
      health: 660, speedKnots: 27.5, movementRange: 3, concealmentRange: 15,
      shellCount: 9, salvoPattern: [3, 3, 3], turretPositions: ["forward", "forward", "aft"],
      forwardFiringAngle: 32, backwardFiringAngle: 31, alphaDamage: 131, apShellVelocity: 701,
      heAlphaDamage: 57, heShellVelocity: 820, mainGunCaliberMm: 406,
      gunRange: 23, gunAttacksPerTurn: 1, accuracyProfile: "north-carolina"
    },
    "USS New Orleans": {
      health: 350, speedKnots: 32.5, movementRange: 5, concealmentRange: 12,
      shellCount: 9, salvoPattern: [3, 3, 3], turretPositions: ["forward", "forward", "aft"],
      forwardFiringAngle: 34, backwardFiringAngle: 30, alphaDamage: 46, apShellVelocity: 853,
      heAlphaDamage: 28, heShellVelocity: 853, mainGunCaliberMm: 203,
      gunRange: 16, gunAttacksPerTurn: 2
    },
    "USS Helena": {
      health: 333, speedKnots: 32.5, movementRange: 5, concealmentRange: 11,
      shellCount: 15, salvoPattern: [3, 3, 3, 3, 3],
      turretPositions: ["forward", "forward", "forward", "aft", "aft"],
      forwardFiringAngle: 30, backwardFiringAngle: 33, alphaDamage: 32, apShellVelocity: 762,
      heAlphaDamage: 22, heShellVelocity: 812, mainGunCaliberMm: 152,
      gunRange: 15, gunAttacksPerTurn: 3
    },
    "USS Des Moines": {
      health: 506, speedKnots: 33, movementRange: 5, concealmentRange: 13,
      shellCount: 9, salvoPattern: [3, 3, 3], turretPositions: ["forward", "forward", "aft"],
      forwardFiringAngle: 30, backwardFiringAngle: 31, alphaDamage: 50, apShellVelocity: 762,
      heAlphaDamage: 28, heShellVelocity: 823, mainGunCaliberMm: 203,
      gunRange: 16, gunAttacksPerTurn: 6
    },
    "USS Fletcher": {
      health: 170, speedKnots: 36.5, movementRange: 6, concealmentRange: 7,
      shellCount: 5, salvoPattern: [1, 1, 1, 1, 1], turretPositions: ["forward", "forward", "aft", "aft", "aft"],
      forwardFiringAngle: 30, backwardFiringAngle: 38, alphaDamage: 21, apShellVelocity: 792,
      heAlphaDamage: 18, heShellVelocity: 792, mainGunCaliberMm: 127,
      gunRange: 13, gunAttacksPerTurn: 4, salvoGroupGapMs: 75,
      torpedoRange: 10, torpedoDamage: 85, torpedoReloadDuration: 3
    }
  };
})();
