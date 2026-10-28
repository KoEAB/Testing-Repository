const test = require("node:test");
const assert = require("node:assert/strict");

require("../ship-combat-data.js");
const { createCombatRules } = require("../combat-rules.js");
const rules = createCombatRules(globalThis.NAVAL_UNIT_TYPES);
const namedShips = globalThis.SHIP_COMBAT_DATA;

function ship(name, team, column, row) {
  return {
    id: name, team, column, row, heading: 0, shellType: "AP",
    ...namedShips[name]
  };
}

test("ship types and named combat ships share valid codes", () => {
  const codes = globalThis.NAVAL_UNIT_TYPES.map((type) => type.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const stats of Object.values(namedShips)) assert.ok(codes.includes(stats.code));
});

test("concealment is determined by the observed ship's own range", () => {
  const battleship = { ...ship("USS North Carolina", "friendly", 10, 10), health: 660 };
  const destroyer = { ...ship("USS Fletcher", "enemy", 20, 10), health: 170 };
  assert.equal(rules.hexDistance(battleship, destroyer), 10);
  assert.equal(rules.isDetected(battleship, [battleship, destroyer]), true);
  assert.equal(rules.isDetected(destroyer, [battleship, destroyer]), false);
});

test("damage cannot hurt friendly ships and cannot exceed remaining HP", () => {
  const attacker = { team: "friendly" };
  const teammate = { team: "friendly", health: 50 };
  const enemy = { team: "enemy", health: 50 };
  assert.equal(rules.applyHullDamage(teammate, 100, attacker), 0);
  assert.equal(teammate.health, 50);
  assert.equal(rules.applyHullDamage(enemy, 100, attacker), 50);
  assert.equal(enemy.health, 0);
  assert.equal(rules.applyHullDamage(enemy, 100, attacker), 0);
});

test("North Carolina accuracy follows its concealment and gun ranges", () => {
  const attacker = ship("USS North Carolina", "friendly", 10, 10);
  const target = ship("USS New Orleans", "enemy", 20, 10);
  assert.ok(rules.calculateMissChance(attacker, target, attacker.concealmentRange) <= 0.33);
  assert.ok(rules.calculateMissChance(attacker, target, attacker.gunRange) >= 0.67);
});

test("HE penetrates destroyers, while they cannot receive citadel hits", () => {
  const attacker = ship("USS North Carolina", "friendly", 10, 10);
  const target = ship("USS Fletcher", "enemy", 12, 10);
  const options = { distance: 2, incomingBearing: 90, shellCount: 9, random: (() => {
    let count = 0;
    return () => ++count % 2 ? 0.99 : 0;
  })() };
  attacker.shellType = "HE";
  assert.ok(rules.resolveSalvo(attacker, target, options).shells.every((shell) => shell.outcome === "penetration"));
  attacker.shellType = "AP";
  for (let roll = 0; roll <= 1; roll += 0.05) {
    const salvo = rules.resolveSalvo(attacker, target, {
      ...options, random: (() => { let count = 0; return () => ++count % 2 ? 0.99 : roll; })()
    });
    assert.ok(salvo.shells.every((shell) => shell.outcome !== "citadel"));
  }
});

test("a full broadside cannot ricochet AP shells", () => {
  const attacker = ship("USS North Carolina", "friendly", 10, 10);
  const target = ship("USS New Orleans", "enemy", 12, 10);
  const salvo = rules.resolveSalvo(attacker, target, {
    distance: 2, incomingBearing: 90, shellCount: 9,
    random: (() => { let count = 0; return () => ++count % 2 ? 0.99 : 0; })()
  });
  assert.ok(salvo.shells.every((shell) => shell.outcome !== "ricochet"));
});
