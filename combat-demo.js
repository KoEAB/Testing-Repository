(function () {
  "use strict";

  const concealmentDemo = document.body.dataset.mode === "concealment";
  const MAPS = {
    "northern-lights": { name: "Northern Lights", kilometers: 48, columns: 56, rows: 48, land: "#3c424c", sea: "#010713" },
    "northern-waters": { name: "Northern Waters", kilometers: 42, columns: 49, rows: 42, land: "#5d5a51", sea: "#06272e" },
    trap: { name: "Trap", kilometers: 42, columns: 49, rows: 42, land: "#4c522c", sea: "#103c59" },
    "two-brothers": { name: "Two Brothers", kilometers: 42, columns: 49, rows: 42, land: "#4d4e3c", sea: "#163c3d" }
  };
  const TRAINING_MAP = { name: "Training Waters", kilometers: 48, columns: 56, rows: 48, land: "#56664b", sea: "#0b344a" };
  let activeMap = concealmentDemo ? TRAINING_MAP : MAPS["northern-lights"];
  let COLUMNS = activeMap.columns;
  let ROWS = activeMap.rows;
  const HEX_WIDTH = 128;
  const HEX_HEIGHT = 112;
  const COLUMN_STEP = 96;
  let MAP_WIDTH = (COLUMNS - 1) * COLUMN_STEP + HEX_WIDTH;
  let MAP_HEIGHT = ROWS * HEX_HEIGHT + HEX_HEIGHT / 2;
  const MIN_FIT_RATIO = 0.9;
  const MAX_SCALE = 2.2;
  const ZOOM_FACTOR = 1.08;
  const MOVE_RANGE = 5;
  const AIM_RANGE = 3;
  const ATTACK_RANGE = 7;
  const TORPEDO_RANGE = 4;
  const TURN_DURATION = 300;
  const DEFAULT_CONCEALMENT = 10;
  const MIN_AP_SHELL_VELOCITY = 701;
  const MAX_AP_SHELL_VELOCITY = 914;
  const DEFAULT_TARGET_SPEED_KNOTS = 29.5;
  const ATTACK_CODES = new Set(["DD", "DE", "CL", "CA", "CB", "BC", "BB", "BBV", "BM", "CV"]);
  const TORPEDO_CODES = new Set(["SS", "SSV", "DD", "DE"]);
  const SIZE_RANK = { SS: 1, SSV: 1, DD: 2, DE: 2, CL: 3, CA: 3, BM: 3, AR: 3, CVE: 3, CVL: 3, CB: 4, BC: 4, CV: 4, BB: 5, BBV: 5 };
  const NO_CITADEL_CODES = new Set(["DD", "DE", "SS", "SSV"]);
  const MAIN_GUN_CALIBER_MM = { DD: 127, DE: 127, CL: 152, CA: 203, CB: 305, BC: 356, BB: 406, BBV: 356, BM: 305, CV: 127 };
  const WRECK_CLASSIFICATION = {
    SS: "Subs", SSV: "Subs",
    DD: "Light", DE: "Light",
    CL: "Med", CA: "Med", AR: "Med", BM: "Med", CVE: "Med", CVL: "Med",
    BB: "Heavy", CB: "Heavy", BBV: "Heavy", CV: "Heavy",
    BC: "Heavy"
  };
  const WRECK_TURNS = { Subs: 0, Light: 1, Med: 2, Heavy: 3 };
  const UNIT_STATS = {
    SS: { health: 70, torpedo: 110 }, SSV: { health: 80, torpedo: 100 },
    DD: { health: 100, gun: 35, torpedo: 85 }, DE: { health: 110, gun: 30, torpedo: 75 },
    CL: { health: 180, gun: 45 }, CA: { health: 240, gun: 60 }, CB: { health: 320, gun: 75 },
    BC: { health: 380, gun: 85 }, BB: { health: 450, gun: 100 }, BBV: { health: 430, gun: 95 },
    CV: { health: 360, gun: 20 }, CVL: { health: 280 }, CVE: { health: 220 },
    BM: { health: 200, gun: 55 }, AR: { health: 180 }
  };

  const unitTemplates = new Map([
    ["SS", { label: "Submarine", group: "submarine" }], ["SSV", { label: "Aviation submarine", group: "submarine" }],
    ["DD", { label: "Destroyer", group: "escort" }], ["DE", { label: "Destroyer escort", group: "escort" }],
    ["CL", { label: "Light cruiser", group: "cruiser" }], ["CA", { label: "Heavy cruiser", group: "cruiser" }],
    ["CB", { label: "Large cruiser", group: "cruiser" }], ["BC", { label: "Battlecruiser", group: "capital" }],
    ["BB", { label: "Battleship", group: "capital" }], ["BBV", { label: "Aviation battleship", group: "capital" }],
    ["CV", { label: "Aircraft carrier", group: "aviation" }], ["CVL", { label: "Light aircraft carrier", group: "aviation" }],
    ["CVE", { label: "Escort aircraft carrier", group: "aviation" }], ["BM", { label: "Monitor", group: "coastal" }],
    ["AR", { label: "Repair ship", group: "support" }],
    ["uss-north-carolina", { code: "BB", label: "USS North Carolina", group: "capital", ...window.SHIP_COMBAT_DATA["USS North Carolina"] }],
    ["uss-new-orleans", { code: "CA", label: "USS New Orleans", group: "cruiser", ...window.SHIP_COMBAT_DATA["USS New Orleans"] }],
    ["uss-helena", { code: "CL", label: "USS Helena", group: "cruiser", ...window.SHIP_COMBAT_DATA["USS Helena"] }],
    ["uss-des-moines", { code: "CA", label: "USS Des Moines", group: "cruiser", ...window.SHIP_COMBAT_DATA["USS Des Moines"] }],
    ["uss-fletcher", { code: "DD", label: "USS Fletcher", group: "escort", ...window.SHIP_COMBAT_DATA["USS Fletcher"] }]
  ].map(([code, details]) => [code, { code, ...details }]));
  const shipTypes = concealmentDemo ? [
    ["uss-fletcher", "friendly", 17, 24], ["uss-new-orleans", "friendly", 15, 25], ["uss-north-carolina", "friendly", 14, 18],
    ["uss-fletcher", "enemy", 38, 30], ["uss-new-orleans", "enemy", 43, 27], ["uss-north-carolina", "enemy", 34, 27]
  ].map(([key, team, column, row], index) => createUnitState({ ...unitTemplates.get(key), column, row }, `${team}-${key}-${index}`, team)) : [];
  let unitSequence = shipTypes.length;

  function actionLayout(code) {
    if (code === "DD" || code === "DE") return ["move", "gun", "torpedo"];
    if (code === "SS") return ["move", "torpedo"];
    if (code === "SSV") return ["move", "torpedo", "air"];
    if (code === "CV") return ["move", "gun", "air"];
    if (code === "CVL" || code === "CVE") return ["move", "air"];
    if (code === "BBV") return ["move", "gun", "air"];
    if (["CL", "CA", "CB", "BC", "BB", "BM"].includes(code)) return ["move", "gun"];
    return ["move"];
  }

  function createUnitState(ship, id, team) {
    const stats = UNIT_STATS[ship.code];
    return {
      ...ship,
      id,
      team,
      heading: 0,
      moved: false,
      attacked: false,
      torpedoed: false,
      airUsed: false,
      health: ship.health ?? stats.health,
      maxHealth: ship.health ?? stats.health,
      speedKnots: ship.speedKnots ?? null,
      movementRange: ship.movementRange ?? MOVE_RANGE,
      apShellVelocity: ship.apShellVelocity ?? null,
      heShellVelocity: ship.heShellVelocity ?? ship.apShellVelocity ?? null,
      heAlphaDamage: ship.heAlphaDamage ?? Math.round((ship.alphaDamage ?? ship.gunDamage ?? stats.gun ?? 0) * 0.6),
      mainGunCaliberMm: ship.mainGunCaliberMm ?? MAIN_GUN_CALIBER_MM[ship.code] ?? null,
      gunReloadPending: false,
      gunDamage: ship.gunDamage ?? stats.gun ?? 0,
      shellType: "AP",
      shellCount: ship.shellCount ?? (stats.gun ? 3 : 0),
      alphaDamage: ship.alphaDamage ?? ship.gunDamage ?? stats.gun ?? 0,
      lastSalvo: null,
      torpedoDamage: ship.torpedoDamage ?? stats.torpedo ?? 0,
      gunRange: ship.gunRange || ATTACK_RANGE,
      gunAttacksPerTurn: ship.gunAttacksPerTurn || 1,
      gunAttacksRemaining: ship.gunAttacksPerTurn || 1,
      torpedoRange: ship.torpedoRange || TORPEDO_RANGE,
      torpedoReloadDuration: ship.torpedoReloadDuration || 0,
      torpedoReloadRemaining: 0,
      concealmentRange: ship.concealmentRange || DEFAULT_CONCEALMENT,
      angleWhenFiring: null,
      broadsideWhenFiring: null,
      sunkTurn: null,
      wreckClassification: null,
      wreckTurnsRemaining: null,
      actions: actionLayout(ship.code)
    };
  }

  const trainingIslandShapes = [
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
  let baseLandCells = new Set();
  const terrainEdits = new Map();
  const paintedTerrainCells = new Map();

  function buildTrainingLand() {
    for (let column = 0; column < COLUMNS; column += 1) {
      for (let row = 0; row < ROWS; row += 1) {
        const isLand = trainingIslandShapes.some((island, index) => {
          const x = (column - island.column) / island.width;
          const y = (row - island.row) / island.height;
          const edgeVariation = ((column * 17 + row * 29 + index * 11) % 9 - 4) * 0.035;
          return x * x + y * y < 1 + edgeVariation;
        });
        if (isLand && !(row === 24 && column >= 17 && column <= 32)) landCells.add(`${column},${row}`);
      }
    }
  }

  const viewport = document.querySelector("#hex-map-viewport");
  const tacticalBoard = document.querySelector(".tactical-board");
  const stage = document.querySelector("#hex-map-stage");
  const map = document.querySelector("#hex-map");
  const unitReadout = document.querySelector("#unit-readout");
  const detailPanel = document.querySelector("#unit-detail-panel");
  const detailCode = document.querySelector("#unit-detail-code");
  const detailName = document.querySelector("#unit-detail-name");
  const detailCategory = document.querySelector("#unit-detail-category");
  const detailPosition = document.querySelector("#unit-detail-position");
  const detailHealth = document.querySelector("#unit-detail-health");
  const detailSpeed = document.querySelector("#unit-detail-speed");
  const detailConcealment = document.querySelector("#unit-detail-concealment");
  const detailMovement = document.querySelector("#unit-detail-movement");
  const detailAttack = document.querySelector("#unit-detail-attack");
  const detailAmmo = document.querySelector("#unit-detail-ammo");
  const detailGunArcs = document.querySelector("#unit-detail-gun-arcs");
  const detailSalvo = document.querySelector("#unit-detail-salvo");
  const detailShellVelocity = document.querySelector("#unit-detail-shell-velocity");
  const detailLastSalvo = document.querySelector("#unit-detail-last-salvo");
  const detailTorpedo = document.querySelector("#unit-detail-torpedo");
  const detailStatus = document.querySelector("#unit-detail-status");
  const detailInstruction = document.querySelector("#unit-detail-instruction");
  const detailTurrets = document.querySelector("#unit-detail-turrets");
  const detailTurretCount = document.querySelector("#unit-detail-turret-count");
  const detailTurretCircles = document.querySelector("#unit-detail-turret-circles");
  const detailClose = document.querySelector("#unit-detail-close");
  const detailCollapse = document.querySelector("#unit-detail-collapse");
  const detailHeading = document.querySelector(".unit-detail-heading");
  const nextTurnButton = document.querySelector("#next-turn");
  const turnNumber = document.querySelector("#turn-number");
  const gunOrderButton = document.querySelector("#gun-order");
  const torpedoOrderButton = document.querySelector("#torpedo-order");
  const fireRemainingButton = document.querySelector("#fire-remaining-salvos");
  const apButton = document.querySelector("#load-ap-shells");
  const heButton = document.querySelector("#load-he-shells");
  const developerPanel = document.querySelector("#developer-panel");
  const developerDragHandle = document.querySelector("#developer-panel-drag");
  const mapSelector = document.querySelector("#developer-map");
  const mapSummary = document.querySelector("#map-summary");
  const mapStatusName = document.querySelector("#map-status-name");
  const developerPanelToggle = document.querySelector("#developer-panel-toggle");
  const developerTeam = document.querySelector("#developer-team");
  const developerType = document.querySelector("#developer-type");
  const developerAdd = document.querySelector("#developer-add");
  const developerInstruction = document.querySelector("#developer-instruction");
  const developerUnitLists = document.querySelector("#developer-unit-lists");
  const setupToggle = document.querySelector("#setup-mode-toggle");
  const setupExport = document.querySelector("#setup-export");
  const setupImport = document.querySelector("#setup-import");
  const setupCodeOutput = document.querySelector("#setup-code-output");
  const setupCodeInput = document.querySelector("#setup-code-input");
  const setupMessage = document.querySelector("#setup-message");
  const terrainEditToggle = document.querySelector("#terrain-edit-toggle");
  const terrainBrushLand = document.querySelector("#terrain-brush-land");
  const terrainBrushSea = document.querySelector("#terrain-brush-sea");
  const terrainExport = document.querySelector("#terrain-export");
  const terrainCopy = document.querySelector("#terrain-copy");
  const terrainCodeOutput = document.querySelector("#terrain-code-output");
  const terrainEditMessage = document.querySelector("#terrain-edit-message");
  const logToggle = document.querySelector("#combat-log-toggle");
  const logPanel = document.querySelector("#combat-log-panel");
  const logClose = document.querySelector("#combat-log-close");
  const logEntries = document.querySelector("#combat-log-entries");
  const logCount = document.querySelector("#combat-log-count");
  const tileElements = new Map();
  const unitElements = new Map();
  const concealmentOutline = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  concealmentOutline.setAttribute("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
  concealmentOutline.setAttribute("class", "concealment-outline");
  concealmentOutline.innerHTML = '<polygon data-range="concealment" fill="none" stroke="white" stroke-width="3" stroke-dasharray="12 9" />' +
    '<polygon data-range="gun" fill="none" stroke="#ef6c63" stroke-width="3" stroke-dasharray="12 9" />' +
    '<polygon data-range="torpedo" fill="none" stroke="#57dce8" stroke-width="3" stroke-dasharray="12 9" />';
  concealmentOutline.setAttribute("hidden", "");
  concealmentOutline.style.display = "none";
  let scale = 1;
  let dragState = null;
  let detailDragState = null;
  let developerDragState = null;
  let ignoreNextTileClick = false;
  let selectedUnit = null;
  let inspectedEnemy = null;
  let reachableState = null;
  let attackCells = new Set();
  let aimState = null;
  let mode = null;
  let isAnimating = false;
  let currentTurn = 1;
  let placementOrder = null;
  let setupMode = false;
  let terrainMode = false;
  let terrainBrush = "land";

  function recordEvent(message) {
    const item = document.createElement("li");
    const turn = document.createElement("time");
    turn.textContent = `Turn ${currentTurn}`;
    const description = document.createElement("span");
    description.textContent = message;
    item.append(turn, description);
    logEntries.appendChild(item);
    logCount.textContent = String(logEntries.childElementCount);
    logEntries.scrollTop = logEntries.scrollHeight;
  }

  function setLogOpen(open) {
    logPanel.classList.toggle("is-open", open);
    logPanel.inert = !open;
    logPanel.setAttribute("aria-hidden", String(!open));
    logToggle.setAttribute("aria-expanded", String(open));
  }

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
    map.replaceChildren();
    tileElements.clear();
    unitElements.clear();
    map.style.width = `${MAP_WIDTH}px`;
    map.style.height = `${MAP_HEIGHT}px`;
    map.style.setProperty("--map-land-color", activeMap.land);
    map.style.setProperty("--map-sea-color", activeMap.sea);
    tacticalBoard.style.setProperty("--map-land-color", activeMap.land);
    tacticalBoard.style.setProperty("--map-sea-color", activeMap.sea);
    concealmentOutline.setAttribute("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
    const mapKey = Object.keys(MAPS).find((name) => MAPS[name] === activeMap);
    for (let column = 0; column < COLUMNS; column += 1) {
      for (let row = 0; row < ROWS; row += 1) {
        const key = cellKey(column, row);
        const terrain = landCells.has(key) ? "land" : "sea";
        const tile = document.createElement("button");
        tile.className = `hex-cell ${terrain}-hex terrain-variant-${(column * 5 + row * 3) % 3}`;
        if (paintedTerrainCells.get(mapKey)?.has(key)) tile.classList.add("terrain-painted");
        if (terrainEdits.get(mapKey)?.has(key)) {
          tile.classList.add(terrain === "land" ? "terrain-edited-land" : "terrain-edited-sea");
        }
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

    map.appendChild(concealmentOutline);
    shipTypes.forEach(renderUnit);
    updateDetection();
    renderDeveloperLists();
  }

  function changeMap(key, clearBoard = true) {
    const nextMap = MAPS[key];
    if (!nextMap || isAnimating) return false;
    const landRows = window.NAVAL_MAP_TERRAIN?.[key];
    if (!landRows || landRows.length !== nextMap.rows) return false;
    if (clearBoard) {
      deselectUnit();
      shipTypes.splice(0);
      if (setupCodeOutput) setupCodeOutput.value = "";
      unitSequence = 0;
      currentTurn = 1;
      turnNumber.textContent = "1";
      developerInstruction.textContent = `${nextMap.name} loaded. All deployed units were cleared.`;
    }
    activeMap = nextMap;
    COLUMNS = nextMap.columns;
    ROWS = nextMap.rows;
    MAP_WIDTH = (COLUMNS - 1) * COLUMN_STEP + HEX_WIDTH;
    MAP_HEIGHT = ROWS * HEX_HEIGHT + HEX_HEIGHT / 2;
    landCells.clear();
    landRows.forEach((columns, row) => columns.forEach((column) => landCells.add(cellKey(column, row))));
    baseLandCells = new Set(landCells);
    for (const [cell, isLand] of terrainEdits.get(key) || []) {
      if (isLand) landCells.add(cell);
      else landCells.delete(cell);
    }
    renderMap();
    resetView();
    mapSummary.textContent = `${nextMap.name} · ${nextMap.kilometers} × ${nextMap.kilometers} km · ${COLUMNS} × ${ROWS} hexes`;
    if (mapStatusName) mapStatusName.textContent = `${nextMap.name} online`;
    if (clearBoard) {
      logEntries.replaceChildren();
      logCount.textContent = "0";
    }
    recordEvent(`${nextMap.name} loaded${clearBoard ? "; deployed ships cleared" : ""}.`);
    return true;
  }

  function renderUnit(shipType) {
    const marker = document.createElement("button");
    marker.className = `map-unit team-${shipType.team}`;
    marker.type = "button";
    marker.dataset.shipType = shipType.code;
    marker.dataset.unitId = shipType.id;
    marker.dataset.heading = String(shipType.heading);
    marker.style.setProperty("--heading", `${shipType.heading}deg`);
    positionMarker(marker, shipType.column, shipType.row);
    marker.setAttribute("aria-label", `${shipType.team} ${shipType.code}: ${shipType.label}`);
    const actionSegments = shipType.actions.map((action) => `<i data-action="${action}"></i>`).join("");
    marker.innerHTML = `<span class="unit-name" aria-hidden="true"></span><span class="map-unit-icon">${renderIcon(shipType.code)}</span><span class="unit-detection-dot" aria-hidden="true"></span><span class="unit-health" aria-hidden="true"><i></i></span><span class="unit-actions" aria-hidden="true">${actionSegments}</span>`;
    marker.querySelector(".unit-name").textContent = shipType.label;
    marker.addEventListener("click", (event) => handleUnitClick(event, marker, shipType));
    marker.addEventListener("contextmenu", (event) => beginAttackMode(event, marker, shipType));
    unitElements.set(shipType.id, marker);
    map.appendChild(marker);
    refreshUnitDisplay(shipType);
  }

  function actionIsUsed(shipType, action) {
    if (shipType.health <= 0) return true;
    if (action === "move") return shipType.moved;
    if (action === "gun") return shipType.gunAttacksRemaining <= 0 || shipType.gunReloadPending;
    if (action === "torpedo") return shipType.torpedoed;
    return shipType.airUsed;
  }

  function gunsReady(ship) {
    return ship && ship.health > 0 && ATTACK_CODES.has(ship.code) &&
      ship.gunAttacksRemaining > 0 && !ship.gunReloadPending;
  }

  function loadedAlpha(ship) {
    return ship.shellType === "HE" ? ship.heAlphaDamage : ship.alphaDamage;
  }

  function loadedShellVelocity(ship) {
    return ship.shellType === "HE" ? ship.heShellVelocity : ship.apShellVelocity;
  }

  function refreshUnitDisplay(shipType) {
    const marker = unitElements.get(shipType.id);
    if (!marker) return;
    const healthPercent = Math.max(0, shipType.health / shipType.maxHealth * 100);
    marker.querySelector(".unit-health i").style.width = `${healthPercent}%`;
    const isSunk = shipType.health <= 0;
    const isDeathMarker = isSunk && shipType.wreckTurnsRemaining === 0;
    marker.classList.toggle("is-destroyed", isSunk);
    marker.classList.toggle("is-wreck", isSunk && !isDeathMarker);
    marker.classList.toggle("is-death-marker", isDeathMarker);
    marker.querySelector(".unit-health").hidden = isSunk;
    marker.querySelector(".unit-actions").hidden = isSunk;
    if (isDeathMarker) marker.setAttribute("aria-label", `${shipType.team} death marker: ${shipType.label}, sunk at ${coordinateLabel(shipType.column, shipType.row)}`);
    else if (isSunk) marker.setAttribute("aria-label", `${shipType.team} wreck: ${shipType.label}, sunk at ${coordinateLabel(shipType.column, shipType.row)}`);
    else marker.setAttribute("aria-label", `${shipType.team} ${shipType.code}: ${shipType.label}, ${shipType.health} of ${shipType.maxHealth} health`);
    marker.querySelectorAll(".unit-actions i").forEach((segment) => {
      segment.classList.toggle("is-used", actionIsUsed(shipType, segment.dataset.action));
    });
    refreshDeathMarkerVisibility();
  }

  function refreshDeathMarkerVisibility() {
    shipTypes.forEach((ship) => {
      if (ship.health > 0 || ship.wreckTurnsRemaining !== 0) return;
      const marker = unitElements.get(ship.id);
      if (!marker) return;
      const occupiedByLivingUnit = shipTypes.some((other) => other.health > 0 && cellKey(other.column, other.row) === cellKey(ship.column, ship.row));
      marker.classList.toggle("is-obscured", occupiedByLivingUnit);
    });
  }

  function hexDistance(first, second) {
    const firstR = first.row - Math.floor(first.column / 2);
    const secondR = second.row - Math.floor(second.column / 2);
    const dq = first.column - second.column;
    const dr = firstR - secondR;
    return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
  }

  function updateConcealmentOutline(ship, showWeapons = false) {
    if (!ship || ship.health <= 0) {
      concealmentOutline.setAttribute("hidden", "");
      concealmentOutline.style.display = "none";
      return;
    }
    const { x, y } = cellCenter(ship.column, ship.row);
    const ranges = {
      concealment: ship.concealmentRange,
      gun: showWeapons && ATTACK_CODES.has(ship.code) ? ship.gunRange : 0,
      torpedo: showWeapons && TORPEDO_CODES.has(ship.code) ? ship.torpedoRange : 0
    };
    Object.entries(ranges).forEach(([name, radius]) => {
      const outline = concealmentOutline.querySelector(`[data-range="${name}"]`);
      outline.style.display = radius ? "" : "none";
      if (!radius) return;
      const horizontal = radius * COLUMN_STEP + HEX_WIDTH / 2;
      const vertical = radius * HEX_HEIGHT + HEX_HEIGHT / 2;
      outline.setAttribute("points", [
        [x, y - vertical], [x + horizontal, y - vertical / 2], [x + horizontal, y + vertical / 2],
        [x, y + vertical], [x - horizontal, y + vertical / 2], [x - horizontal, y - vertical / 2]
      ].map((point) => point.join(",")).join(" "));
    });
    concealmentOutline.removeAttribute("hidden");
    concealmentOutline.style.display = "";
  }

  function updateDetection() {
    shipTypes.forEach((ship) => {
      const marker = unitElements.get(ship.id);
      if (!marker) return;
      const opponents = shipTypes.filter((other) => other.health > 0 && other.team !== ship.team);
      const detected = ship.health > 0 && opponents.some((other) => hexDistance(ship, other) <= ship.concealmentRange);
      // A ship is revealed when an opponent enters the ship's own concealment radius.
      const visibleToFriendly = ship.team !== "enemy" || ship.health <= 0 || detected;
      const wasConcealed = marker.classList.contains("is-concealed-enemy");
      marker.classList.toggle("is-detected", detected);
      marker.classList.toggle("is-concealed-enemy", concealmentDemo && ship.team === "enemy" && !visibleToFriendly);
      if (concealmentDemo && ship.team === "enemy" && marker.dataset.detectionInitialized === "true" &&
          wasConcealed !== !visibleToFriendly) {
        recordEvent(visibleToFriendly ? `Enemy contact spotted: ${ship.label}.` : `Contact lost: ${ship.label}.`);
      }
      marker.dataset.detectionInitialized = "true";
    });
  }

  function renderDeveloperLists() {
    developerUnitLists.innerHTML = ["friendly", "enemy"].map((team) => {
      const units = shipTypes.filter((ship) => ship.team === team && ship.health > 0);
      const sunkUnits = shipTypes.filter((ship) => ship.team === team && ship.health <= 0);
      const rows = units.length ? units.map((ship) => `
        <div class="developer-unit-row">
          <span><strong>${ship.code}</strong>${ship.label.startsWith("USS ") ? ` ${ship.label}` : ""} · ${coordinateLabel(ship.column, ship.row)} · ${ship.health}/${ship.maxHealth}</span>
          <button type="button" data-delete-unit="${ship.id}" aria-label="Delete ${ship.code}">×</button>
        </div>`).join("") : `<p class="developer-empty">No ${team} units</p>`;
      const sunkRows = sunkUnits.map((ship) => {
        const status = ship.wreckTurnsRemaining > 0 ? `Wreck · ${ship.wreckTurnsRemaining} turn${ship.wreckTurnsRemaining === 1 ? "" : "s"}` : "Death marker";
        return `<div class="developer-unit-row developer-sunk-row">
          <button type="button" class="developer-sunk-select" data-inspect-sunk="${ship.id}"><strong>${ship.code}</strong>${ship.label.startsWith("USS ") ? ` ${ship.label}` : ""} · ${coordinateLabel(ship.column, ship.row)} · ${status}</button>
          <button type="button" data-delete-unit="${ship.id}" aria-label="Remove ${ship.code} record">×</button>
        </div>`;
      }).join("");
      return `<section><h3>${team}</h3>${rows}${sunkRows ? `<h3 class="developer-sunk-heading">Sunk</h3>${sunkRows}` : ""}</section>`;
    }).join("");
  }

  function showPlacementArea() {
    clearTacticalHighlights();
    const occupied = occupiedCells(null);
    tileElements.forEach((tile, key) => {
      if ((setupMode || !landCells.has(key)) && !occupied.has(key)) tile.classList.add("is-placement");
    });
  }

  function beginPlacement() {
    if (isAnimating) return;
    deselectUnit();
    placementOrder = { team: developerTeam.value, code: developerType.value };
    developerInstruction.textContent = `Select an empty ${setupMode ? "hex" : "sea hex"} for the ${placementOrder.team} ${placementOrder.code}.`;
    showPlacementArea();
  }

  function placeUnit(key) {
    if (!placementOrder || (!setupMode && landCells.has(key)) || occupiedCells(null).has(key)) return;
    const template = unitTemplates.get(placementOrder.code);
    const cell = parseCellKey(key);
    const unit = createUnitState({
      ...template,
      templateId: placementOrder.code,
      column: cell.column,
      row: cell.row
    }, `${placementOrder.team}-${template.code}-${++unitSequence}`, placementOrder.team);
    shipTypes.push(unit);
    renderUnit(unit);
    updateDetection();
    developerInstruction.textContent = `${unit.team} ${unit.code} deployed at ${coordinateLabel(cell.column, cell.row)}.`;
    placementOrder = null;
    clearTacticalHighlights();
    renderDeveloperLists();
    recordEvent(`${unit.team} ${unit.label} deployed at ${coordinateLabel(cell.column, cell.row)}.`);
  }

  function setSetupMode(enabled) {
    if (isAnimating || concealmentDemo) return;
    if (enabled && terrainMode) setTerrainMode(false);
    deselectUnit();
    setupMode = enabled;
    setupToggle.textContent = enabled ? "Finish setting up" : "Enter setting up mode";
    setupToggle.setAttribute("aria-pressed", String(enabled));
    setupExport.disabled = !enabled;
    nextTurnButton.disabled = enabled;
    setupMessage.textContent = enabled
      ? "Place either side on any unoccupied hex, then generate a layout code."
      : "Setup mode lets you place units on any unoccupied hex.";
    recordEvent(enabled ? "Setup mode enabled." : "Setup mode finished.");
  }

  function setTerrainMode(enabled) {
    if (isAnimating || concealmentDemo) return;
    if (enabled && setupMode) setSetupMode(false);
    deselectUnit();
    terrainMode = enabled;
    terrainEditToggle.setAttribute("aria-pressed", String(enabled));
    terrainEditToggle.textContent = enabled ? "Finish terrain editing" : "Edit land and sea";
    viewport.classList.toggle("is-terrain-editing", enabled);
    terrainEditMessage.textContent = enabled
      ? `Painting ${terrainBrush}. Right-click or right-drag across hexes; left-drag to pan.`
      : "Select Edit land and sea, then right-click or right-drag across hexes.";
    recordEvent(enabled ? "Terrain editing enabled." : "Terrain editing finished.");
  }

  function setTerrainBrush(brush) {
    terrainBrush = brush;
    terrainBrushLand.setAttribute("aria-pressed", String(brush === "land"));
    terrainBrushSea.setAttribute("aria-pressed", String(brush === "sea"));
    if (terrainMode) terrainEditMessage.textContent = `Painting ${brush}. Right-click or right-drag across hexes; left-drag to pan.`;
  }

  function paintTerrain(key) {
    if (!terrainMode || isAnimating || !tileElements.has(key)) return;
    const isLand = terrainBrush === "land";
    const wasLand = landCells.has(key);
    if (isLand) landCells.add(key);
    else landCells.delete(key);
    const mapKey = Object.keys(MAPS).find((name) => MAPS[name] === activeMap);
    if (!terrainEdits.has(mapKey)) terrainEdits.set(mapKey, new Map());
    if (!paintedTerrainCells.has(mapKey)) paintedTerrainCells.set(mapKey, new Set());
    paintedTerrainCells.get(mapKey).add(key);
    if (baseLandCells.has(key) === isLand) terrainEdits.get(mapKey).delete(key);
    else terrainEdits.get(mapKey).set(key, isLand);
    const tile = tileElements.get(key);
    tile.classList.toggle("land-hex", isLand);
    tile.classList.toggle("sea-hex", !isLand);
    tile.classList.add("terrain-painted");
    tile.classList.toggle("terrain-edited-land", isLand && terrainEdits.get(mapKey).has(key));
    tile.classList.toggle("terrain-edited-sea", !isLand && terrainEdits.get(mapKey).has(key));
    if (isLand) tile.setAttribute("aria-disabled", "true");
    else tile.removeAttribute("aria-disabled");
    const cell = parseCellKey(key);
    tile.setAttribute("aria-label", `${coordinateLabel(cell.column, cell.row)} · ${isLand ? "land" : "sea"}`);
    terrainCodeOutput.value = "";
    if (wasLand !== isLand) recordEvent(`${coordinateLabel(cell.column, cell.row)} changed to ${terrainBrush}.`);
  }

  function exportTerrainCode() {
    const mapKey = Object.keys(MAPS).find((name) => MAPS[name] === activeMap);
    const edits = [...(terrainEdits.get(mapKey) || [])].sort(([a], [b]) => a.localeCompare(b))
      .map(([key, isLand]) => { const { column, row } = parseCellKey(key); return [column, row, isLand ? 1 : 0]; });
    const payload = { v: 1, map: mapKey, columns: COLUMNS, rows: ROWS, edits };
    terrainCodeOutput.value = `NC-T1:${btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
    terrainEditMessage.textContent = `Generated ${activeMap.name} terrain code with ${edits.length} changed hexes. Paste it into our chat.`;
  }

  function exportSetup() {
    if (!setupMode || isAnimating) return;
    const key = Object.keys(MAPS).find((mapKey) => MAPS[mapKey] === activeMap);
    const units = shipTypes.filter((ship) => ship.health > 0).map((ship) => ({
      template: ship.templateId || ship.code, team: ship.team,
      column: ship.column, row: ship.row, heading: ship.heading
    }));
    setupCodeOutput.value = `NC1:${btoa(JSON.stringify({ v: 1, map: key, units })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
    setupMessage.textContent = `Layout code generated for ${units.length} units. Copy it to save this setup.`;
  }

  async function importSetup() {
    if (isAnimating || concealmentDemo) return;
    try {
      const code = setupCodeInput.value.trim();
      if (code.length > 20000 || !/^NC1:[A-Za-z0-9_-]+$/.test(code)) throw new Error("Invalid layout code.");
      const encoded = code.slice(4).replace(/-/g, "+").replace(/_/g, "/");
      const layout = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
      const spec = MAPS[layout.map];
      if (layout.v !== 1 || !spec || !Array.isArray(layout.units) || layout.units.length > 150) throw new Error("Unsupported map or layout.");
      const positions = new Set();
      for (const unit of layout.units) {
        if (!unitTemplates.has(unit.template) || !["friendly", "enemy"].includes(unit.team) ||
            !Number.isInteger(unit.column) || unit.column < 0 || unit.column >= spec.columns ||
            !Number.isInteger(unit.row) || unit.row < 0 || unit.row >= spec.rows ||
            !Number.isFinite(unit.heading)) throw new Error("Layout contains an invalid unit.");
        const key = cellKey(unit.column, unit.row);
        if (positions.has(key)) throw new Error("Layout contains overlapping units.");
        positions.add(key);
      }
      if (!await changeMap(layout.map)) throw new Error("Map could not be loaded.");
      mapSelector.value = layout.map;
      for (const entry of layout.units) {
        const template = unitTemplates.get(entry.template);
        const unit = createUnitState({ ...template, templateId: entry.template, column: entry.column, row: entry.row },
          `${entry.team}-${template.code}-${++unitSequence}`, entry.team);
        unit.heading = entry.heading;
        shipTypes.push(unit);
        renderUnit(unit);
      }
      updateDetection();
      renderDeveloperLists();
      setSetupMode(true);
      setupMessage.textContent = `Imported ${layout.units.length} units on ${spec.name}.`;
      recordEvent(`Imported a setup with ${layout.units.length} ships.`);
    } catch (error) {
      setupMessage.textContent = error.message;
    }
  }

  function deleteUnit(id) {
    const index = shipTypes.findIndex((ship) => ship.id === id);
    if (index < 0 || isAnimating) return;
    const removed = shipTypes[index];
    if (selectedUnit?.id === id) deselectUnit();
    unitElements.get(id)?.remove();
    unitElements.delete(id);
    shipTypes.splice(index, 1);
    recordEvent(`${removed.team} ${removed.label} removed from ${coordinateLabel(removed.column, removed.row)}.`);
    refreshDeathMarkerVisibility();
    updateDetection();
    renderDeveloperLists();
    if (placementOrder) showPlacementArea();
    else if (selectedUnit && mode === "move") showMovementArea(selectedUnit);
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

  function occupiedCells(exceptId) {
    return new Set(shipTypes.filter((ship) => ship.id !== exceptId && ship.health > 0).map((ship) => cellKey(ship.column, ship.row)));
  }

  function calculateReachable(shipType) {
    const startKey = cellKey(shipType.column, shipType.row);
    const blocked = occupiedCells(shipType.id);
    const distance = new Map([[startKey, 0]]);
    const previous = new Map();
    const queue = [startKey];
    while (queue.length) {
      const currentKey = queue.shift();
      const currentDistance = distance.get(currentKey);
      if (currentDistance >= shipType.movementRange) continue;
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

  function turretGroupsForHeading(shipType, targetKey, heading) {
    const from = cellCenter(shipType.column, shipType.row);
    const target = parseCellKey(targetKey);
    const to = cellCenter(target.column, target.row);
    const bearing = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const relativeAngle = ((bearing - heading + 540) % 360) - 180;
    const offBow = Math.abs(relativeAngle);
    const groups = shipType.salvoPattern || [shipType.shellCount];
    return groups.map((shells, index) => {
      const position = shipType.turretPositions?.[index] || "all-around";
      // FFA is the bow blind sector for aft turrets; BFA is the stern blind sector for forward turrets.
      const ready = position === "forward" ? offBow < 180 - shipType.backwardFiringAngle
        : position === "aft" ? offBow > shipType.forwardFiringAngle : true;
      return { index, shells, position, ready };
    });
  }

  function updateTurretIndicators(heading = selectedUnit?.heading) {
    if (!aimState || aimState.weapon !== "gun" || !selectedUnit) {
      detailTurrets.hidden = true;
      return;
    }
    const groups = turretGroupsForHeading(selectedUnit, aimState.targetKey, heading);
    const readyShells = groups.reduce((sum, group) => sum + (group.ready ? group.shells : 0), 0);
    detailTurretCount.textContent = `${readyShells} / ${selectedUnit.shellCount} shells`;
    detailTurretCircles.replaceChildren(...groups.map((group) => {
      const circle = document.createElement("span");
      circle.className = `unit-turret-circle ${group.ready ? "is-ready" : "is-blocked"}`;
      circle.title = `Turret ${group.index + 1} · ${group.position} · ${group.ready ? "on target" : "blocked"}`;
      circle.setAttribute("role", "img");
      circle.setAttribute("aria-label", circle.title);
      return circle;
    }));
    detailTurrets.hidden = false;
  }

  function clearAimState() {
    aimState = null;
    detailTurrets.hidden = true;
    restoreCommittedFacing();
  }

  function clearTacticalHighlights() {
    tileElements.forEach((tile) => {
      tile.classList.remove("is-reachable", "is-unit-selected", "is-route", "is-attackable", "is-torpedoable", "is-placement", "is-facing-option", "is-designated-target");
      delete tile.dataset.distance;
      tile.tabIndex = -1;
    });
  }

  function markSelectedOrigin(shipType) {
    tileElements.get(cellKey(shipType.column, shipType.row))?.classList.add("is-unit-selected");
  }

  function showMovementArea(shipType) {
    clearAimState();
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

  function showAttackArea(shipType, useRemaining = false) {
    clearAimState();
    clearTacticalHighlights();
    reachableState = null;
    mode = useRemaining ? "salvo-skill" : "attack";
    markSelectedOrigin(shipType);
    attackCells = new Set([...calculateRadius(shipType, shipType.gunRange)].filter((key) =>
      !targetIsFriendly(key, shipType) && !lineOfFireBlocked(shipType, key)));
    attackCells.forEach((key) => {
      const tile = tileElements.get(key);
      tile.classList.add("is-attackable");
      tile.tabIndex = 0;
    });
  }

  function showTorpedoArea(shipType) {
    clearAimState();
    clearTacticalHighlights();
    reachableState = null;
    mode = "torpedo";
    markSelectedOrigin(shipType);
    attackCells = new Set([...calculateRadius(shipType, shipType.torpedoRange)].filter((key) =>
      !targetIsFriendly(key, shipType) && !lineOfFireBlocked(shipType, key)));
    attackCells.forEach((key) => {
      const tile = tileElements.get(key);
      tile.classList.add("is-torpedoable");
      tile.tabIndex = 0;
    });
  }

  function showFacingArea(targetKey, weapon, useRemaining = false) {
    clearTacticalHighlights();
    mode = "aim";
    aimState = { targetKey, weapon, useRemaining };
    attackCells = calculateRadius(selectedUnit, AIM_RANGE);
    markSelectedOrigin(selectedUnit);
    attackCells.forEach((key) => {
      const tile = tileElements.get(key);
      tile.classList.add("is-facing-option");
      tile.tabIndex = 0;
    });
    tileElements.get(targetKey)?.classList.add("is-designated-target");
    updateTurretIndicators();
    unitReadout.textContent = `${selectedUnit.code} · Choose a facing within ${AIM_RANGE} hexes`;
    const target = parseCellKey(targetKey);
    updateDetailPanel(selectedUnit, `Target ${coordinateLabel(target.column, target.row)} · Choose facing`);
  }

  function updateDetailPanel(shipType, status = "Awaiting orders") {
    const canAttack = ATTACK_CODES.has(shipType.code);
    const canTorpedo = TORPEDO_CODES.has(shipType.code);
    detailPanel.querySelectorAll('[data-requires="guns"]').forEach((row) => { row.hidden = !canAttack; });
    detailPanel.querySelectorAll('[data-requires="torpedoes"]').forEach((row) => { row.hidden = !canTorpedo; });
    detailCode.textContent = shipType.code;
    detailName.textContent = shipType.label;
    detailCategory.textContent = shipType.group.charAt(0).toUpperCase() + shipType.group.slice(1);
    detailPosition.textContent = coordinateLabel(shipType.column, shipType.row);
    detailHealth.textContent = `${shipType.health} / ${shipType.maxHealth}`;
    detailSpeed.textContent = shipType.speedKnots == null ? "Not specified" : `${shipType.speedKnots} knots`;
    detailConcealment.textContent = `${shipType.concealmentRange} hexes · ${unitElements.get(shipType.id)?.classList.contains("is-detected") ? "Detected" : "Undetected"}`;
    detailMovement.textContent = shipType.moved ? "Spent" : `Ready · ${shipType.movementRange} hexes`;
    const shotsRemaining = shipType.gunAttacksRemaining;
    detailAttack.textContent = canAttack
      ? (shipType.gunReloadPending ? `Reloading · ready next turn · ${shipType.gunRange} tiles`
        : shotsRemaining > 0 ? `Ready · ${shipType.gunRange} tiles · ${shotsRemaining} shot${shotsRemaining === 1 ? "" : "s"}` : `Spent · ${shipType.gunRange} tiles`)
      : "Unavailable";
    detailAmmo.textContent = canAttack ? `${shipType.shellType} loaded${shipType.gunReloadPending ? " · reloading" : ""}` : "Unavailable";
    detailGunArcs.textContent = shipType.forwardFiringAngle == null ? "Not specified"
      : `FFA ${shipType.forwardFiringAngle}° · BFA ${shipType.backwardFiringAngle}°`;
    detailSalvo.textContent = canAttack ? `${shipType.shellType} · ${shipType.shellCount} shells · ${loadedAlpha(shipType)} alpha each` : "Unavailable";
    detailShellVelocity.textContent = canAttack && loadedShellVelocity(shipType) != null ? `${loadedShellVelocity(shipType)} m/s` : "Not specified";
    detailLastSalvo.textContent = shipType.lastSalvo ? summarizeSalvo(shipType.lastSalvo) : "—";
    detailTorpedo.textContent = canTorpedo
      ? (shipType.torpedoReloadRemaining > 0
        ? `Reloading · ${shipType.torpedoReloadRemaining} turn${shipType.torpedoReloadRemaining === 1 ? "" : "s"}`
        : shipType.torpedoed ? "Spent" : `Ready · ${shipType.torpedoRange} tiles`)
      : "Unavailable";
    gunOrderButton.hidden = !canAttack;
    gunOrderButton.disabled = !gunsReady(shipType);
    torpedoOrderButton.hidden = !TORPEDO_CODES.has(shipType.code);
    torpedoOrderButton.disabled = shipType.torpedoed || shipType.torpedoReloadRemaining > 0;
    gunOrderButton.parentElement.hidden = !canAttack && !canTorpedo;
    refreshSkillButton();
    detailStatus.textContent = status;
    detailInstruction.textContent = mode === "aim"
      ? "Select a highlighted hex within 3 of this ship to set its heading, then fire at the chosen target. Hover to preview turret arcs."
      : mode === "attack" || mode === "salvo-skill"
      ? (mode === "salvo-skill" ? "Select an enemy in red range to fire every remaining salvo at it." : "Select a red hex to fire the ship's guns.")
      : mode === "torpedo"
        ? "Select a cyan hex to launch torpedoes."
        : "Hover to preview facing. Left-click to move; right-click to set facing.";
    detailPanel.hidden = false;
  }

  function refreshSkillButton() {
    const canControl = selectedUnit && !(concealmentDemo && selectedUnit.team === "enemy") && !isAnimating;
    const ready = canControl && gunsReady(selectedUnit);
    fireRemainingButton.disabled = !ready;
    fireRemainingButton.classList.toggle("is-active", ready && mode === "salvo-skill");
    fireRemainingButton.setAttribute("aria-pressed", String(Boolean(ready && mode === "salvo-skill")));
    [apButton, heButton].forEach((button) => {
      const available = canControl && selectedUnit.health > 0 && ATTACK_CODES.has(selectedUnit.code);
      const current = available && selectedUnit.shellType === button.dataset.ammo;
      button.disabled = !available;
      button.classList.toggle("is-loaded", current);
      button.setAttribute("aria-pressed", String(Boolean(current)));
    });
  }

  function loadAmmunition(type) {
    if (!selectedUnit || selectedUnit.health <= 0 || !ATTACK_CODES.has(selectedUnit.code) ||
        (concealmentDemo && selectedUnit.team === "enemy") || isAnimating || selectedUnit.shellType === type) return;
    selectedUnit.shellType = type;
    selectedUnit.gunReloadPending = true;
    showMovementArea(selectedUnit);
    refreshUnitDisplay(selectedUnit);
    updateDetailPanel(selectedUnit, `${type} selected · guns reload next turn`);
    unitReadout.textContent = `${selectedUnit.code} · ${type} selected · reloading`;
    recordEvent(`${selectedUnit.label} switched to ${type}; guns reload next turn.`);
  }

  function setMarkerHeading(shipType, targetCell, options = {}) {
    const from = cellCenter(shipType.column, shipType.row);
    const to = cellCenter(targetCell.column, targetCell.row);
    return setHeadingBetween(shipType, from, to, options);
  }

  function setHeadingBetween(shipType, from, to, options = {}) {
    const marker = unitElements.get(shipType.id);
    let heading = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
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
    const marker = unitElements.get(selectedUnit.id);
    marker.dataset.heading = String(selectedUnit.heading);
    marker.style.setProperty("--heading", `${selectedUnit.heading}deg`);
    if (mode === "aim") updateTurretIndicators(selectedUnit.heading);
  }

  function previewMovementFacing(key) {
    if (!selectedUnit || isAnimating) return;
    if (mode === "aim" && aimState && attackCells.has(key)) {
      updateTurretIndicators(setMarkerHeading(selectedUnit, parseCellKey(key)));
    } else if (mode === "move" && reachableState?.distance.has(key)) {
      setMarkerHeading(selectedUnit, parseCellKey(key));
    }
  }

  function handleTileRightClick(event, key) {
    event.preventDefault();
    if (terrainMode) {
      paintTerrain(key);
      return;
    }
    if (mode !== "move" || !selectedUnit || isAnimating || !reachableState?.distance.has(key)) return;
    const target = parseCellKey(key);
    setMarkerHeading(selectedUnit, target, { commit: true });
    updateDetailPanel(selectedUnit, `Facing ${coordinateLabel(target.column, target.row)}`);
    recordEvent(`${selectedUnit.label} turned toward ${coordinateLabel(target.column, target.row)}.`);
  }

  function queueAttackAim(targetKey, weapon, useRemaining = false) {
    if (!selectedUnit || isAnimating || !attackCells.has(targetKey) || targetIsFriendly(targetKey, selectedUnit)) return;
    if (lineOfFireBlocked(selectedUnit, targetKey)) return;
    if (weapon === "gun" && !gunsReady(selectedUnit)) return;
    if (weapon === "torpedo" && (selectedUnit.torpedoed || selectedUnit.torpedoReloadRemaining > 0 || !TORPEDO_CODES.has(selectedUnit.code))) return;
    if (useRemaining && !unitAt(targetKey, selectedUnit.id)) return;
    if (weapon === "torpedo") fireTorpedoes(targetKey);
    else showFacingArea(targetKey, weapon, useRemaining);
  }

  function confirmFacing(key) {
    if (mode !== "aim" || !aimState || !selectedUnit || isAnimating || !attackCells.has(key)) return;
    const heading = setMarkerHeading(selectedUnit, parseCellKey(key));
    const groups = aimState.weapon === "gun" ? turretGroupsForHeading(selectedUnit, aimState.targetKey, heading).filter((group) => group.ready) : [];
    if (aimState.weapon === "gun" && !groups.length) {
      updateDetailPanel(selectedUnit, "No turrets can bear from that heading");
      return;
    }
    setMarkerHeading(selectedUnit, parseCellKey(key), { commit: true });
    const order = aimState;
    aimState = null;
    detailTurrets.hidden = true;
    if (order.weapon === "gun") fireVolley(order.targetKey, order.useRemaining, groups);
    else fireTorpedoes(order.targetKey);
  }

  function handleUnitClick(event, marker, shipType) {
    event.stopPropagation();
    if (terrainMode) return;
    if (setupMode) return;
    if (isAnimating) return;
    if (shipType.health <= 0) {
      if (marker.classList.contains("is-death-marker")) showSunkDetails(shipType);
      return;
    }
    const key = cellKey(shipType.column, shipType.row);
    if (mode === "aim") {
      if (attackCells.has(key)) confirmFacing(key);
      else deselectUnit();
      return;
    }
    if ((mode === "attack" || mode === "salvo-skill" || mode === "torpedo") && selectedUnit && shipType.team !== selectedUnit.team && selectedUnit.id !== shipType.id && attackCells.has(key)) {
      queueAttackAim(key, mode === "torpedo" ? "torpedo" : "gun", mode === "salvo-skill");
      return;
    }
    if ((mode === "attack" || mode === "salvo-skill" || mode === "torpedo") && selectedUnit && shipType.team === selectedUnit.team) return;
    if (concealmentDemo && shipType.team === "enemy") {
      if (inspectedEnemy?.id === shipType.id) deselectUnit();
      else inspectEnemy(marker, shipType);
      return;
    }
    if (selectedUnit?.id === shipType.id) {
      deselectUnit();
      return;
    }
    selectUnit(marker, shipType);
  }

  function selectUnit(marker, shipType) {
    if (isAnimating) return;
    placementOrder = null;
    clearAimState();
    map.querySelectorAll(".map-unit.is-selected").forEach((unit) => unit.classList.remove("is-selected"));
    selectedUnit = shipType;
    inspectedEnemy = null;
    marker.classList.add("is-selected");
    updateConcealmentOutline(shipType);
    unitReadout.textContent = `${shipType.code} · ${shipType.label}`;
    showMovementArea(shipType);
    updateDetailPanel(shipType);
  }

  function inspectEnemy(marker, shipType) {
    deselectUnit();
    inspectedEnemy = shipType;
    marker.classList.add("is-selected");
    updateConcealmentOutline(shipType, true);
    updateDetailPanel(shipType, "Enemy contact");
    gunOrderButton.hidden = true;
    torpedoOrderButton.hidden = true;
    refreshSkillButton();
    detailInstruction.textContent = "Dashed ranges: white concealment, red guns, cyan torpedoes when equipped.";
    unitReadout.textContent = `${shipType.code} · ${shipType.label} · Enemy contact`;
  }

  function showSunkDetails(shipType) {
    deselectUnit();
    const marker = unitElements.get(shipType.id);
    marker?.classList.add("is-selected");
    updateDetailPanel(shipType, `Sunk on turn ${shipType.sunkTurn}`);
    detailMovement.textContent = "Sunk";
    detailAttack.textContent = "Unavailable";
    detailTorpedo.textContent = "Unavailable";
    gunOrderButton.hidden = true;
    torpedoOrderButton.hidden = true;
    refreshSkillButton();
    detailInstruction.textContent = shipType.wreckTurnsRemaining > 0
      ? `Wreck remains for ${shipType.wreckTurnsRemaining} more turn${shipType.wreckTurnsRemaining === 1 ? "" : "s"}.`
      : "Death marker · this ship was sunk here.";
    unitReadout.textContent = `${shipType.team} ${shipType.code} · sunk at ${coordinateLabel(shipType.column, shipType.row)}`;
  }

  function beginAttackMode(event, marker, shipType) {
    event.preventDefault();
    event.stopPropagation();
    if (terrainMode) {
      paintTerrain(cellKey(shipType.column, shipType.row));
      return;
    }
    if (setupMode) return;
    if (isAnimating || shipType.health <= 0) return;
    if (concealmentDemo && shipType.team === "enemy") {
      if (inspectedEnemy?.id === shipType.id) deselectUnit();
      else inspectEnemy(marker, shipType);
      return;
    }
    const sameShip = selectedUnit?.id === shipType.id;
    const previousMode = sameShip ? mode : null;
    if (!sameShip) selectUnit(marker, shipType);
    const gunAvailable = gunsReady(shipType);
    const torpedoesReady = TORPEDO_CODES.has(shipType.code) && !shipType.torpedoed && shipType.torpedoReloadRemaining <= 0;
    if (torpedoesReady && (!gunAvailable || previousMode === "attack" || previousMode === "salvo-skill")) {
      activateTorpedoMode();
    } else if (gunAvailable) {
      activateGunMode();
    } else {
      updateDetailPanel(shipType, "No ranged attacks available this turn");
    }
  }

  function activateGunMode() {
    if (!gunsReady(selectedUnit) || isAnimating) return;
    showAttackArea(selectedUnit);
    unitReadout.textContent = `${selectedUnit.code} · Gun range`;
    updateDetailPanel(selectedUnit, "Select firing target");
  }

  function activateTorpedoMode() {
    if (!selectedUnit || selectedUnit.torpedoed || selectedUnit.torpedoReloadRemaining > 0 || !TORPEDO_CODES.has(selectedUnit.code) || isAnimating) return;
    showTorpedoArea(selectedUnit);
    unitReadout.textContent = `${selectedUnit.code} · Torpedo range`;
    updateDetailPanel(selectedUnit, "Select torpedo target");
  }

  function activateFireRemainingSkill() {
    if (!gunsReady(selectedUnit) || (concealmentDemo && selectedUnit.team === "enemy") || isAnimating) return;
    showAttackArea(selectedUnit, true);
    unitReadout.textContent = `${selectedUnit.code} · Fire remaining salvos`;
    updateDetailPanel(selectedUnit, `Fire ${selectedUnit.gunAttacksRemaining} remaining salvo${selectedUnit.gunAttacksRemaining === 1 ? "" : "s"}`);
  }

  function deselectUnit() {
    if (isAnimating) return;
    placementOrder = null;
    clearAimState();
    selectedUnit = null;
    inspectedEnemy = null;
    updateConcealmentOutline(null);
    reachableState = null;
    attackCells.clear();
    mode = null;
    refreshSkillButton();
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

  function pointIntersectsLand(point, clearance = 18, ignoredKeys = null) {
    const approximateColumn = Math.round((point.x - HEX_WIDTH / 2) / COLUMN_STEP);
    for (let column = approximateColumn - 2; column <= approximateColumn + 2; column += 1) {
      const approximateRow = Math.round((point.y - HEX_HEIGHT / 2 - (column % 2 ? HEX_HEIGHT / 2 : 0)) / HEX_HEIGHT);
      for (let row = approximateRow - 2; row <= approximateRow + 2; row += 1) {
        const key = cellKey(column, row);
        if (!landCells.has(key) || ignoredKeys?.has(key)) continue;
        const center = cellCenter(column, row);
        const x = Math.abs(point.x - center.x);
        const y = Math.abs(point.y - center.y);
        if (y > HEX_HEIGHT / 2 + clearance) continue;
        const slopedEdge = HEX_WIDTH / 2 + clearance - (HEX_WIDTH / 4 / (HEX_HEIGHT / 2)) * Math.max(0, y - clearance);
        if (x <= slopedEdge) return true;
      }
    }
    return false;
  }

  function lineCrossesLand(from, to, clearance = 18, ignoredKeys = null) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const samples = Math.max(2, Math.ceil(distance / 14));
    for (let index = 1; index < samples; index += 1) {
      const progress = index / samples;
      if (pointIntersectsLand({
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress
      }, clearance, ignoredKeys)) return true;
    }
    return false;
  }

  function lineOfFireBlocked(ship, targetKey) {
    const target = parseCellKey(targetKey);
    return lineCrossesLand(cellCenter(ship.column, ship.row), cellCenter(target.column, target.row), 0,
      new Set([cellKey(ship.column, ship.row), targetKey]));
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
    const originLabel = coordinateLabel(shipType.column, shipType.row);
    const marker = unitElements.get(shipType.id);
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
    refreshUnitDisplay(shipType);
    refreshDeathMarkerVisibility();
    updateDetection();
    updateConcealmentOutline(shipType);
    renderDeveloperLists();
    marker.classList.remove("is-moving");
    isAnimating = false;
    clearTacticalHighlights();
    markSelectedOrigin(shipType);
    updateDetailPanel(shipType, "Movement complete");
    unitReadout.textContent = `${shipType.code} · Movement complete`;
    recordEvent(`${shipType.label} moved from ${originLabel} to ${coordinateLabel(targetCell.column, targetCell.row)}${landInWay ? " around land" : ""}.`);
  }

  function createEffect(className, center) {
    const effect = document.createElement("span");
    effect.className = `combat-effect ${className}`;
    effect.style.left = `${center.x}px`;
    effect.style.top = `${center.y}px`;
    map.appendChild(effect);
    return effect;
  }

  function unitAt(key, exceptId) {
    return shipTypes.find((ship) => ship.id !== exceptId && ship.health > 0 && cellKey(ship.column, ship.row) === key &&
      (!concealmentDemo || ship.team !== "enemy" || !unitElements.get(ship.id)?.classList.contains("is-concealed-enemy")));
  }

  function targetIsFriendly(key, attacker) {
    return Boolean(attacker && shipTypes.some((target) => target.id !== attacker.id && target.health > 0 &&
      target.team === attacker.team && cellKey(target.column, target.row) === key));
  }

  function applyDamage(target, amount, attacker) {
    if (!target || !attacker || target.team === attacker.team || target.health <= 0 || amount <= 0) return 0;
    const damageDealt = Math.min(target.health, amount);
    target.health -= damageDealt;
    if (target.health === 0) {
      target.sunkTurn = currentTurn;
      target.wreckClassification = WRECK_CLASSIFICATION[target.code] || "Heavy";
      target.wreckTurnsRemaining = WRECK_TURNS[target.wreckClassification];
    }
    refreshUnitDisplay(target);
    updateDetection();
    renderDeveloperLists();
    if (selectedUnit?.id === target.id) {
      updateDetailPanel(target, target.health > 0 ? `Hit for ${damageDealt} damage` : "Unit destroyed");
    }
    recordEvent(`${attacker.label} dealt ${damageDealt} damage to ${target.label} (${target.health}/${target.maxHealth} HP).`);
    if (target.health === 0) recordEvent(`${target.label} sunk at ${coordinateLabel(target.column, target.row)}.`);
    return damageDealt;
  }

  function northCarolinaMissChance(attacker, target, distance) {
    const concealment = attacker.concealmentRange;
    const maximum = attacker.gunRange;
    const targetSizeAdjustment = 0.02 * (3 - (SIZE_RANK[target.code] || 3));
    const closeMissChance = Math.min(0.33, Math.max(0.08,
      0.18 + 0.11 * Math.min(distance / Math.max(1, concealment), 1) + targetSizeAdjustment));
    if (distance <= concealment || maximum <= concealment) return closeMissChance;
    const missAtConcealment = Math.min(0.33, Math.max(0.08, 0.29 + targetSizeAdjustment));
    const longRangeProgress = Math.min(1, (distance - concealment) / (maximum - concealment));
    return missAtConcealment + (0.72 - missAtConcealment) * longRangeProgress;
  }

  function shellVelocityMissAdjustment(attacker) {
    const velocity = loadedShellVelocity(attacker);
    if (velocity == null) return 0;
    const velocityProgress = Math.max(0, Math.min(1,
      (velocity - MIN_AP_SHELL_VELOCITY) / (MAX_AP_SHELL_VELOCITY - MIN_AP_SHELL_VELOCITY)));
    return -0.10 * velocityProgress;
  }

  function targetSpeedMissAdjustment(target) {
    if (target.speedKnots == null) return 0;
    // 20.5–38.5 knots is the ordinary range. This smooth curve stays bounded above it.
    const speedOffset = target.speedKnots - DEFAULT_TARGET_SPEED_KNOTS;
    return 0.10 * speedOffset / (9 + Math.abs(speedOffset));
  }

  function calculateMissChance(attacker, target, distance, sternQuarter) {
    const rangeMissChance = attacker.accuracyProfile === "north-carolina"
      ? northCarolinaMissChance(attacker, target, distance)
      : Math.min(0.4, Math.max(0.12, 0.17 + 0.18 * distance / attacker.gunRange - 0.02 * ((SIZE_RANK[target.code] || 3) - 3)));
    let chance = rangeMissChance + 0.09 * sternQuarter +
      shellVelocityMissAdjustment(attacker) + targetSpeedMissAdjustment(target);
    if (attacker.accuracyProfile === "north-carolina") {
      if (distance <= attacker.concealmentRange) chance = Math.min(chance, 0.33);
      if (distance >= attacker.gunRange) chance = Math.max(chance, 0.67);
    }
    return Math.max(0.05, Math.min(0.90, chance));
  }

  function resolveApSalvo(attacker, target, shellCount = attacker.shellCount) {
    const from = cellCenter(attacker.column, attacker.row);
    const to = cellCenter(target.column, target.row);
    const incomingBearing = Math.atan2(from.y - to.y, from.x - to.x) * 180 / Math.PI;
    const relativeAngle = ((incomingBearing - target.heading) % 360 + 540) % 360 - 180;
    const aspectRadians = Math.abs(relativeAngle) * Math.PI / 180;
    const broadside = Math.sin(aspectRadians) ** 2;
    const bowQuarter = Math.max(0, Math.sin(2 * aspectRadians));
    const sternQuarter = Math.max(0, -Math.sin(2 * aspectRadians));
    const sizeAdvantage = Math.max(0, (SIZE_RANK[attacker.code] || 3) - (SIZE_RANK[target.code] || 3));
    const sizeDisadvantage = Math.max(0, (SIZE_RANK[target.code] || 3) - (SIZE_RANK[attacker.code] || 3));
    const angleFromEnd = Math.min(Math.abs(relativeAngle), 180 - Math.abs(relativeAngle));
    const distance = hexDistance(attacker, target);
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
    const citadelChance = NO_CITADEL_CODES.has(target.code) ? 0 : citadelExposure * (
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
      if (Math.random() < missChance) return { outcome: "miss", damage: 0 };
      const roll = Math.random();
      if (shellType === "HE") return roll < heNonPenChance
        ? { outcome: "non-penetration", damage: 0 }
        : { outcome: "penetration", damage: Math.round(attacker.heAlphaDamage / 3) };
      if (roll < ricochetChance) return { outcome: "ricochet", damage: 0 };
      if (roll < ricochetChance + nonPenChance) return { outcome: "non-penetration", damage: 0 };
      if (roll < ricochetChance + nonPenChance + citadelChance) return { outcome: "citadel", damage: attacker.alphaDamage };
      if (roll < ricochetChance + nonPenChance + citadelChance + overPenChance) return { outcome: "overpenetration", damage: Math.round(attacker.alphaDamage * 0.1) };
      return { outcome: "penetration", damage: Math.round(attacker.alphaDamage / 3) };
    });
    return { shellType, targetId: target.id, impactAngle: relativeAngle, shells, totalDamage: shells.reduce((sum, shell) => sum + shell.damage, 0), damageDealt: 0 };
  }

  function summarizeSalvo(salvo) {
    const counts = salvo.shells.reduce((totals, shell) => {
      totals[shell.outcome] = (totals[shell.outcome] || 0) + 1;
      return totals;
    }, {});
    const labels = { citadel: "citadel", penetration: "pen", overpenetration: "overpen", "non-penetration": "non-pen", ricochet: "ricochet", miss: "miss" };
    const results = Object.entries(labels).filter(([outcome]) => counts[outcome]).map(([outcome, label]) => `${counts[outcome]} ${label}`);
    return `${salvo.damageDealt ?? 0} damage · ${results.join(", ")}`;
  }

  function showDamagePopup(center, amount) {
    const popup = createEffect("damage-popup", center);
    popup.textContent = amount > 0 ? `−${amount}` : "0";
    popup.animate([
      { opacity: 0, transform: "translate(-50%, -50%) translateY(0) scale(.7)" },
      { opacity: 1, transform: "translate(-50%, -50%) translateY(-18px) scale(1.1)", offset: 0.25 },
      { opacity: 0, transform: "translate(-50%, -50%) translateY(-55px) scale(1)" }
    ], { duration: 1050, easing: "ease-out" }).finished.finally(() => popup.remove());
  }

  async function animateVolley(shipType, targetKey, firingGroups, preparedSalvo = null) {
    if (targetIsFriendly(targetKey, shipType)) return;
    const origin = cellCenter(shipType.column, shipType.row);
    const target = parseCellKey(targetKey);
    const destination = cellCenter(target.column, target.row);
    const navalTarget = unitAt(targetKey, shipType.id);
    const groups = firingGroups || (shipType.salvoPattern || [shipType.shellCount]).map((shells, index) => ({ shells, index }));
    const shellCount = groups.reduce((sum, group) => sum + group.shells, 0);
    const shellFlightMs = Math.max(250, 440 * MIN_AP_SHELL_VELOCITY / (loadedShellVelocity(shipType) ?? MIN_AP_SHELL_VELOCITY));
    const salvo = preparedSalvo || (navalTarget ? resolveApSalvo(shipType, navalTarget, shellCount) : {
      shellType: shipType.shellType, targetId: null, impactAngle: null,
      shells: Array.from({ length: shellCount }, () => ({ outcome: "miss", damage: 0 })),
      totalDamage: 0, damageDealt: 0
    });
    shipType.lastSalvo = salvo;
    recordEvent(`${shipType.label} fired ${salvo.shellType} at ${navalTarget?.label || coordinateLabel(target.column, target.row)}.`);
    const shots = [];
    groups.forEach((group, groupIndex) => {
      const groupSize = group.shells;
      const groupStart = groupIndex * (shipType.salvoGroupGapMs ?? 170);
      shots.push((async () => {
        await wait(groupStart);
        const flash = createEffect("muzzle-flash", origin);
        await flash.animate([
          { opacity: 0, transform: "translate(-50%, -50%) scale(.2)" },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1.2)", offset: 0.35 },
          { opacity: 0, transform: "translate(-50%, -50%) scale(1.8)" }
        ], { duration: 150, easing: "ease-out" }).finished;
        flash.remove();
      })());
      for (let index = 0; index < groupSize; index += 1) {
        const launchDelay = groupStart + index * 35;
        const offset = (index - (groupSize - 1) / 2) * 5 +
          (groupSize === 1 ? (group.index - ((shipType.salvoPattern?.length || groups.length) - 1) / 2) * 3 : 0);
        shots.push((async () => {
          await wait(launchDelay);
          const shell = createEffect("volley-shell", origin);
          shell.style.marginTop = `${offset}px`;
          const animation = shell.animate([
            { left: `${origin.x}px`, top: `${origin.y}px`, opacity: 1 },
            { left: `${destination.x}px`, top: `${destination.y}px`, opacity: 1 }
          ], { duration: shellFlightMs, easing: "cubic-bezier(.35,.05,.75,.95)", fill: "forwards" });
          await animation.finished;
          shell.remove();
        })());
      }
    });
    await Promise.all(shots);

    const hit = salvo.shells.some((shell) => shell.outcome !== "miss");
    const impactClass = landCells.has(targetKey) || (navalTarget && hit)
      ? (salvo.shellType === "HE" ? "impact-he-explosion" : "impact-explosion") : "impact-splash";
    const impact = createEffect(impactClass, destination);
    const impactAnimation = impact.animate([
      { opacity: 0, transform: "translate(-50%, -50%) scale(.15)" },
      { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.35 },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.65)" }
    ], { duration: 550, easing: "ease-out", fill: "forwards" });
    if (navalTarget && hit && navalTarget.health > 0) {
      salvo.damageDealt = applyDamage(navalTarget, salvo.totalDamage, shipType);
      showDamagePopup(destination, salvo.damageDealt);
    }
    await impactAnimation.finished;
    impact.remove();
    recordEvent(`${shipType.label} salvo result: ${summarizeSalvo(salvo)}.`);
  }

  async function fireVolley(targetKey, useRemaining = false, firingGroups) {
    if (!gunsReady(selectedUnit) || !firingGroups?.length || targetIsFriendly(targetKey, selectedUnit) || isAnimating) return;
    const initialTarget = unitAt(targetKey, selectedUnit.id);
    if (useRemaining && (!initialTarget || initialTarget.team === selectedUnit.team)) return;
    isAnimating = true;
    mode = null;
    const shipType = selectedUnit;
    refreshSkillButton();
    const target = parseCellKey(targetKey);
    const from = cellCenter(shipType.column, shipType.row);
    const to = cellCenter(target.column, target.row);
    const targetBearing = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const angleDifference = targetBearing - shipType.heading;
    const relativeAngle = ((angleDifference % 360) + 540) % 360 - 180;
    shipType.angleWhenFiring = relativeAngle;
    shipType.broadsideWhenFiring = relativeAngle >= 0 ? "right" : "left";
    clearTacticalHighlights();
    markSelectedOrigin(shipType);
    await wait(TURN_DURATION);
    const salvoCount = useRemaining ? shipType.gunAttacksRemaining : 1;
    const volleys = [];
    const targetHealthAtStart = initialTarget?.health ?? 0;
    let projectedDamage = 0;
    for (let index = 0; index < salvoCount; index += 1) {
      // Shell results are determined at launch. Stop before another salvo if the ones
      // already launched will sink the target, even while their animations are in flight.
      if (useRemaining && (initialTarget.health <= 0 || projectedDamage >= targetHealthAtStart)) break;
      const preparedSalvo = useRemaining
        ? resolveApSalvo(shipType, initialTarget, firingGroups.reduce((sum, group) => sum + group.shells, 0))
        : null;
      if (preparedSalvo) projectedDamage += preparedSalvo.totalDamage;
      shipType.gunAttacksRemaining -= 1;
      shipType.attacked = shipType.gunAttacksRemaining <= 0;
      refreshUnitDisplay(shipType);
      updateDetailPanel(shipType, useRemaining ? `Firing salvo ${index + 1} of ${salvoCount}` : "Firing volley");
      unitReadout.textContent = `${shipType.code} · Salvo ${index + 1} of ${salvoCount}`;
      volleys.push(animateVolley(shipType, targetKey, firingGroups, preparedSalvo));
      if (useRemaining && index + 1 < salvoCount && projectedDamage < targetHealthAtStart) await wait(180);
    }
    await Promise.all(volleys);
    renderDeveloperLists();
    isAnimating = false;
    if (shipType.gunAttacksRemaining > 0) showAttackArea(shipType);
    else if (!shipType.moved) showMovementArea(shipType);
    else markSelectedOrigin(shipType);
    const remainingAfterSink = useRemaining && initialTarget.health <= 0 && shipType.gunAttacksRemaining > 0;
    const status = remainingAfterSink
      ? `Target sunk · ${shipType.gunAttacksRemaining} salvo${shipType.gunAttacksRemaining === 1 ? "" : "s"} ready this turn`
      : useRemaining ? "Salvo sequence complete" : "Volley complete";
    updateDetailPanel(shipType, status);
    unitReadout.textContent = `${shipType.code} · ${status}`;
  }

  async function animateTorpedoAttack(shipType, targetKey) {
    if (targetIsFriendly(targetKey, shipType)) return;
    const origin = cellCenter(shipType.column, shipType.row);
    const targetCell = parseCellKey(targetKey);
    const destination = cellCenter(targetCell.column, targetCell.row);
    const launches = [-6, 6].map(async (offset, index) => {
      await wait(index * 90);
      const torpedo = createEffect("torpedo-wake", origin);
      torpedo.style.marginTop = `${offset}px`;
      const animation = torpedo.animate([
        { left: `${origin.x}px`, top: `${origin.y}px`, opacity: 0.3 },
        { left: `${destination.x}px`, top: `${destination.y}px`, opacity: 1 }
      ], { duration: 720, easing: "linear", fill: "forwards" });
      await animation.finished;
      torpedo.remove();
    });
    await Promise.all(launches);
    const navalTarget = unitAt(targetKey, shipType.id);
    const impactClass = navalTarget ? "impact-explosion" : "impact-splash";
    const impact = createEffect(impactClass, destination);
    const impactAnimation = impact.animate([
      { opacity: 0, transform: "translate(-50%, -50%) scale(.15)" },
      { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.35 },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.65)" }
    ], { duration: 800, easing: "ease-out", fill: "forwards" });
    if (navalTarget) showDamagePopup(destination, applyDamage(navalTarget, shipType.torpedoDamage, shipType));
    else recordEvent(`${shipType.label}'s torpedoes splashed at ${coordinateLabel(targetCell.column, targetCell.row)}.`);
    await impactAnimation.finished;
    impact.remove();
  }

  async function fireTorpedoes(targetKey) {
    if (!selectedUnit || selectedUnit.torpedoed || selectedUnit.torpedoReloadRemaining > 0 || targetIsFriendly(targetKey, selectedUnit) || isAnimating) return;
    isAnimating = true;
    mode = null;
    const shipType = selectedUnit;
    shipType.torpedoed = true;
    shipType.torpedoReloadRemaining = shipType.torpedoReloadDuration;
    refreshUnitDisplay(shipType);
    const targetCell = parseCellKey(targetKey);
    const from = cellCenter(shipType.column, shipType.row);
    const to = cellCenter(targetCell.column, targetCell.row);
    const bearing = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const difference = ((bearing - shipType.heading + 540) % 360) - 180;
    shipType.angleWhenFiring = difference;
    shipType.broadsideWhenFiring = difference >= 0 ? "right" : "left";
    const broadsideHeading = bearing + (difference >= 0 ? -90 : 90);
    const marker = unitElements.get(shipType.id);
    marker.dataset.heading = String(broadsideHeading);
    marker.style.setProperty("--heading", `${broadsideHeading}deg`);
    shipType.heading = broadsideHeading;
    clearTacticalHighlights();
    markSelectedOrigin(shipType);
    updateDetailPanel(shipType, "Launching torpedoes");
    unitReadout.textContent = `${shipType.code} · Launching torpedoes`;
    recordEvent(`${shipType.label} launched torpedoes at ${coordinateLabel(targetCell.column, targetCell.row)}.`);
    await wait(TURN_DURATION);
    await animateTorpedoAttack(shipType, targetKey);
    renderDeveloperLists();
    isAnimating = false;
    updateDetailPanel(shipType, "Torpedo attack complete");
    unitReadout.textContent = `${shipType.code} · Torpedo attack complete`;
    if (!shipType.moved) showMovementArea(shipType);
    else markSelectedOrigin(shipType);
  }

  function handleTileClick(key) {
    if (ignoreNextTileClick) {
      ignoreNextTileClick = false;
      return;
    }
    if (terrainMode) return;
    if (setupMode) {
      if (placementOrder) placeUnit(key);
      return;
    }
    if (mode === "aim") {
      if (attackCells.has(key)) confirmFacing(key);
      else deselectUnit();
      return;
    }
    const visibleEnemy = concealmentDemo ? shipTypes.find((ship) => ship.team === "enemy" && ship.health > 0 &&
      cellKey(ship.column, ship.row) === key && !unitElements.get(ship.id)?.classList.contains("is-concealed-enemy")) : null;
    if (placementOrder) {
      placeUnit(key);
    } else if ((mode === "attack" || mode === "salvo-skill" || mode === "torpedo") && selectedUnit && targetIsFriendly(key, selectedUnit)) {
      return;
    } else if (mode === "salvo-skill" && attackCells.has(key)) {
      queueAttackAim(key, "gun", true);
    } else if (mode === "attack" && attackCells.has(key)) {
      queueAttackAim(key, "gun");
    } else if (mode === "torpedo" && attackCells.has(key)) {
      queueAttackAim(key, "torpedo");
    } else if (mode === "move" && reachableState?.distance.has(key)) {
      moveSelectedUnit(key);
    } else if (visibleEnemy) {
      if (inspectedEnemy?.id === visibleEnemy.id) deselectUnit();
      else inspectEnemy(unitElements.get(visibleEnemy.id), visibleEnemy);
    } else if (selectedUnit && (mode === "move" || mode === "attack" || mode === "salvo-skill" || mode === "torpedo")) {
      deselectUnit();
    } else if (inspectedEnemy) {
      deselectUnit();
    }
  }

  function advanceTurn() {
    if (isAnimating || setupMode) return;
    shipTypes.forEach((ship) => {
      if (ship.health > 0) {
        ship.moved = false;
        ship.attacked = false;
        ship.gunAttacksRemaining = ship.gunAttacksPerTurn;
        ship.gunReloadPending = false;
        ship.airUsed = false;
        if (ship.torpedoReloadRemaining > 0) {
          ship.torpedoReloadRemaining -= 1;
          if (ship.torpedoReloadRemaining === 0) {
            ship.torpedoed = false;
            recordEvent(`${ship.label}'s torpedoes finished reloading.`);
          }
        } else if (!ship.torpedoReloadDuration) {
          ship.torpedoed = false;
        }
      } else if (ship.wreckTurnsRemaining > 0) {
        ship.wreckTurnsRemaining -= 1;
        if (ship.wreckTurnsRemaining === 0) recordEvent(`${ship.label}'s wreck cleared; death marker remains.`);
      }
      refreshUnitDisplay(ship);
    });
    renderDeveloperLists();
    currentTurn += 1;
    turnNumber.textContent = String(currentTurn);
    deselectUnit();
    unitReadout.textContent = `Turn ${currentTurn} · All units ready`;
    recordEvent(`Turn ${currentTurn} began.`);
  }

  function setScale(nextScale, preserveCenter = true) {
    const oldScale = scale;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2 - (parseFloat(map.style.left) || 0)) / oldScale;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2 - (parseFloat(map.style.top) || 0)) / oldScale;
    const fitScale = Math.min(viewport.clientWidth / MAP_WIDTH, viewport.clientHeight / MAP_HEIGHT) * 0.96;
    scale = Math.min(MAX_SCALE, Math.max(fitScale * MIN_FIT_RATIO, Math.round(nextScale * 10000) / 10000));
    const scaledWidth = MAP_WIDTH * scale;
    const scaledHeight = MAP_HEIGHT * scale;
    stage.style.width = `${Math.max(viewport.clientWidth, scaledWidth)}px`;
    stage.style.height = `${Math.max(viewport.clientHeight, scaledHeight)}px`;
    const mapLeft = Math.max(0, (viewport.clientWidth - scaledWidth) / 2);
    const mapTop = Math.max(0, (viewport.clientHeight - scaledHeight) / 2);
    map.style.left = `${mapLeft}px`;
    map.style.top = `${mapTop}px`;
    map.style.transform = `scale(${scale})`;
    if (preserveCenter) {
      requestAnimationFrame(() => {
        viewport.scrollLeft = centerX * scale + mapLeft - viewport.clientWidth / 2;
        viewport.scrollTop = centerY * scale + mapTop - viewport.clientHeight / 2;
      });
    }
  }

  function resetView() {
    const fit = Math.min(viewport.clientWidth / MAP_WIDTH, viewport.clientHeight / MAP_HEIGHT) * 0.96;
    setScale(fit, false);
    requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (MAP_WIDTH * scale - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (MAP_HEIGHT * scale - viewport.clientHeight) / 2);
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

  function clampDetailPanel() {
    if (!detailPanel.style.left) return;
    const maxLeft = Math.max(8, tacticalBoard.clientWidth - detailPanel.offsetWidth - 8);
    const maxTop = Math.max(8, tacticalBoard.clientHeight - detailPanel.offsetHeight - 8);
    detailPanel.style.left = `${Math.max(8, Math.min(parseFloat(detailPanel.style.left), maxLeft))}px`;
    detailPanel.style.top = `${Math.max(8, Math.min(parseFloat(detailPanel.style.top), maxTop))}px`;
  }

  function clampDeveloperPanel() {
    if (!developerPanel.style.left) return;
    const maxLeft = Math.max(8, tacticalBoard.clientWidth - developerPanel.offsetWidth - 8);
    const maxTop = Math.max(8, tacticalBoard.clientHeight - 98);
    const left = Math.max(8, Math.min(parseFloat(developerPanel.style.left), maxLeft));
    const top = Math.max(8, Math.min(parseFloat(developerPanel.style.top), maxTop));
    developerPanel.style.left = `${left}px`;
    developerPanel.style.top = `${top}px`;
    developerPanel.style.setProperty("--panel-top", `${top}px`);
  }

  detailCollapse.addEventListener("click", () => {
    const collapsed = detailPanel.classList.toggle("is-collapsed");
    detailCollapse.setAttribute("aria-expanded", String(!collapsed));
    detailCollapse.setAttribute("aria-label", collapsed ? "Expand ship details" : "Collapse ship details");
    detailCollapse.textContent = collapsed ? "+" : "−";
    clampDetailPanel();
  });
  detailHeading.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const boardRect = tacticalBoard.getBoundingClientRect();
    const panelRect = detailPanel.getBoundingClientRect();
    detailPanel.style.left = `${panelRect.left - boardRect.left}px`;
    detailPanel.style.top = `${panelRect.top - boardRect.top}px`;
    detailPanel.style.right = "auto";
    detailPanel.style.bottom = "auto";
    detailDragState = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      left: parseFloat(detailPanel.style.left), top: parseFloat(detailPanel.style.top) };
    detailHeading.setPointerCapture(event.pointerId);
    detailHeading.classList.add("is-dragging");
    event.preventDefault();
  });
  detailHeading.addEventListener("pointermove", (event) => {
    if (!detailDragState || event.pointerId !== detailDragState.pointerId) return;
    detailPanel.style.left = `${detailDragState.left + event.clientX - detailDragState.x}px`;
    detailPanel.style.top = `${detailDragState.top + event.clientY - detailDragState.y}px`;
    clampDetailPanel();
  });
  function stopDetailDragging(event) {
    if (!detailDragState || event.pointerId !== detailDragState.pointerId) return;
    if (detailHeading.hasPointerCapture(event.pointerId)) detailHeading.releasePointerCapture(event.pointerId);
    detailDragState = null;
    detailHeading.classList.remove("is-dragging");
  }
  detailHeading.addEventListener("pointerup", stopDetailDragging);
  detailHeading.addEventListener("pointercancel", stopDetailDragging);

  detailClose.addEventListener("click", deselectUnit);
  nextTurnButton.addEventListener("click", advanceTurn);
  logToggle.addEventListener("click", () => setLogOpen(!logPanel.classList.contains("is-open")));
  logClose.addEventListener("click", () => setLogOpen(false));
  gunOrderButton.addEventListener("click", activateGunMode);
  torpedoOrderButton.addEventListener("click", activateTorpedoMode);
  fireRemainingButton.addEventListener("click", activateFireRemainingSkill);
  apButton.addEventListener("click", () => loadAmmunition("AP"));
  heButton.addEventListener("click", () => loadAmmunition("HE"));
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!["e", "1", "2", "q"].includes(key) || event.altKey || event.ctrlKey || event.metaKey || event.repeat ||
        event.target.closest("input, select, textarea, [contenteditable]")) return;
    event.preventDefault();
    if (key === "1") loadAmmunition("AP");
    else if (key === "2") loadAmmunition("HE");
    else if (key === "q") advanceTurn();
    else activateFireRemainingSkill();
  });
  developerPanelToggle.addEventListener("click", () => {
    const collapsed = developerPanel.classList.toggle("is-collapsed");
    developerPanelToggle.setAttribute("aria-expanded", String(!collapsed));
    developerPanelToggle.setAttribute("aria-label", collapsed ? "Expand developer panel" : "Collapse developer panel");
    clampDeveloperPanel();
  });
  developerDragHandle?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const boardRect = tacticalBoard.getBoundingClientRect();
    const panelRect = developerPanel.getBoundingClientRect();
    developerPanel.style.left = `${panelRect.left - boardRect.left}px`;
    developerPanel.style.top = `${panelRect.top - boardRect.top}px`;
    developerDragState = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      left: parseFloat(developerPanel.style.left), top: parseFloat(developerPanel.style.top) };
    developerDragHandle.setPointerCapture(event.pointerId);
    developerDragHandle.classList.add("is-dragging");
    event.preventDefault();
  });
  developerDragHandle?.addEventListener("pointermove", (event) => {
    if (!developerDragState || event.pointerId !== developerDragState.pointerId) return;
    developerPanel.style.left = `${developerDragState.left + event.clientX - developerDragState.x}px`;
    developerPanel.style.top = `${developerDragState.top + event.clientY - developerDragState.y}px`;
    clampDeveloperPanel();
  });
  function stopDeveloperDragging(event) {
    if (!developerDragState || event.pointerId !== developerDragState.pointerId) return;
    if (developerDragHandle.hasPointerCapture(event.pointerId)) developerDragHandle.releasePointerCapture(event.pointerId);
    developerDragState = null;
    developerDragHandle.classList.remove("is-dragging");
  }
  developerDragHandle?.addEventListener("pointerup", stopDeveloperDragging);
  developerDragHandle?.addEventListener("pointercancel", stopDeveloperDragging);
  developerPanel.querySelectorAll(".developer-section").forEach((section) => section.addEventListener("toggle", clampDeveloperPanel));
  setupToggle?.addEventListener("click", () => setSetupMode(!setupMode));
  setupExport?.addEventListener("click", exportSetup);
  setupImport?.addEventListener("click", importSetup);
  terrainEditToggle?.addEventListener("click", () => setTerrainMode(!terrainMode));
  terrainBrushLand?.addEventListener("click", () => setTerrainBrush("land"));
  terrainBrushSea?.addEventListener("click", () => setTerrainBrush("sea"));
  terrainExport?.addEventListener("click", exportTerrainCode);
  terrainCopy?.addEventListener("click", async () => {
    if (!terrainCodeOutput.value) return;
    try {
      await navigator.clipboard.writeText(terrainCodeOutput.value);
      terrainEditMessage.textContent = "Terrain code copied. Paste it into our chat.";
    } catch {
      terrainCodeOutput.select();
      terrainEditMessage.textContent = "Select and copy the terrain code, then paste it into our chat.";
    }
  });
  map.addEventListener("pointerover", (event) => {
    if (terrainMode && event.buttons === 2) paintTerrain(event.target.closest(".hex-cell")?.dataset.cell);
  });
  mapSelector?.addEventListener("change", () => changeMap(mapSelector.value));
  developerAdd.addEventListener("click", beginPlacement);
  developerUnitLists.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-unit]");
    if (button) deleteUnit(button.dataset.deleteUnit);
    const sunkShip = event.target.closest("[data-inspect-sunk]");
    if (sunkShip) {
      const ship = shipTypes.find((entry) => entry.id === sunkShip.dataset.inspectSunk);
      if (ship) showSunkDetails(ship);
    }
  });
  viewport.addEventListener("contextmenu", (event) => event.preventDefault());
  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
    const notches = Math.max(-3, Math.min(3, pixels / 100));
    setScale(scale * ZOOM_FACTOR ** -notches);
  }, { passive: false });
  viewport.addEventListener("keydown", (event) => {
    if (event.key === "+" || event.key === "=") setScale(scale * ZOOM_FACTOR);
    else if (event.key === "-") setScale(scale / ZOOM_FACTOR);
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
  window.addEventListener("resize", () => { setScale(scale, false); clampDetailPanel(); clampDeveloperPanel(); });

  developerType.innerHTML = [...unitTemplates.entries()]
    .map(([templateId, ship]) => `<option value="${templateId}">${templateId.startsWith("uss-") ? ship.label : `${ship.code} · ${ship.label}`}</option>`)
    .join("");
  if (concealmentDemo) {
    buildTrainingLand();
    renderMap();
    resetView();
    mapSummary.textContent = `Training Waters · ${TRAINING_MAP.kilometers} × ${TRAINING_MAP.kilometers} km · ${COLUMNS} × ${ROWS} hexes`;
    recordEvent("Training Waters loaded. Locate the concealed enemy ships.");
  } else {
    changeMap("northern-lights", false);
  }
})();
