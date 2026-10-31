(function (root) {
  "use strict";

  function createBattleFlow(mode = "developer") {
    if (!["developer", "player", "vs"].includes(mode)) throw new Error("Unknown combat mode");
    let turn = 1;
    let phase = "green";
    const activeTeam = () => phase === "green" ? "friendly" : "enemy";
    return {
      mode,
      get turn() { return turn; },
      get phase() { return phase; },
      get activeTeam() { return activeTeam(); },
      get viewTeam() { return mode === "developer" ? null : mode === "player" ? "friendly" : activeTeam(); },
      get buttonLabel() { return mode === "player" ? "Next Phase" : phase === "green" ? "Change Phase" : "Next Turn"; },
      canControl(ship) {
        return Boolean(ship && ship.health > 0 && ship.team === activeTeam() && !(mode === "player" && phase === "red"));
      },
      advance() {
        if (phase === "green") {
          phase = "red";
          return false;
        }
        turn += 1;
        phase = "green";
        return true;
      },
      reset() { turn = 1; phase = "green"; }
    };
  }

  root.NAVAL_COMBAT_PHASES = { createBattleFlow };
  if (typeof module !== "undefined" && module.exports) module.exports = root.NAVAL_COMBAT_PHASES;
})(globalThis);
