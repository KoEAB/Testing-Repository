const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattleFlow } = require("../combat-phases.js");
const green = { team: "friendly", health: 170 };
const red = { team: "enemy", health: 170 };

test("Change Phase preserves the turn; only ending red reports a turn restoration", () => {
  const flow = createBattleFlow("developer");
  for (let turn = 1; turn <= 4; turn += 1) {
    assert.equal(flow.turn, turn);
    assert.equal(flow.phase, "green");
    assert.equal(flow.buttonLabel, "Change Phase");
    assert.equal(flow.advance(), false);
    assert.equal(flow.turn, turn);
    assert.equal(flow.phase, "red");
    assert.equal(flow.buttonLabel, "Next Turn");
    assert.equal(flow.advance(), true);
  }
  assert.equal(flow.turn, 5);
});

test("Developer mode controls only the active side while retaining full visibility", () => {
  const flow = createBattleFlow("developer");
  assert.equal(flow.viewTeam, null);
  assert.equal(flow.canControl(green), true);
  assert.equal(flow.canControl(red), false);
  flow.advance();
  assert.equal(flow.viewTeam, null);
  assert.equal(flow.canControl(green), false);
  assert.equal(flow.canControl(red), true);
});

test("Player mode never adopts the red perspective or allows red orders", () => {
  const flow = createBattleFlow("player");
  assert.equal(flow.buttonLabel, "Next Phase");
  assert.equal(flow.canControl(green), true);
  assert.equal(flow.canControl(red), false);
  flow.advance();
  assert.equal(flow.phase, "red");
  assert.equal(flow.viewTeam, "friendly");
  assert.equal(flow.canControl(red), false);
  assert.equal(flow.canControl(green), false);
  assert.equal(flow.advance(), true);
  assert.equal(flow.phase, "green");
  assert.equal(flow.turn, 2);
});

test("VS mode changes both control and perspective together", () => {
  const flow = createBattleFlow("vs");
  for (const [team, other] of [[green, red], [red, green], [green, red]]) {
    assert.equal(flow.viewTeam, team.team);
    assert.equal(flow.activeTeam, team.team);
    assert.equal(flow.canControl(team), true);
    assert.equal(flow.canControl(other), false);
    assert.equal(flow.canControl({ ...team, health: 0 }), false);
    flow.advance();
  }
});

test("Reset starts a new battle in turn 1, green phase", () => {
  const flow = createBattleFlow("vs");
  flow.advance(); flow.advance(); flow.advance();
  flow.reset();
  assert.equal(flow.turn, 1);
  assert.equal(flow.phase, "green");
  assert.equal(flow.viewTeam, "friendly");
  assert.equal(flow.canControl(null), false);
});
