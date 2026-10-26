(function () {
  "use strict";

  const COLUMNS = 20;
  const ROWS = 12;
  const HEX_WIDTH = 128;
  const HEX_HEIGHT = 112;
  const COLUMN_STEP = 96;
  const MAP_WIDTH = (COLUMNS - 1) * COLUMN_STEP + HEX_WIDTH;
  const MAP_HEIGHT = ROWS * HEX_HEIGHT + HEX_HEIGHT / 2;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2.2;
  const SCALE_STEP = 0.1;
  const UNIT_LINE_Y = HEX_HEIGHT * 6;

  const shipTypes = [
    { code: "SS", label: "Submarine", column: 2, row: 5, group: "submarine" },
    { code: "SSV", label: "Aviation submarine", column: 3, row: 5, group: "submarine" },
    { code: "DD", label: "Destroyer", column: 4, row: 5, group: "escort" },
    { code: "DE", label: "Destroyer escort", column: 5, row: 5, group: "escort" },
    { code: "CL", label: "Light cruiser", column: 6, row: 5, group: "cruiser" },
    { code: "CA", label: "Heavy cruiser", column: 7, row: 5, group: "cruiser" },
    { code: "CB", label: "Large cruiser", column: 8, row: 5, group: "cruiser" },
    { code: "BC", label: "Battlecruiser", column: 9, row: 5, group: "capital" },
    { code: "BB", label: "Battleship", column: 10, row: 5, group: "capital" },
    { code: "BBV", label: "Aviation battleship", column: 11, row: 5, group: "capital" },
    { code: "CV", label: "Aircraft carrier", column: 12, row: 5, group: "aviation" },
    { code: "CVL", label: "Light aircraft carrier", column: 13, row: 5, group: "aviation" },
    { code: "CVE", label: "Escort aircraft carrier", column: 14, row: 5, group: "aviation" },
    { code: "BM", label: "Monitor", column: 15, row: 5, group: "coastal" },
    { code: "AR", label: "Repair ship", column: 16, row: 5, group: "support" }
  ];

  const landCells = new Set([
    "0,0", "0,1", "0,2", "0,3", "1,0", "1,1", "1,2", "1,3", "2,0", "2,1", "3,0",
    "6,1", "6,2", "7,1", "7,2", "7,3", "8,2", "8,3", "9,2",
    "16,0", "16,1", "17,0", "17,1", "17,2", "18,0", "18,1", "18,2", "18,3", "19,0", "19,1", "19,2", "19,3",
    "0,8", "0,9", "0,10", "0,11", "1,9", "1,10", "1,11", "2,10", "2,11", "3,11",
    "5,8", "5,9", "6,8", "6,9", "6,10", "7,9", "7,10",
    "11,8", "11,9", "12,7", "12,8", "12,9", "13,8", "13,9", "13,10",
    "17,8", "17,9", "18,8", "18,9", "18,10", "18,11", "19,8", "19,9", "19,10", "19,11"
  ]);

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
  let scale = 1;
  let dragState = null;

  function renderIcon(code) {
    const submarine = '<polygon points="5,18 18,13 69,13 92,24 69,35 18,35 5,30 0,24"/><rect x="39" y="9" width="18" height="30" rx="4"/>';
    const destroyer = '<polygon points="8,8 91,24 8,40"/>';
    const cruiser = '<polygon points="8,8 43,8 28,40 8,40"/><polygon points="51,8 66,8 91,24 66,40 38,40"/>';
    const battleship = '<polygon points="8,8 37,8 22,40 8,40"/><polygon points="45,8 58,8 42,40 28,40"/><polygon points="67,8 91,24 67,40 49,40"/>';
    const carrier = '<rect x="8" y="8" width="47" height="14"/><rect x="8" y="27" width="47" height="13"/><polygon points="61,8 73,8 92,24 73,40 61,40"/>';
    const monitor = '<polygon points="7,14 21,8 68,8 92,24 68,40 21,40 7,34"/><rect x="27" y="16" width="26" height="16" rx="8"/>';
    const repairShip = '<rect x="7" y="8" width="30" height="14"/><rect x="7" y="27" width="30" height="13"/><polygon points="43,8 66,8 92,24 66,40 43,40 52,24"/>';
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
        const key = `${column},${row}`;
        const tile = document.createElement("div");
        const terrain = landCells.has(key) ? "land" : "sea";
        tile.className = `hex-cell ${terrain}-hex terrain-variant-${(column * 5 + row * 3) % 3}`;
        tile.style.left = `${column * COLUMN_STEP}px`;
        tile.style.top = `${row * HEX_HEIGHT + (column % 2 ? HEX_HEIGHT / 2 : 0)}px`;
        tile.innerHTML = `<span>${String.fromCharCode(65 + column)}${row + 1}</span>`;
        tile.setAttribute("aria-hidden", "true");
        map.appendChild(tile);
      }
    }

    shipTypes.forEach((shipType) => {
      const marker = document.createElement("button");
      marker.className = "map-unit";
      marker.type = "button";
      marker.dataset.shipType = shipType.code;
      marker.style.setProperty("--unit-color", groupColors[shipType.group]);
      marker.style.left = `${shipType.column * COLUMN_STEP + HEX_WIDTH / 2}px`;
      marker.style.top = `${UNIT_LINE_Y}px`;
      marker.setAttribute("aria-label", `${shipType.code}: ${shipType.label}`);
      marker.innerHTML = `<span class="map-unit-icon">${renderIcon(shipType.code)}</span><span class="map-unit-code">${shipType.code}</span>`;
      marker.addEventListener("click", () => selectUnit(marker, shipType));
      map.appendChild(marker);
    });
  }

  function selectUnit(marker, shipType) {
    map.querySelectorAll(".map-unit.is-selected").forEach((unit) => unit.classList.remove("is-selected"));
    marker.classList.add("is-selected");
    unitReadout.textContent = `${shipType.code} · ${shipType.label}`;
  }

  function setScale(nextScale, preserveCenter = true) {
    const oldScale = scale;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / oldScale;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / oldScale;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(nextScale * 10) / 10));

    stage.style.width = `${MAP_WIDTH * scale}px`;
    stage.style.height = `${MAP_HEIGHT * scale}px`;
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
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    dragState = null;
    viewport.classList.remove("is-dragging");
  }

  zoomIn.addEventListener("click", () => setScale(scale + SCALE_STEP));
  zoomOut.addEventListener("click", () => setScale(scale - SCALE_STEP));
  zoomReset.addEventListener("click", resetView);

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
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest(".map-unit")) return;
    dragState = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-dragging");
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    viewport.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.x);
    viewport.scrollTop = dragState.scrollTop - (event.clientY - dragState.y);
  });
  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);

  renderMap();
  resetView();
})();
