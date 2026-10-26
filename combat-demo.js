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
  const TURN_DURATION = 280;
  const STEP_DURATION = 360;

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
  ];

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
      if (isLand && !(row === 24 && column >= 17 && column <= 32)) {
        landCells.add(`${column},${row}`);
      }
    }
  }

  const groupColors = {
    submarine: "#78aec3",
    escort: "#8eb5c8",
    cruiser: "#d0a76d",
    capital: "#d7b568",
    aviation: "#aaa0d2",
    coastal: "#a6a17b",
    support: "#7fb093"
  };

  const viewport = document.querySelector("#hex-map-viewport");
  const stage = document.querySelector("#hex-map-stage");
  const map = document.querySelector("#hex-map");
  const zoomValue = document.querySelector("#zoom-value");
  const zoomIn = document.querySelector("#zoom-in");
  const zoomOut = document.querySelector("#zoom-out");
  const zoomReset = document.querySelector("#zoom-reset");
  const unitReadout = document.querySelector("#unit-readout");
  const detailPanel = document.querySelector("#unit-detail-panel");
  const detailCode = document.querySelector("#unit-detail-code");
  const detailName = document.querySelector("#unit-detail-name");
  const detailCategory = document.querySelector("#unit-detail-category");
  const detailPosition = document.querySelector("#unit-detail-position");
  const detailStatus = document.querySelector("#unit-detail-status");
  const detailClose = document.querySelector("#unit-detail-close");
  const tileElements = new Map();
  const unitElements = new Map();
  let scale = 1;
  let dragState = null;
  let ignoreNextTileClick = false;
  let selectedUnit = null;
  let reachableState = null;
  let isMoving = false;

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
    const submarine = '<path d="M3 24 16 16H34L43 10H57L67 16H78L94 24 78 32H67L57 38H43L34 32H16Z"/>';
    const destroyer = '<polygon points="8,8 91,24 8,40"/>';
    const cruiser = '<polygon points="8,8 43,8 28,40 8,40"/><polygon points="51,8 66,8 91,24 66,40 38,40"/>';
    const battleship = '<polygon points="8,8 37,8 22,40 8,40"/><polygon points="45,8 58,8 42,40 28,40"/><polygon points="67,8 91,24 67,40 49,40"/>';
    const carrier = '<rect x="8" y="8" width="47" height="14"/><rect x="8" y="27" width="47" height="13"/><polygon points="61,8 73,8 92,24 73,40 61,40"/>';
    const monitor = '<polygon points="7,14 21,8 68,8 92,24 68,40 21,40 7,34"/><rect x="27" y="16" width="26" height="16" rx="8"/>';
    const repairShip = '<path fill-rule="evenodd" d="M4 14 19 8H67L93 24 67 40H19L4 34 10 24ZM37 15H49V20H55V28H49V33H37V28H31V20H37Z"/>';
    const shapes = {
      SS: submarine,
      SSV: submarine,
      DD: destroyer,
      DE: destroyer,
      CL: cruiser,
      CA: cruiser,
      CB: cruiser,
      BC: battleship,
      BB: battleship,
      BBV: battleship,
      CV: carrier,
      CVL: carrier,
      CVE: carrier,
      BM: monitor,
      AR: repairShip
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
        tile.addEventListener("click", () => handleTileClick(key));
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
      marker.style.setProperty("--unit-color", groupColors[shipType.group]);
      marker.style.setProperty("--heading", "0deg");
      positionMarker(marker, shipType.column, shipType.row);
      marker.setAttribute("aria-label", `${shipType.code}: ${shipType.label}`);
      marker.innerHTML = `<span class="map-unit-icon">${renderIcon(shipType.code)}</span>`;
      marker.addEventListener("click", (event) => {
        event.stopPropagation();
        selectUnit(marker, shipType);
      });
      unitElements.set(shipType.code, marker);
      map.appendChild(marker);
    });
  }

  function positionMarker(marker, column, row) {
    const center = cellCenter(column, row);
    marker.style.left = `${center.x}px`;
    marker.style.top = `${center.y}px`;
  }

  function getNeighbors(column, row) {
    const diagonalRows = column % 2 ? [row, row + 1] : [row - 1, row];
    return [
      { column, row: row - 1 },
      { column, row: row + 1 },
      { column: column - 1, row: diagonalRows[0] },
      { column: column - 1, row: diagonalRows[1] },
      { column: column + 1, row: diagonalRows[0] },
      { column: column + 1, row: diagonalRows[1] }
    ].filter((cell) => cell.column >= 0 && cell.column < COLUMNS && cell.row >= 0 && cell.row < ROWS);
  }

  function occupiedCells(exceptCode) {
    return new Set(shipTypes.filter((shipType) => shipType.code !== exceptCode).map((shipType) => cellKey(shipType.column, shipType.row)));
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

  function clearTacticalHighlights() {
    tileElements.forEach((tile) => {
      tile.classList.remove("is-reachable", "is-unit-selected", "is-route");
      delete tile.dataset.distance;
      tile.tabIndex = -1;
    });
  }

  function showReachableArea(shipType) {
    clearTacticalHighlights();
    reachableState = calculateReachable(shipType);
    tileElements.get(reachableState.startKey)?.classList.add("is-unit-selected");
    reachableState.distance.forEach((distance, key) => {
      const tile = tileElements.get(key);
      if (!tile) return;
      tile.classList.add("is-reachable");
      tile.dataset.distance = String(distance);
      tile.tabIndex = 0;
    });
  }

  function updateDetailPanel(shipType, status = "Ready") {
    detailCode.textContent = shipType.code;
    detailName.textContent = shipType.label;
    detailCategory.textContent = shipType.group.charAt(0).toUpperCase() + shipType.group.slice(1);
    detailPosition.textContent = coordinateLabel(shipType.column, shipType.row);
    detailStatus.textContent = status;
    detailPanel.hidden = false;
  }

  function selectUnit(marker, shipType) {
    if (isMoving) return;
    map.querySelectorAll(".map-unit.is-selected").forEach((unit) => unit.classList.remove("is-selected"));
    selectedUnit = shipType;
    marker.classList.add("is-selected");
    unitReadout.textContent = `${shipType.code} · ${shipType.label}`;
    updateDetailPanel(shipType);
    showReachableArea(shipType);
  }

  function deselectUnit() {
    if (isMoving) return;
    selectedUnit = null;
    reachableState = null;
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

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function turnMarker(marker, fromCell, toCell) {
    const from = cellCenter(fromCell.column, fromCell.row);
    const to = cellCenter(toCell.column, toCell.row);
    let nextHeading = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const currentHeading = Number(marker.dataset.heading || 0);
    while (nextHeading - currentHeading > 180) nextHeading -= 360;
    while (nextHeading - currentHeading < -180) nextHeading += 360;
    marker.dataset.heading = String(nextHeading);
    marker.style.setProperty("--heading", `${nextHeading}deg`);
  }

  async function moveSelectedUnit(targetKey) {
    if (!selectedUnit || !reachableState || !reachableState.distance.has(targetKey) || isMoving) return;
    const path = buildPath(targetKey);
    if (!path.length) return;
    isMoving = true;
    const shipType = selectedUnit;
    const marker = unitElements.get(shipType.code);
    marker.classList.add("is-moving");
    reachableState.distance.forEach((distance, key) => tileElements.get(key)?.classList.remove("is-reachable"));
    path.forEach((key) => tileElements.get(key)?.classList.add("is-route"));
    updateDetailPanel(shipType, "Underway");
    unitReadout.textContent = `${shipType.code} · Moving ${path.length} hex${path.length === 1 ? "" : "es"}`;

    for (const nextKey of path) {
      const fromCell = { column: shipType.column, row: shipType.row };
      const nextCell = parseCellKey(nextKey);
      turnMarker(marker, fromCell, nextCell);
      await wait(TURN_DURATION);
      positionMarker(marker, nextCell.column, nextCell.row);
      await wait(STEP_DURATION);
      shipType.column = nextCell.column;
      shipType.row = nextCell.row;
      tileElements.get(nextKey)?.classList.remove("is-route");
      updateDetailPanel(shipType, "Underway");
    }

    marker.classList.remove("is-moving");
    isMoving = false;
    unitReadout.textContent = `${shipType.code} · ${shipType.label}`;
    updateDetailPanel(shipType, "Ready");
    showReachableArea(shipType);
  }

  function handleTileClick(key) {
    if (ignoreNextTileClick) {
      ignoreNextTileClick = false;
      return;
    }
    if (selectedUnit && reachableState?.distance.has(key)) moveSelectedUnit(key);
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
    zoomValue.value = `${Math.round(scale * 100)}%`;
    zoomValue.textContent = `${Math.round(scale * 100)}%`;
    zoomOut.disabled = scale <= MIN_SCALE;
    zoomIn.disabled = scale >= MAX_SCALE;
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
      window.setTimeout(() => {
        ignoreNextTileClick = false;
      }, 0);
    }
    dragState = null;
    viewport.classList.remove("is-dragging");
  }

  zoomIn.addEventListener("click", () => setScale(scale + SCALE_STEP));
  zoomOut.addEventListener("click", () => setScale(scale - SCALE_STEP));
  zoomReset.addEventListener("click", resetView);
  detailClose.addEventListener("click", deselectUnit);
  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    setScale(scale + (event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP));
  }, { passive: false });
  viewport.addEventListener("keydown", (event) => {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setScale(scale + SCALE_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      setScale(scale - SCALE_STEP);
    } else if (event.key === "0") {
      event.preventDefault();
      resetView();
    } else if (event.key === "Escape") {
      deselectUnit();
    }
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
