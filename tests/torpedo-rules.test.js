const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("../torpedo-rules.js");
const geometry = rules.createGeometry();
const ocean = { isLand: () => false, inBounds: () => true, random: () => 0 };
const key = (cell) => `${cell.column},${cell.row}`;
function projectile(id = 1) {
  return { id, team: "friendly", origin: geometry.center({column:10,row:0}),
    endpoint: geometry.center({column:10,row:10}), bearing:90, alphaDamage:190,
    steps:0, travelN:2, progress:0.1, attemptedTargets:new Set() };
}
function target(team = "enemy", row = 3) {
  return { id:team+row, team, column:10, row, heading:0, health:660 };
}

test("Fletcher torpedo statistics match the requested data", () => {
  require("../ship-combat-data.js");
  const ship = globalThis.SHIP_COMBAT_DATA["USS Fletcher"];
  assert.equal(ship.torpedoCount,5);
  assert.equal(ship.torpedoAlphaDamage,190);
  assert.equal(ship.torpedoRange,10);
  assert.equal(ship.torpedoSpeedKnots,66);
  assert.equal(ship.torpedoReloadDuration,3);
  assert.equal(ship.torpedoTravelN,2);
  assert.equal(ship.torpedoConcealmentRange,2);
});

test("stored future travel-time formula uses the supplied 2.6 multiplier", () => {
  assert.equal(rules.maximumRangeTravelSeconds(10,66),10000/(66*2.6));
  assert.throws(()=>rules.maximumRangeTravelSeconds(10,0),RangeError);
});

test("broadside has the best hit chance; 45 degrees, bow and stern have massive penalties", () => {
  const best=rules.hitChance(90,0);
  assert.ok(Math.abs(best-0.85)<1e-10);
  assert.equal(rules.hitChance(270,0),best);
  assert.ok(rules.hitChance(45,0)<best*0.2);
  assert.equal(rules.hitChance(0,0),0.02);
  assert.equal(rules.hitChance(180,0),0.02);
});

test("map positions round-trip through odd and even columns", () => {
  for(let column=0;column<56;column++)for(let row=0;row<48;row++){
    assert.deepEqual(geometry.cellAt(geometry.center({column,row})),{column,row});
  }
});

test("five spread endpoints occupy exactly the three preview hexes", () => {
  const attacker={column:10,row:10}, middle={column:20,row:10};
  const neighbors=[{column:20,row:9},{column:20,row:11},{column:19,row:9},
    {column:19,row:10},{column:21,row:9},{column:21,row:10}];
  const spread=geometry.spread(attacker,middle,neighbors,5);
  const preview=new Set(spread.tiles.map(key));
  const endpoints=spread.endpoints.map(point=>key(geometry.cellAt(point)));
  assert.equal(new Set(endpoints).size,3);
  assert.ok(endpoints.every(k=>preview.has(k)));
  assert.deepEqual([...new Set(endpoints)].map(k=>endpoints.filter(v=>v===k).length).sort(),[1,2,2]);
  assert.equal(spread.left.x+spread.right.x,spread.middle.x*2);
  assert.equal(spread.left.y+spread.right.y,spread.middle.y*2);
});

test("sector includes contacts ahead and excludes contacts behind or to the side", () => {
  const o={x:0,y:0}, left={x:100,y:-20}, right={x:100,y:20};
  assert.ok(rules.inTriangle({x:50,y:0},o,left,right));
  assert.ok(!rules.inTriangle({x:50,y:30},o,left,right));
  assert.ok(!rules.inTriangle({x:-5,y:0},o,left,right));
  assert.ok(!rules.inTriangle({x:110,y:0},o,left,right));
  assert.ok(!rules.inTriangle({x:50,y:0},o,{x:100,y:0},{x:120,y:0}));
});

test("map-edge launch tiles without room for a transverse three-hex spread are rejected", () => {
  assert.equal(geometry.spread({column:0,row:0},{column:0,row:10},
    [{column:0,row:9},{column:0,row:11}],5),null);
});

test("N=2 advances from the adjacent hex to half range, then maximum range", () => {
  const torpedo=projectile();
  const [first]=geometry.planTravel([torpedo],[],ocean);
  assert.equal(first.nextProgress,0.5);
  assert.equal(first.stop,false);
  assert.deepEqual(geometry.cellAt(first.to),{column:10,row:5});
  torpedo.progress=first.nextProgress;torpedo.steps++;
  const [second]=geometry.planTravel([torpedo],[],ocean);
  assert.equal(second.nextProgress,1);
  assert.equal(second.stop,true);
  assert.equal(second.impact.kind,"splash");
});

test("collision catches a ship between waypoints, rather than only at the destination", () => {
  const ship=target();
  const [flight]=geometry.planTravel([projectile()],[ship],ocean);
  assert.equal(flight.stop,true);
  assert.equal(flight.impact.target,ship);
  assert.ok(flight.impact.time<1);
});

test("land stops torpedoes before a ship beyond it; friendly ships are immune", () => {
  const enemy=target("enemy",4), friendly=target("friendly",3);
  const [blocked]=geometry.planTravel([projectile()],[enemy],{
    ...ocean,isLand:cell=>cell.column===10&&cell.row===2
  });
  assert.equal(blocked.impact.kind,"splash");
  const [safe]=geometry.planTravel([projectile()],[friendly,enemy],ocean);
  assert.equal(safe.impact.target,enemy);
});

test("misses continue, and a target is only rolled once per torpedo across phases", () => {
  const ship=target("enemy",5), torpedo=projectile();let rolls=0;
  const opts={...ocean,random:()=>{rolls++;return 0.99;}};
  const [first]=geometry.planTravel([torpedo],[ship],opts);
  assert.equal(first.stop,false);
  torpedo.progress=first.nextProgress;torpedo.steps++;
  torpedo.attemptedTargets=first.attemptedTargets;
  geometry.planTravel([torpedo],[ship],opts);
  assert.equal(rolls,1);
});

test("simultaneous torpedoes do not absorb excess hits on a predicted wreck", () => {
  const ship={...target(),health:190};
  const flights=geometry.planTravel([projectile(1),projectile(2)],[ship],ocean);
  assert.equal(flights.filter(f=>f.impact?.kind==="hit").length,1);
  assert.equal(flights.filter(f=>!f.stop).length,1);
  assert.equal(ship.health,190,"planning must not apply damage before animation reaches impact");
});

test("a ship that moves ahead into the torpedo's path can be encountered again", () => {
  const torpedo=projectile(), ship=target();
  const [first]=geometry.planTravel([torpedo],[ship],{...ocean,random:()=>0.99});
  torpedo.progress=first.nextProgress;torpedo.steps++;
  torpedo.attemptedTargets=first.attemptedTargets;
  ship.row=8;
  const [second]=geometry.planTravel([torpedo],[ship],ocean);
  assert.equal(second.impact.kind,"hit");
});
