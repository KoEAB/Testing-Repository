(function (root) {
  "use strict";

  const definitions = {
    "surveillance-radar": {
      id: "surveillance-radar", name: "Surveillance Radar", kind: "consumable", hotkey: "y",
      icon: "images/consumables/surveillance-radar.png", range: 10, duration: 1, charges: 3, cooldown: 4,
      text: "Detects all enemy warships within 10 hexes, including through islands. Expires when Next Turn is clicked. Three uses; after expiry, four further Next Turn clicks are required before reuse."
    },
    "main-battery-reload-booster": {
      id: "main-battery-reload-booster", name: "Main Battery Reload Booster", kind: "consumable", hotkey: "o",
      icon: "images/consumables/main-battery-reload-booster.png", salvoBonus: 1, duration: 2, charges: 3, cooldown: 4,
      text: "Grants one additional salvo per turn, including the activation turn. Expires after Next Turn is clicked twice. Three uses; after expiry, four further Next Turn clicks are required before reuse."
    },
    "adrenaline-rush": {
      id: "adrenaline-rush", name: "Adrenaline Rush", kind: "passive", healthThreshold: 0.5, salvoBonus: 1,
      text: "Passive skill: while this ship's HP is below 50%, it can fire one additional salvo per turn."
    }
  };

  const hasSkill = (ship, id) => Boolean(ship?.skills?.includes(id));
  const turnsRemaining = (ship, id) => ship?.skillEffects?.[id] || 0;
  const cooldownRemaining = (ship, id) => ship?.skillCooldowns?.[id] || 0;
  const usesRemaining = (ship, id) => Math.max(0, definitions[id].charges - (ship?.skillUses?.[id] || 0));
  function adrenalineActive(ship) {
    return hasSkill(ship, "adrenaline-rush") && ship.health > 0 &&
      ship.health / ship.maxHealth < definitions["adrenaline-rush"].healthThreshold;
  }
  function salvoAllowance(ship) {
    return ship.gunAttacksPerTurn + (adrenalineActive(ship) ? definitions["adrenaline-rush"].salvoBonus : 0) +
      (turnsRemaining(ship, "main-battery-reload-booster") > 0 ? definitions["main-battery-reload-booster"].salvoBonus : 0);
  }
  function initialize(ship) {
    ship.skills = [...(ship.skills || [])];
    ship.skillEffects = {};
    ship.skillUses = {};
    ship.skillCooldowns = {};
    ship.gunAttacksAllowance = ship.gunAttacksPerTurn;
    ship.gunAttacksSpentThisTurn = Math.max(0, ship.gunAttacksPerTurn - ship.gunAttacksRemaining);
    syncSalvoAllowance(ship);
    return ship;
  }
  function syncSalvoAllowance(ship) {
    const allowance = salvoAllowance(ship);
    ship.gunAttacksSpentThisTurn = Math.max(ship.gunAttacksSpentThisTurn, ship.gunAttacksAllowance - ship.gunAttacksRemaining);
    ship.gunAttacksRemaining = Math.max(0, allowance - ship.gunAttacksSpentThisTurn);
    ship.gunAttacksAllowance = allowance;
    ship.attacked = ship.gunAttacksRemaining <= 0;
  }
  function canActivate(ship, id) {
    const skill = definitions[id];
    return Boolean(ship?.health > 0 && hasSkill(ship, id) && skill?.kind === "consumable" &&
      !turnsRemaining(ship, id) && !cooldownRemaining(ship, id) && usesRemaining(ship, id) > 0);
  }
  function activate(ship, id) {
    if (!canActivate(ship, id)) return false;
    ship.skillEffects[id] = definitions[id].duration;
    ship.skillUses[id] = (ship.skillUses[id] || 0) + 1;
    syncSalvoAllowance(ship);
    return true;
  }
  function endTurn(ship) {
    for (const id of ship.skills) {
      if (turnsRemaining(ship, id) > 0) {
        ship.skillEffects[id] -= 1;
        if (ship.skillEffects[id] === 0) ship.skillCooldowns[id] = definitions[id].cooldown;
      } else if (cooldownRemaining(ship, id) > 0) {
        ship.skillCooldowns[id] -= 1;
      }
    }
    // Called exactly once for Next Turn, never for Change Phase.
    ship.gunAttacksAllowance = salvoAllowance(ship);
    ship.gunAttacksSpentThisTurn = 0;
    ship.gunAttacksRemaining = ship.gunAttacksAllowance;
    ship.attacked = false;
  }
  function revealedByRadar(target, observers, viewerTeam, hexDistance) {
    return target.health > 0 && target.team !== viewerTeam && observers.some((observer) =>
      observer.health > 0 && observer.team === viewerTeam && turnsRemaining(observer, "surveillance-radar") > 0 &&
      hexDistance(observer, target) <= definitions["surveillance-radar"].range);
  }

  root.NAVAL_COMBAT_SKILLS = {
    definitions, hasSkill, turnsRemaining, cooldownRemaining, usesRemaining, adrenalineActive, salvoAllowance, initialize,
    syncSalvoAllowance, canActivate, activate, endTurn, revealedByRadar
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.NAVAL_COMBAT_SKILLS;
})(globalThis);
