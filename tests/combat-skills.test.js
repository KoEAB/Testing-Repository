const test = require("node:test");
const assert = require("node:assert/strict");
const skills = require("../combat-skills.js");
require("../ship-combat-data.js");
const { createBattleFlow } = require("../combat-phases.js");
const { createCombatRules } = require("../combat-rules.js");
const combat = createCombatRules(globalThis.NAVAL_UNIT_TYPES);
const radar = "surveillance-radar", booster = "main-battery-reload-booster";
function helena(team = "friendly") {
  const stats = globalThis.SHIP_COMBAT_DATA["USS Helena"];
  return skills.initialize({ ...stats, id:team, team, maxHealth:stats.health,
    column:10, row:10, gunAttacksRemaining:stats.gunAttacksPerTurn });
}

test("Helena has the two new traits and all three skills", () => {
  const ship=helena();
  assert.deepEqual(ship.traits,["Scouting","Barrage Fire"]);
  assert.equal(ship.skills.length,3);
  assert.equal(skills.usesRemaining(ship,radar),3);
  assert.equal(skills.usesRemaining(ship,booster),3);
});

test("Radar lasts until Next Turn; Change Phase advances neither effects nor cooldowns", () => {
  const ship=helena(), flow=createBattleFlow("developer");
  assert.equal(skills.activate(ship,radar),true);
  assert.equal(skills.turnsRemaining(ship,radar),1);
  assert.equal(skills.usesRemaining(ship,radar),2);
  assert.equal(skills.activate(ship,radar),false);
  assert.equal(flow.advance(),false);
  assert.equal(skills.turnsRemaining(ship,radar),1);
  assert.equal(flow.advance(),true);skills.endTurn(ship);
  assert.equal(skills.turnsRemaining(ship,radar),0);
  assert.equal(skills.cooldownRemaining(ship,radar),4);
  for(let remaining=3;remaining>=0;remaining--){
    flow.advance();
    assert.equal(skills.cooldownRemaining(ship,radar),remaining+1);
    flow.advance();skills.endTurn(ship);
    assert.equal(skills.cooldownRemaining(ship,radar),remaining);
    assert.equal(skills.canActivate(ship,radar),remaining===0);
  }
});

test("Reload Booster immediately grants one remaining salvo, then expires on the second Next Turn", () => {
  const ship=helena();ship.gunAttacksRemaining=0;
  assert.equal(skills.activate(ship,booster),true);
  assert.equal(ship.gunAttacksRemaining,1);
  assert.equal(ship.gunAttacksAllowance,4);
  assert.equal(skills.activate(ship,booster),false);
  assert.equal(ship.gunAttacksRemaining,1);
  skills.endTurn(ship);
  assert.equal(skills.turnsRemaining(ship,booster),1);
  assert.equal(ship.gunAttacksRemaining,4);
  assert.equal(skills.cooldownRemaining(ship,booster),0);
  skills.endTurn(ship);
  assert.equal(skills.turnsRemaining(ship,booster),0);
  assert.equal(ship.gunAttacksRemaining,3);
  assert.equal(skills.cooldownRemaining(ship,booster),4);
  for(let i=0;i<4;i++)skills.endTurn(ship);
  assert.equal(skills.canActivate(ship,booster),true);
});

test("both consumables have exactly three uses and independent cooldowns", () => {
  for(const id of [radar,booster]){
    const ship=helena();
    for(let use=0;use<3;use++){
      assert.equal(skills.activate(ship,id),true);
      assert.equal(skills.usesRemaining(ship,id),2-use);
      for(let i=0;i<skills.definitions[id].duration+4;i++)skills.endTurn(ship);
    }
    assert.equal(skills.canActivate(ship,id),false);
    assert.equal(skills.activate(ship,id),false);
    const other=id===radar?booster:radar;
    assert.equal(skills.canActivate(ship,other),true);
  }
});

test("Adrenaline Rush uses a strict 50% threshold and never generates duplicate salvos", () => {
  const ship=helena();ship.gunAttacksRemaining=0;
  ship.health=ship.maxHealth/2;skills.syncSalvoAllowance(ship);
  assert.equal(skills.adrenalineActive(ship),false);
  assert.equal(ship.gunAttacksRemaining,0);
  ship.health-=1;skills.syncSalvoAllowance(ship);
  assert.equal(skills.adrenalineActive(ship),true);
  assert.equal(ship.gunAttacksRemaining,1);
  for(let i=0;i<10;i++)skills.syncSalvoAllowance(ship);
  assert.equal(ship.gunAttacksRemaining,1);
  ship.gunAttacksRemaining=0;
  skills.syncSalvoAllowance(ship);
  assert.equal(ship.gunAttacksRemaining,0);
  skills.endTurn(ship);assert.equal(ship.gunAttacksRemaining,4);
  ship.health=ship.maxHealth;skills.syncSalvoAllowance(ship);
  assert.equal(ship.gunAttacksRemaining,3);
});

test("Adrenaline Rush and Reload Booster stack, without bypassing ammunition reload", () => {
  const ship=helena();ship.health=100;ship.gunReloadPending=true;
  skills.syncSalvoAllowance(ship);skills.activate(ship,booster);
  assert.equal(ship.gunAttacksAllowance,5);
  assert.equal(ship.gunAttacksRemaining,5);
  assert.equal(ship.gunReloadPending,true);
  skills.endTurn(ship);assert.equal(ship.gunAttacksRemaining,5);
  skills.endTurn(ship);assert.equal(ship.gunAttacksRemaining,4);
});

test("crossing the HP threshold repeatedly cannot refill salvos already spent this turn", () => {
  const ship=helena();ship.health=100;skills.syncSalvoAllowance(ship);
  ship.gunAttacksRemaining=0;skills.syncSalvoAllowance(ship);
  ship.health=333;skills.syncSalvoAllowance(ship);
  ship.health=100;skills.syncSalvoAllowance(ship);
  assert.equal(ship.gunAttacksRemaining,0);
  skills.endTurn(ship);assert.equal(ship.gunAttacksRemaining,4);
});

test("Radar reveals opposing warships by its own radius, independent of target concealment", () => {
  const observer=helena();skills.activate(observer,radar);
  const target={id:"target",team:"enemy",column:19,row:10,health:170,concealmentRange:7};
  assert.equal(combat.isDetected(target,[observer,target]),false);
  assert.equal(skills.revealedByRadar(target,[observer],"friendly",combat.hexDistance),true);
  target.column=20;
  assert.equal(skills.revealedByRadar(target,[observer],"friendly",combat.hexDistance),true);
  target.column=21;
  assert.equal(skills.revealedByRadar(target,[observer],"friendly",combat.hexDistance),false);
  target.column=19;skills.endTurn(observer);
  assert.equal(skills.revealedByRadar(target,[observer],"friendly",combat.hexDistance),false);
});

test("Radar is team-specific and stops when the observer sinks", () => {
  const observer=helena("enemy"), target={team:"friendly",column:15,row:10,health:100};
  skills.activate(observer,radar);
  assert.equal(skills.revealedByRadar(target,[observer],"enemy",combat.hexDistance),true);
  assert.equal(skills.revealedByRadar(target,[observer],"friendly",combat.hexDistance),false);
  observer.health=0;
  assert.equal(skills.revealedByRadar(target,[observer],"enemy",combat.hexDistance),false);
});

test("units without Helena's skills cannot activate them or share her counters", () => {
  const ship=helena(), other=helena();
  skills.activate(ship,radar);
  assert.equal(skills.usesRemaining(other,radar),3);
  assert.equal(skills.turnsRemaining(other,radar),0);
  assert.equal(skills.activate({...other,skills:[]},radar),false);
  assert.equal(skills.activate(ship,"adrenaline-rush"),false);
});
