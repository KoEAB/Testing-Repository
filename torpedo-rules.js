(function (root) {
  "use strict";

  // Reserved for future real-time travel. Phase movement deliberately does not use this.
  function maximumRangeTravelSeconds(rangeKm, speedKnots) {
    if (!(rangeKm >= 0) || !(speedKnots > 0)) throw new RangeError("Invalid torpedo range or speed");
    return rangeKm * 1000 / (speedKnots * 2.6);
  }

  function hitChance(targetHeading, travelBearing) {
    const broadside = Math.abs(Math.sin((targetHeading - travelBearing) * Math.PI / 180));
    // Broadside is optimal (85%). Even a 45-degree presentation falls to about 12%.
    return 0.02 + 0.83 * broadside ** 6;
  }

  function inTriangle(point, origin, left, right) {
    const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross(origin, left, right)) < 0.001) return false;
    const signs = [cross(origin, left, point), cross(left, right, point), cross(right, origin, point)];
    return !signs.some((v) => v < -0.001) || !signs.some((v) => v > 0.001);
  }

  function createGeometry({ width = 128, height = 112, step = 96 } = {}) {
    function center(cell) {
      return { x: cell.column * step + width / 2,
        y: cell.row * height + (cell.column % 2 ? height / 2 : 0) + height / 2 };
    }
    function cellAt(point) {
      const q = (point.x - width / 2) / step;
      const r = (point.y - height / 2) / height - q / 2;
      const s = -q - r;
      let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
      const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
      if (dq > dr && dq > ds) rq = -rr - rs;
      else if (dr > ds) rr = -rq - rs;
      return { column: rq, row: rr + Math.floor(rq / 2) };
    }
    const interpolate = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

    function spread(attacker, target, neighbors, count) {
      const origin = center(attacker), middle = center(target);
      const direction = { x: middle.x - origin.x, y: middle.y - origin.y };
      const length = Math.hypot(direction.x, direction.y);
      if (!length) return null;
      let best = null;
      for (let i = 0; i < neighbors.length; i += 1) {
        for (let j = i + 1; j < neighbors.length; j += 1) {
          const left = center(neighbors[i]), right = center(neighbors[j]);
          if (Math.hypot(left.x + right.x - 2 * middle.x, left.y + right.y - 2 * middle.y) > 0.01) continue;
          const dx = right.x - left.x, dy = right.y - left.y;
          const score = Math.abs(dx * direction.x + dy * direction.y) / (Math.hypot(dx, dy) * length);
          if (!best || score < best.score) best = { left, right, score, tiles: [neighbors[i], target, neighbors[j]] };
        }
      }
      if (!best || best.score > 0.55) return null;
      // Three collinear hexes use the closest available grid axis to a perpendicular.
      // Equal spacing across their interiors keeps every endpoint within those three hexes.
      const dx = (best.right.x - best.left.x) / 2, dy = (best.right.y - best.left.y) / 2;
      const endpoints = Array.from({ length: count }, (_, i) => {
        const offset = ((i + 0.5) / count - 0.5) * 3;
        return { x: middle.x + dx * offset, y: middle.y + dy * offset };
      });
      return { origin, middle, left: best.left, right: best.right, tiles: best.tiles, endpoints };
    }

    function planTravel(torpedoes, units, { isLand, inBounds, random = Math.random }) {
      const liveUnits = new Map(units.filter((s) => s.health > 0).map((s) => [`${s.column},${s.row}`, s]));
      const projectedHealth = new Map(units.map((s) => [s.id, s.health]));
      const events = [];
      const flights = torpedoes.map((torpedo, index) => {
        const nextProgress = Math.max(torpedo.progress, Math.min(1, (torpedo.steps + 1) / torpedo.travelN));
        const from = interpolate(torpedo.origin, torpedo.endpoint, torpedo.progress);
        const to = interpolate(torpedo.origin, torpedo.endpoint, nextProgress);
        const flight = { torpedo, from, to, nextProgress, stop: false, impact: null,
          attemptedTargets: new Set(torpedo.attemptedTargets || []) };
        const samples = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (height / 12)));
        let previousKey;
        for (let i = 0; i <= samples; i += 1) {
          const time = i / samples, point = interpolate(from, to, time), cell = cellAt(point);
          const key = `${cell.column},${cell.row}`;
          if (key === previousKey) continue;
          previousKey = key;
          events.push({ index, time, point, cell, key });
        }
        return flight;
      });
      events.sort((a, b) => a.time - b.time || a.index - b.index);
      for (const event of events) {
        const flight = flights[event.index], torpedo = flight.torpedo;
        if (flight.stop) continue;
        let impact = null;
        if (!inBounds(event.cell) || isLand(event.cell)) impact = { kind: "splash" };
        else {
          const target = liveUnits.get(event.key);
          const encounter = target ? `${target.id}@${event.key}` : null;
          if (!target || target.team === torpedo.team || projectedHealth.get(target.id) <= 0 || flight.attemptedTargets.has(encounter)) continue;
          flight.attemptedTargets.add(encounter);
          if (random() >= hitChance(target.heading, torpedo.bearing)) continue;
          projectedHealth.set(target.id, Math.max(0, projectedHealth.get(target.id) - torpedo.alphaDamage));
          impact = { kind: "hit", target };
        }
        flight.to = event.point;
        flight.stop = true;
        flight.impact = { ...impact, time: event.time };
      }
      flights.forEach((flight) => {
        if (!flight.stop && flight.nextProgress === 1) {
          flight.stop = true;
          flight.impact = { kind: "splash", time: 1 };
        }
      });
      return flights;
    }
    return { center, cellAt, interpolate, spread, planTravel };
  }

  root.NAVAL_TORPEDO_RULES = { maximumRangeTravelSeconds, hitChance, inTriangle, createGeometry };
  if (typeof module !== "undefined" && module.exports) module.exports = root.NAVAL_TORPEDO_RULES;
})(globalThis);
