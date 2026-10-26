(function () {
  "use strict";

  const COLUMNS = 50;
  const ROWS = 50;
  const HEX_WIDTH = 128;
  const HEX_HEIGHT = 112;
  const COLUMN_STEP = 96;
  const MAP_WIDTH = (COLUMNS - 1) * COLUMN_STEP + HEX_WIDTH;
  const MAP_HEIGHT = ROWS * HEX_HEIGHT + HEX_HEIGHT / 2;
  const MIN_SCALE = 0.15;
  const MAX_SCALE = 2.2;
  const SCALE_STEP = 0.1;
  const MOVE_RANGE = 5;
  const ATTACK_RANGE = 7;
  const TURN_DURATION = 260;
  const ATTACK_CODES = new Set(["DD", "DE", "CL", "CA", "CB", "BC", "BB", "BBV"]);

  const shipTypes = [
    { code: "SS", label: "Submarine", column: 18, row: 24, group: "submarine" },
    { code: "SSV", label: "Aviation submarine", column: 19, row: 24, group: "submarine" },
    { code: "DD", label: "Destroyer", column: 20, row: 24, group: "escort" },
    { code: "DE", label: "Destroyer escort", column: 21, row: 24, group: "escort" },
    { code: "CL", label: "Light cruiser", column: 22, row: 24, group: "cruiser" },
    { code: "CA", label: "Heavy cruiser", column: 23, row: 24, group: "cruiser" },
    { code: "CB", label: "Large cruiser", column: 24, row: 24, group: "cruiser" },
    { code: "BC", label: "Battlecruiser", column: 25, row: 24, group: "capital" },
    { code: "BB", label: "Battleship", column: 26, row: 24, group: "capital" },
    { code: "BBV", label: "Aviation battleship", column: 27, row: 24, group: "capital" },
    { code: "CV", label: "Aircraft carrier", column: 28, row: 24, group: "aviation" },
    { code: "CVL", label: "Light aircraft carrier", column: 29, row: 24, group: "aviation" },
    { code: "CVE", label: "Escort aircraft carrier", column: 30, row: 24, group: "aviation" },
    { code: "BM", label: "Monitor", column: 31, row: 24, group: "coastal" },
    { code: "AR", label: "Repair ship", column: 32, row: 24, group: "support" }
  ].map((ship) => ({ ...ship, heading: 0, moved: false, attacked: false, health: 100 }));

  const islandShapes = [
    { column: 3, row: 4, width: 5, height: 6 },
    { column: 14, row: 8, width: 4, height: 5 },
    { column: 27, row: 5, width: 6, height: 4 },
    { column: 43, row: 7, width: 6, height: 7 },
    { column: 7, row: 20, width: 5, height: 8 },
    { column: 34, row: 22, width: 1.6, height: 2.6 },
    { column: 38, row: 20, width: 5, height: 5 },
    { column: 13, row: 34, width: 7, height: 5 },
    { column: 29, row: 37, width: 5, height: 8 },
    { column: 45, row: 34, width: 5, height: 6 },
    { column: 4, row: 45, width: 6, height: 5 },
    { column: 20, row: 47, width: 4, height: 4 },
    { column: 39, row: 46, width: 7, height: 5 }
  ];

  const landCells = new Set();
  for (let column = 0; column < COLUMNS; column += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      const isLand = islandShapes.some((island, index) => {
        const x = (column - island.column) / island.width;
        const y = (row - island.row) / island.height;
        const edgeVariation = ((column * 17 + row * 29 + index * 11) % 9 - 4) * 0.035;
        return x * x + y * y < 1 + edgeVariation;
      });
      if (isLand && !(row === 24 && column >= 17 && column <= 32)) landCells.add(`${column},${row}`);
    }
  }

  const viewport = document.querySelector("#hex-map-viewport");
  const stage = document.querySelector("#hex-map-stage");
  const map = document.querySelector("#hex-map");
  const unitReadout = document.querySelector("#unit-readout");
  const detailPanel = document.querySelector("#unit-detail-panel");
  const detailCode = document.querySelector("#unit-detail-code");
  const detailName = document.querySelector("#unit-detail-name");
  const detailCategory = document.querySelector("#unit-detail-category");
  const detailPosition = document.querySelector("#unit-detail-position");
  const detailMovement = document.querySelector("#unit-detail-movement");
  const detailAttack = document.querySelector("#unit-detail-attack");
  const detailStatus = document.querySelector("#unit-detail-status");
  const detailInstruction = document.querySelector("#unit-detail-instruction");
  const detailClose = document.querySelector("#unit-detail-close");
  const nextTurnButton = document.querySelector("#next-turn");
  const turnNumber = document.querySelector("#turn-number");
  const tileElements = new Map();
  const unitElements = new Map();
  let scale = 1;
  let dragState = null;
  let ignoreNextTileClick = false;
  let selectedUnit = null;
  let reachableState = null;
  let attackCells = new Set();
  let mode = null;
  let isAnimating = false;
  let currentTurn = 1;

  function cellKey(column, row) {
    return `${column},${row}`;
  }

  function parseCellKey(key) {
    const [column, row] = key.split(",").map(Number);
    return { column, row };
  }

  function cellCenter(column, row) {
    return {
      x: column * COLUMN_STEP + HEX_WIDTH / 2,
      y: row * HEX_HEIGHT + (column % 2 ? HEX_HEIGHT / 2 : 0) + HEX_HEIGHT / 2
    };
  }

  function coordinateLabel(column, row) {
    let value = column + 1;
    let letters = "";
    while (value > 0) {
      value -= 1;
      letters = String.fromCharCode(65 + value % 26) + letters;
      value = Math.floor(value / 26);
    }
    return `${letters}${row + 1}`;
  }

  function renderIcon(code) {
    const submarine = '<rect x="8" y="8" width="8" height="32"/><polygon points="26,8 91,24 26,40"/>';
    const destroyer = '<polygon points="8,8 91,24 8,40"/>';
    const cruiser = '<polygon points="8,8 43,8 28,40 8,40"/><polygon points="51,8 66,8 91,24 66,40 38,40"/>';
    const battleship = '<polygon points="8,8 37,8 22,40 8,40"/><polygon points="45,8 58,8 42,40 28,40"/><polygon points="67,8 91,24 67,40 49,40"/>';
    const carrier = '<rect x="8" y="8" width="47" height="14"/><rect x="8" y="27" width="47" height="13"/><polygon points="61,8 73,8 92,24 73,40 61,40"/>';
    const monitor = '<polygon points="7,14 21,8 68,8 92,24 68,40 21,40 7,34"/><rect x="27" y="16" width="26" height="16" rx="8"/>';
    const repairShip = '<path fill-rule="evenodd" d="M4 14 19 8H67L93 24 67 40H19L4 34 10 24ZM37 15H49V20H55V28H49V33H37V28H31V20H37Z"/>';
    const shapes = {
      SS: submarine, SSV: submarine, DD: destroyer, DE: destroyer,
      CL: cruiser, CA: cruiser, CB: cruiser, BC: battleship,
      BB: battleship, BBV: battleship, CV: carrier, CVL: carrier,
      CVE: carrier, BM: monitor, AR: repairShip
    };
    return `<svg viewBox="0 0 96 48" aria-hidden="true" focusable="false">${shapes[code]}</svg>`;
  }

  function renderMap() {
    map.style.width = `${MAP_WIDTH}px`;
    map.style.height = `${MAP_HEIGHT}px`;
    for (let column = 0; column < COLUMNS; column += 1) {
      for (let row = 0; row < ROWS; row += 1) {
        const key = cellKey(column, row);
        const terrain = landCells.has(key) ? "land" : "sea";
        const tile = document.createElement("button");
        tile.className = `hex-cell ${terrain}-hex terrain-variant-${(column * 5 + row * 3) % 3}`;
        tile.type = "button";
        tile.dataset.cell = key;
        tile.style.left = `${column * COLUMN_STEP}px`;
        tile.style.top = `${row * HEX_HEIGHT + (column % 2 ? HEX_HEIGHT / 2 : 0)}px`;
        tile.innerHTML = `<span>${coordinateLabel(column, row)}</span>`;
        tile.tabIndex = -1;
        if (terrain === "land") tile.setAttribute("aria-disabled", "true");
        tile.setAttribute("aria-label", `${coordinateLabel(column, row)} · ${terrain}`);
        tile.addEventListener("mouseenter", () => previewMovementFacing(key));
        tile.addEventListener("mouseleave", restoreCommittedFacing);
        tile.addEventListener("click", () => handleTileClick(key));
        tile.addEventListener("contextmenu", (event) => handleTileRightClick(event, key));
        tileElements.set(key, tile);
        map.appendChild(tile);
      }
    }

    shipTypes.forEach((shipType) => {
      const marker = document.createElement("button");
      marker.className = "map-unit";
      marker.type = "button";
      marker.dataset.shipType = shipType.code;
      marker.dataset.heading = "0";
      marker.style.setProperty("--heading", "0deg");
      positionMarker(marker, shipType.column, shipType.row);
      marker.setAttribute("aria-label", `${shipType.code}: ${shipType.label}, full health`);
      marker.innerHTML = `<span class="map-unit-icon">${renderIcon(shipType.code)}</span><span class="unit-health" aria-hidden="true"><i></i></span>`;
      marker.addEventListener("click", (event) => handleUnitClick(event, marker, shipType));
      marker.addEventListener("contextmenu", (event) => beginAttackMode(event, marker, shipType));
      unitElements.set(shipType.code, marker);
      map.appendChild(marker);
    });
  }

  function positionMarker(marker, column, row) {
    const center = cellCenter(column, row);
    positionMarkerAtPoint(marker, center);
  }

  function positionMarkerAtPoint(marker, point) {
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y}px`;
  }

  function getNeighbors(column, row) {
    const diagonalRows = column % 2 ? [row, row + 1] : [row - 1, row];
    return [
      { column, row: row - 1 }, { column, row: row + 1 },
      { column: column - 1, row: diagonalRows[0] }, { column: column - 1, row: diagonalRows[1] },
      { column: column + 1, row: diagonalRows[0] }, { column: column + 1, row: diagonalRows[1] }
    ].filter((cell) => cell.column >= 0 && cell.column < COLUMNS && cell.row >= 0 && cell.row < ROWS);
  }

  function occupiedCells(exceptCode) {
    return new Set(shipTypes.filter((ship) => ship.code !== exceptCode).map((ship) => cellKey(ship.column, ship.row)));
  }

  function calculateReachable(shipType) {
    const startKey = cellKey(shipType.column, shipType.row);
    const blocked = occupiedCells(shipType.code);
    const distance = new Map([[startKey, 0]]);
    const previous = new Map();
    const queue = [startKey];
    while (queue.length) {
      const currentKey = queue.shift();
      const currentDistance = distance.get(currentKey);
      if (currentDistance >= MOVE_RANGE) continue;
      const current = parseCellKey(currentKey);
      getNeighbors(current.column, current.row).forEach((neighbor) => {
        const neighborKey = cellKey(neighbor.column, neighbor.row);
        if (distance.has(neighborKey) || landCells.has(neighborKey) || blocked.has(neighborKey)) return;
        distance.set(neighborKey, currentDistance + 1);
        previous.set(neighborKey, currentKey);
        queue.push(neighborKey);
      });
    }
    distance.delete(startKey);
    return { startKey, distance, previous };
  }

  function calculateRadius(shipType, radius) {
    const startKey = cellKey(shipType.column, shipType.row);
    const distance = new Map([[startKey, 0]]);
    const queue = [startKey];
    while (queue.length) {
      const currentKey = queue.shift();
      const currentDistance = distance.get(currentKey);
      if (currentDistance >= radius) continue;
      const current = parseCellKey(currentKey);
      getNeighbors(current.column, current.row).forEach((neighbor) => {
        const key = cellKey(neighbor.column, neighbor.row);
        if (distance.has(key)) return;
        distance.set(key, currentDistance + 1);
        queue.push(key);
      });
    }
    distance.delete(startKey);
    return new Set(distance.keys());
  }

  function clearTacticalHighlights() {
    tileElements.forEach((tile) => {
      tile.classList.remove("is-reachable", "is-unit-selected", "is-route", "is-attackable");
      delete tile.dataset.distance;
      tile.tabIndex = -1;
    });
  }

  function markSelectedOrigin(shipType) {
    tileElements.get(cellKey(shipType.column, shipType.row))?.classList.add("is-unit-selected");
  }

  function showMovementArea(shipType) {
    clearTacticalHighlights();
    attackCells.clear();
    mode = "move";
    markSelectedOrigin(shipType);
    reachableState = shipType.moved ? null : calculateReachable(shipType);
    if (!reachableState) return;
    reachableState.distance.forEach((distance, key) => {
      const tile = tileElements.get(key);
      tile.classList.add("is-reachable");
      tile.dataset.distance = String(distance);
      tile.tabIndex = 0;
    });
  }

  function showAttackArea(shipType) {
    clearTacticalHighlights();
    reachableState = null;
    mode = "attack";
    markSelectedOrigin(shipType);
    attackCells = calculateRadius(shipType, ATTACK_RANGE);
    attackCells.forEach((key) => {
      const tile = tileElements.get(key);
      tile.classList.add("is-attackable");
      tile.tabIndex = 0;
    });
  }

  function updateDetailPanel(shipType, status = "Awaiting orders") {
    const canAttack = ATTACK_CODES.has(shipType.code);
    detailCode.textContent = shipType.code;
    detailName.textContent = shipType.label;
    detailCategory.textContent = shipType.group.charAt(0).toUpperCase() + shipType.group.slice(1);
    detailPosition.textContent = coordinateLabel(shipType.column, shipType.row);
    detailMovement.textContent = shipType.moved ? "Spent" : "Ready · 5 hexes";
    detailAttack.textContent = canAttack ? (shipType.attacked ? "Spent" : "Ready · 7 hexes") : "Unavailable";
    detailStatus.textContent = status;
    detailInstruction.textContent = mode === "attack"
      ? "Select a red hex to fire. Ships in range may be targeted."
      : "Hover to preview facing. Left-click to move; right-click to set facing.";
    detailPanel.hidden = false;
  }

  function setMarkerHeading(shipType, targetCell, options = {}) {
    const from = cellCenter(shipType.column, shipType.row);
    const to = cellCenter(targetCell.column, targetCell.row);
    return setHeadingBetween(shipType, from, to, options);
  }

  function setHeadingBetween(shipType, from, to, options = {}) {
    const marker = unitElements.get(shipType.code);
    let heading = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    if (options.broadside) heading += 90;
    const current = Number(marker.dataset.heading || shipType.heading || 0);
    while (heading - current > 180) heading -= 360;
    while (heading - current < -180) heading += 360;
    marker.dataset.heading = String(heading);
    marker.style.setProperty("--heading", `${heading}deg`);
    if (options.commit) shipType.heading = heading;
    return heading;
  }

  function restoreCommittedFacing() {
    if (!selectedUnit || isAnimating) return;
    const marker = unitElements.get(selectedUnit.code);
    marker.dataset.heading = String(selectedUnit.heading);
    marker.style.setProperty("--heading", `${selectedUnit.heading}deg`);
  }

  function previewMovementFacing(key) {
    if (mode !== "move" || !selectedUnit || isAnimating || !reachableState?.distance.has(key)) return;
    setMarkerHeading(selectedUnit, parseCellKey(key));
  }

  function handleTileRightClick(event, key) {
    event.preventDefault();
    if (mode !== "move" || !selectedUnit || isAnimating || !reachableState?.distance.has(key)) return;
    const target = parseCellKey(key);
    setMarkerHeading(selectedUnit, target, { commit: true });
    updateDetailPanel(selectedUnit, `Facing ${coordinateLabel(target.column, target.row)}`);
  }

  function handleUnitClick(event, marker, shipType) {
    event.stopPropagation();
    if (isAnimating) return;
    const key = cellKey(shipType.column, shipType.row);
    if (mode === "attack" && selectedUnit && selectedUnit.code !== shipType.code && attackCells.has(key)) {
      fireVolley(key);
      return;
    }
    if (selectedUnit?.code === shipType.code && mode === "move") {
      deselectUnit();
      return;
    }
    selectUnit(marker, shipType);
  }

  function selectUnit(marker, shipType) {
    if (isAnimating) return;
    restoreCommittedFacing();
    map.querySelectorAll(".map-unit.is-selected").forEach((unit) => unit.classList.remove("is-selected"));
    selectedUnit = shipType;
    marker.classList.add("is-selected");
    unitReadout.textContent = `${shipType.code} · ${shipType.label}`;
    showMovementArea(shipType);
    updateDetailPanel(shipType);
  }

  function beginAttackMode(event, marker, shipType) {
    event.preventDefault();
    event.stopPropagation();
    if (isAnimating) return;
    if (!ATTACK_CODES.has(shipType.code)) {
      selectUnit(marker, shipType);
      updateDetailPanel(shipType, "No ranged armament");
      return;
    }
    restoreCommittedFacing();
    map.querySelectorAll(".map-unit.is-selected").forEach((unit) => unit.classList.remove("is-selected"));
    selectedUnit = shipType;
    marker.classList.add("is-selected");
    if (shipType.attacked) {
      showMovementArea(shipType);
      updateDetailPanel(shipType, "Attack already used this turn");
      return;
    }
    showAttackArea(shipType);
    unitReadout.textContent = `${shipType.code} · Attack range`;
    updateDetailPanel(shipType, "Select firing target");
  }

  function deselectUnit() {
    if (isAnimating) return;
    restoreCommittedFacing();
    selectedUnit = null;
    reachableState = null;
    attackCells.clear();
    mode = null;
    map.querySelectorAll(".map-unit.is-selected").forEach((unit) => unit.classList.remove("is-selected"));
    clearTacticalHighlights();
    detailPanel.hidden = true;
    unitReadout.textContent = "Select a ship-type marker";
  }

  function buildPath(targetKey) {
    const path = [];
    let currentKey = targetKey;
    while (currentKey && currentKey !== reachableState.startKey) {
      path.unshift(currentKey);
      currentKey = reachableState.previous.get(currentKey);
    }
    return currentKey === reachableState.startKey ? path : [];
  }

  function pointIntersectsLand(point, clearance = 18) {
    for (const key of landCells) {
      const land = parseCellKey(key);
      const center = cellCenter(land.column, land.row);
      const x = Math.abs(point.x - center.x);
      const y = Math.abs(point.y - center.y);
      if (y > HEX_HEIGHT / 2 + clearance) continue;
      const slopedEdge = HEX_WIDTH / 2 + clearance - (HEX_WIDTH / 4 / (HEX_HEIGHT / 2)) * Math.max(0, y - clearance);
      if (x <= slopedEdge) return true;
    }
    return false;
  }

  function lineCrossesLand(from, to) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const samples = Math.max(2, Math.ceil(distance / 14));
    for (let index = 1; index < samples; index += 1) {
      const progress = index / samples;
      if (pointIntersectsLand({
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress
      })) return true;
    }
    return false;
  }

  function simplifyLandRoute(points) {
    const simplified = [points[0]];
    let currentIndex = 0;
    while (currentIndex < points.length - 1) {
      let nextIndex = currentIndex + 1;
      for (let candidate = points.length - 1; candidate > currentIndex; candidate -= 1) {
        if (!lineCrossesLand(points[currentIndex], points[candidate])) {
          nextIndex = candidate;
          break;
        }
      }
      simplified.push(points[nextIndex]);
      currentIndex = nextIndex;
    }
    return simplified;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function moveSelectedUnit(targetKey) {
    if (!selectedUnit || selectedUnit.moved || !reachableState?.distance.has(targetKey) || isAnimating) return;
    const path = buildPath(targetKey);
    if (!path.length) return;
    isAnimating = true;
    mode = null;
    const shipType = selectedUnit;
    const marker = unitElements.get(shipType.code);
    const targetCell = parseCellKey(targetKey);
    const startPoint = cellCenter(shipType.column, shipType.row);
    const targetPoint = cellCenter(targetCell.column, targetCell.row);
    const landInWay = lineCrossesLand(startPoint, targetPoint);
    const navigablePoints = [startPoint, ...path.map((key) => {
      const cell = parseCellKey(key);
      return cellCenter(cell.column, cell.row);
    })];
    const routePoints = landInWay ? simplifyLandRoute(navigablePoints) : [startPoint, targetPoint];
    marker.dataset.lastRoute = landInWay ? "detour" : "direct";
    marker.dataset.routeSegments = String(routePoints.length - 1);
    clearTacticalHighlights();
    if (landInWay) path.forEach((key) => tileElements.get(key)?.classList.add("is-route"));
    marker.classList.add("is-moving");
    updateDetailPanel(shipType, "Underway");
    unitReadout.textContent = `${shipType.code} · Underway`;
    for (let index = 1; index < routePoints.length; index += 1) {
      const from = routePoints[index - 1];
      const to = routePoints[index];
      const previousHeading = Number(marker.dataset.heading || shipType.heading);
      const nextHeading = setHeadingBetween(shipType, from, to, { commit: true });
      if (Math.abs(nextHeading - previousHeading) > 1) await wait(TURN_DURATION);
      const movement = marker.animate([
        { left: `${from.x}px`, top: `${from.y}px` },
        { left: `${to.x}px`, top: `${to.y}px` }
      ], {
        duration: Math.max(300, Math.hypot(to.x - from.x, to.y - from.y) * 2.1),
        easing: "linear",
        fill: "forwards"
      });
      await movement.finished;
      positionMarkerAtPoint(marker, to);
      movement.cancel();
    }
    positionMarker(marker, targetCell.column, targetCell.row);
    shipType.column = targetCell.column;
    shipType.row = targetCell.row;
    shipType.moved = true;
    marker.classList.remove("is-moving");
    isAnimating = false;
    clearTacticalHighlights();
    markSelectedOrigin(shipType);
    updateDetailPanel(shipType, "Movement complete");
    unitReadout.textContent = `${shipType.code} · Movement complete`;
  }

  function createEffect(className, center) {
    const effect = document.createElement("span");
    effect.className = `combat-effect ${className}`;
    effect.style.left = `${center.x}px`;
    effect.style.top = `${center.y}px`;
    map.appendChild(effect);
    return effect;
  }

  async function animateVolley(shipType, targetKey) {
    const origin = cellCenter(shipType.column, shipType.row);
    const target = parseCellKey(targetKey);
    const destination = cellCenter(target.column, target.row);
    const flash = createEffect("muzzle-flash", origin);
    flash.animate([
      { opacity: 0, transform: "translate(-50%, -50%) scale(.2)" },
      { opacity: 1, transform: "translate(-50%, -50%) scale(1.2)", offset: 0.35 },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.8)" }
    ], { duration: 420, easing: "ease-out" }).finished.finally(() => flash.remove());

    const shots = [0, 110, 220].map(async (delay, index) => {
      await wait(delay);
      const shell = createEffect("volley-shell", origin);
      shell.style.marginTop = `${(index - 1) * 5}px`;
      const animation = shell.animate([
        { left: `${origin.x}px`, top: `${origin.y}px`, opacity: 1 },
        { left: `${destination.x}px`, top: `${destination.y}px`, opacity: 1 }
      ], { duration: 520, easing: "cubic-bezier(.35,.05,.75,.95)", fill: "forwards" });
      await animation.finished;
      shell.remove();
    });
    await Promise.all(shots);

    const navalTarget = shipTypes.some((ship) => ship.code !== shipType.code && cellKey(ship.column, ship.row) === targetKey);
    const impactClass = landCells.has(targetKey) || navalTarget ? "impact-explosion" : "impact-splash";
    const impact = createEffect(impactClass, destination);
    const impactAnimation = impact.animate([
      { opacity: 0, transform: "translate(-50%, -50%) scale(.15)" },
      { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.35 },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.65)" }
    ], { duration: 800, easing: "ease-out", fill: "forwards" });
    await impactAnimation.finished;
    impact.remove();
  }

  async function fireVolley(targetKey) {
    if (!selectedUnit || selectedUnit.attacked || !attackCells.has(targetKey) || isAnimating) return;
    isAnimating = true;
    mode = null;
    const shipType = selectedUnit;
    setMarkerHeading(shipType, parseCellKey(targetKey), { broadside: true, commit: true });
    clearTacticalHighlights();
    markSelectedOrigin(shipType);
    updateDetailPanel(shipType, "Firing volley");
    unitReadout.textContent = `${shipType.code} · Firing volley`;
    await wait(TURN_DURATION);
    await animateVolley(shipType, targetKey);
    shipType.attacked = true;
    isAnimating = false;
    updateDetailPanel(shipType, "Volley complete");
    unitReadout.textContent = `${shipType.code} · Volley complete`;
    if (!shipType.moved) showMovementArea(shipType);
    else markSelectedOrigin(shipType);
  }

  function handleTileClick(key) {
    if (ignoreNextTileClick) {
      ignoreNextTileClick = false;
      return;
    }
    if (mode === "attack" && attackCells.has(key)) {
      fireVolley(key);
    } else if (mode === "move" && reachableState?.distance.has(key)) {
      moveSelectedUnit(key);
    }
  }

  function advanceTurn() {
    if (isAnimating) return;
    shipTypes.forEach((ship) => {
      ship.moved = false;
      ship.attacked = false;
    });
    currentTurn += 1;
    turnNumber.textContent = String(currentTurn);
    deselectUnit();
    unitReadout.textContent = `Turn ${currentTurn} · All units ready`;
  }

  function setScale(nextScale, preserveCenter = true) {
    const oldScale = scale;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / oldScale;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / oldScale;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(nextScale * 100) / 100));
    const scaledWidth = MAP_WIDTH * scale;
    const scaledHeight = MAP_HEIGHT * scale;
    stage.style.width = `${Math.max(viewport.clientWidth, scaledWidth)}px`;
    stage.style.height = `${Math.max(viewport.clientHeight, scaledHeight)}px`;
    map.style.left = `${Math.max(0, (viewport.clientWidth - scaledWidth) / 2)}px`;
    map.style.top = `${Math.max(0, (viewport.clientHeight - scaledHeight) / 2)}px`;
    map.style.transform = `scale(${scale})`;
    if (preserveCenter) {
      requestAnimationFrame(() => {
        viewport.scrollLeft = centerX * scale - viewport.clientWidth / 2;
        viewport.scrollTop = centerY * scale - viewport.clientHeight / 2;
      });
    }
  }

  function resetView() {
    setScale(1, false);
    requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (MAP_WIDTH - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (MAP_HEIGHT - viewport.clientHeight) / 2);
    });
  }

  function stopDragging(event) {
    if (!dragState) return;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (dragState.moved) {
      ignoreNextTileClick = true;
      window.setTimeout(() => { ignoreNextTileClick = false; }, 0);
    }
    dragState = null;
    viewport.classList.remove("is-dragging");
  }

  detailClose.addEventListener("click", deselectUnit);
  nextTurnButton.addEventListener("click", advanceTurn);
  viewport.addEventListener("contextmenu", (event) => event.preventDefault());
  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    setScale(scale + (event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP));
  }, { passive: false });
  viewport.addEventListener("keydown", (event) => {
    if (event.key === "+" || event.key === "=") setScale(scale + SCALE_STEP);
    else if (event.key === "-") setScale(scale - SCALE_STEP);
    else if (event.key === "0") resetView();
    else if (event.key === "Escape") deselectUnit();
  });
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest(".map-unit")) return;
    dragState = { x: event.clientX, y: event.clientY, scrollLeft: viewport.scrollLeft, scrollTop: viewport.scrollTop, moved: false };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;
    if (!dragState.moved && Math.abs(deltaX) + Math.abs(deltaY) > 5) {
      dragState.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add("is-dragging");
    }
    if (!dragState.moved) return;
    viewport.scrollLeft = dragState.scrollLeft - deltaX;
    viewport.scrollTop = dragState.scrollTop - deltaY;
  });
  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);
  window.addEventListener("resize", () => setScale(scale, false));

  renderMap();
  resetView();
})();
