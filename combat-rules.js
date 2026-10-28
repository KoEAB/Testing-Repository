(function (root) {
  "use strict";

  const MIN_AP_SHELL_VELOCITY = 701;
  const MAX_AP_SHELL_VELOCITY = 914;
  const DEFAULT_TARGET_SPEED_KNOTS = 29.5;

  function createCombatRules(unitTypes) {
    const typeByCode = new Map(unitTypes.map((type) => [type.code, type]));
    const sizeOf = (code) => typeByCode.get(code)?.size ?? 3;

    function hexDistance(first, second) {
      const firstR = first.row - Math.floor(first.column / 2);
      const secondR = second.row - Math.floor(second.column / 2);
      const dq = first.column - second.column;
      const dr = firstR - secondR;
      return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
    }

    function isDetected(ship, units) {
      return ship.health > 0 && units.some((other) => other.health > 0 && other.team !== ship.team &&
        hexDistance(ship, other) <= ship.concealmentRange);
    }

    function applyHullDamage(target, amount, attacker) {
      if (!target || !attacker || target.team === attacker.team || target.health <= 0 || amount <= 0) return 0;
      const damage = Math.min(target.health, amount);
      target.health -= damage;
      return damage;
    }

    function northCarolinaMissChance(attacker, target, distance) {
      const concealment = attacker.concealmentRange;
      const maximum = attacker.gunRange;
      const targetSizeAdjustment = 0.02 * (3 - sizeOf(target.code));
      const closeMissChance = Math.min(0.33, Math.max(0.08,
        0.18 + 0.11 * Math.min(distance / Math.max(1, concealment), 1) + targetSizeAdjustment));
      if (distance <= concealment || maximum <= concealment) return closeMissChance;
      const missAtConcealment = Math.min(0.33, Math.max(0.08, 0.29 + targetSizeAdjustment));
      const longRangeProgress = Math.min(1, (distance - concealment) / (maximum - concealment));
      return missAtConcealment + (0.72 - missAtConcealment) * longRangeProgress;
    }

    function shellVelocityMissAdjustment(attacker) {
      const velocity = attacker.shellType === "HE" ? attacker.heShellVelocity : attacker.apShellVelocity;
      if (velocity == null) return 0;
      const velocityProgress = Math.max(0, Math.min(1,
        (velocity - MIN_AP_SHELL_VELOCITY) / (MAX_AP_SHELL_VELOCITY - MIN_AP_SHELL_VELOCITY)));
      return -0.10 * velocityProgress;
    }

    function targetSpeedMissAdjustment(target) {
      if (target.speedKnots == null) return 0;
      // Keep the speed adjustment bounded when skills raise speed beyond its ordinary range.
      const speedOffset = target.speedKnots - DEFAULT_TARGET_SPEED_KNOTS;
      return 0.10 * speedOffset / (9 + Math.abs(speedOffset));
    }

    function calculateMissChance(attacker, target, distance, sternQuarter = 0) {
      const rangeMissChance = attacker.accuracyProfile === "north-carolina"
        ? northCarolinaMissChance(attacker, target, distance)
        : Math.min(0.4, Math.max(0.12, 0.17 + 0.18 * distance / attacker.gunRange - 0.02 * (sizeOf(target.code) - 3)));
      let chance = rangeMissChance + 0.09 * sternQuarter +
        shellVelocityMissAdjustment(attacker) + targetSpeedMissAdjustment(target);
      if (attacker.accuracyProfile === "north-carolina") {
        if (distance <= attacker.concealmentRange) chance = Math.min(chance, 0.33);
        if (distance >= attacker.gunRange) chance = Math.max(chance, 0.67);
      }
      return Math.max(0.05, Math.min(0.90, chance));
    }

    function resolveSalvo(attacker, target, { distance, incomingBearing, shellCount = attacker.shellCount, random = Math.random }) {
      const relativeAngle = ((incomingBearing - target.heading) % 360 + 540) % 360 - 180;
      const aspectRadians = Math.abs(relativeAngle) * Math.PI / 180;
      const broadside = Math.sin(aspectRadians) ** 2;
      const bowQuarter = Math.max(0, Math.sin(2 * aspectRadians));
      const sternQuarter = Math.max(0, -Math.sin(2 * aspectRadians));
      const sizeAdvantage = Math.max(0, sizeOf(attacker.code) - sizeOf(target.code));
      const sizeDisadvantage = Math.max(0, sizeOf(target.code) - sizeOf(attacker.code));
      const angleFromEnd = Math.min(Math.abs(relativeAngle), 180 - Math.abs(relativeAngle));
      const missChance = calculateMissChance(attacker, target, distance, sternQuarter);
      const shellType = attacker.shellType;
      const ricochetChance = broadside >= 0.98 ? 0 : Math.min(0.55,
        Math.max(0.03, 0.32 - 0.075 * sizeAdvantage) * (1 - broadside) +
        0.13 * bowQuarter * Math.max(0.35, 1 - 0.18 * sizeAdvantage));
      const nonPenChance = Math.min(0.26, 0.08 + 0.1 * (1 - broadside) + 0.025 * sizeDisadvantage);
      const closeRangeProgress = Math.max(0, (attacker.concealmentRange / 2 - distance) / Math.max(1, attacker.concealmentRange / 2));
      const minimumCitadelAngle = sizeAdvantage > 0 ? 45 : 65;
      const citadelExposure = angleFromEnd < minimumCitadelAngle ? 0 :
        0.08 + 0.92 * (angleFromEnd - minimumCitadelAngle) / (90 - minimumCitadelAngle);
      const citadelChance = typeByCode.get(target.code)?.noCitadel ? 0 : citadelExposure * (
        0.14 * broadside + 0.025 * sizeAdvantage * (1 - broadside) +
        closeRangeProgress * (0.1 * broadside + 0.025 * sizeAdvantage * (1 - broadside)));
      const destroyerTarget = target.code === "DD" || target.code === "DE";
      const overPenThreshold = attacker.gunRange * 2 / 3;
      const closeOverPenProgress = Math.max(0, (overPenThreshold - distance) / Math.max(1, overPenThreshold));
      const overPenChance = Math.min(0.75, 0.15 + 0.04 * sizeAdvantage +
        (destroyerTarget && attacker.mainGunCaliberMm >= 203 ? 0.5 * closeOverPenProgress : 0));
      const heNonPenChance = destroyerTarget ? 0 : Math.min(0.78,
        0.26 + 0.24 * (1 - broadside) + 0.06 * sizeDisadvantage);
      const shells = Array.from({ length: shellCount }, () => {
        if (random() < missChance) return { outcome: "miss", damage: 0 };
        const roll = random();
        if (shellType === "HE") return roll < heNonPenChance
          ? { outcome: "non-penetration", damage: 0 }
          : { outcome: "penetration", damage: Math.round(attacker.heAlphaDamage / 3) };
        if (roll < ricochetChance) return { outcome: "ricochet", damage: 0 };
        if (roll < ricochetChance + nonPenChance) return { outcome: "non-penetration", damage: 0 };
        if (roll < ricochetChance + nonPenChance + citadelChance) return { outcome: "citadel", damage: attacker.alphaDamage };
        if (roll < ricochetChance + nonPenChance + citadelChance + overPenChance) return { outcome: "overpenetration", damage: Math.round(attacker.alphaDamage * 0.1) };
        return { outcome: "penetration", damage: Math.round(attacker.alphaDamage / 3) };
      });
      return { shellType, targetId: target.id, impactAngle: relativeAngle, shells,
        totalDamage: shells.reduce((sum, shell) => sum + shell.damage, 0), damageDealt: 0 };
    }

    return { MIN_AP_SHELL_VELOCITY, hexDistance, isDetected, applyHullDamage, calculateMissChance, resolveSalvo };
  }

  const api = { createCombatRules };
  root.NAVAL_COMBAT_RULES = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
