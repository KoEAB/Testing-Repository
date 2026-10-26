(function () {
  "use strict";

  const COLUMNS = 16;
  const ROWS = 9;
  const HEX_WIDTH = 128;
  const HEX_HEIGHT = 112;
  const COLUMN_STEP = 96;
  const MAP_WIDTH = (COLUMNS - 1) * COLUMN_STEP + HEX_WIDTH;
  const MAP_HEIGHT = ROWS * HEX_HEIGHT + HEX_HEIGHT / 2;
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 2;
  const SCALE_STEP = 0.2;

  const shipTypes = [
    { code: "SS", label: "Submarine", column: 3, row: 0, group: "submarine" },
    { code: "SSV", label: "Aviation submarine", column: 4, row: 1, group: "submarine" },
    { code: "DD", label: "Destroyer", column: 8, row: 0, group: "escort" },
    { code: "DE", label: "Destroyer escort", column: 10, row: 1, group: "escort" },
    { code: "CL", label: "Light cruiser", column: 2, row: 3, group: "cruiser" },
    { code: "CA", label: "Heavy cruiser", column: 3, row: 4, group: "cruiser" },
    { code: "CB", label: "Large cruiser", column: 9, row: 3, group: "capital" },
    { code: "BC", label: "Battlecruiser", column: 11, row: 4, group: "capital" },
    { code: "BB", label: "Battleship", column: 4, row: 6, group: "capital" },
    { code: "BBV", label: "Aviation battleship", column: 8, row: 6, group: "capital" },
    { code: "CV", label: "Aircraft carrier", column: 13, row: 4, group: "aviation" },
    { code: "CVL", label: "Light aircraft carrier", column: 12, row: 5, group: "aviation" },
    { code: "CVE", label: "Escort aircraft carrier", column: 14, row: 6, group: "aviation" },
    { code: "BM", label: "Monitor", column: 3, row: 7, group: "coastal" },
    { code: "AR", label: "Repair ship", column: 7, row: 7, group: "support" },
    { code: "AE", label: "Ammunition ship", column: 9, row: 8, group: "support" }
  ];

  const landCells = new Set([
    "0,0", "0,1", "0,2", "1,0", "1,1", "1,2", "2,0", "2,1",
    "5,3", "5,4", "6,3", "6,4", "6,5", "7,4", "7,5",
    "12,0", "12,1", "13,0", "13,1", "14,0", "14,1", "14,2", "15,0", "15,1", "15,2",
    "0,7", "0,8", "1,7", "1,8", "2,8",
    "10,7", "10,8", "11,7", "11,8", "12,7", "12,8", "13,8"
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
    const shapes = {
      SS: '<path d="M7 22h42l8-5-8-5H20l-7 4H7z"/><path d="M29 12V8h7v4M34 8V5"/>',
      SSV: '<path d="M6 23h43l9-5-9-5H18l-7 4H6z"/><path d="M27 13V8h9v5M31 8l-9-4h25l-10 4"/>',
      DD: '<path d="M4 25h49l8-7H15L8 21H4z"/><path d="M21 18v-6h8v6M37 18v-9h7v9M48 18v-5h6v5"/>',
      DE: '<path d="M8 25h42l8-6H18l-6 3H8z"/><path d="M24 19v-6h7v6M38 19v-7h6v7"/>',
      CL: '<path d="M3 26h53l6-7H12l-6 4H3z"/><circle cx="20" cy="17" r="4"/><circle cx="45" cy="17" r="4"/><path d="M28 19V9h9v10M32 9V5"/>',
      CA: '<path d="M2 27h55l6-8H10l-6 4H2z"/><path d="M14 19l5-6 5 6M43 19l5-6 5 6M28 19V7h10v12M33 7V3"/>',
      CB: '<path d="M1 28h57l5-9H8l-6 5H1z"/><path d="M11 19l6-7 6 7M45 19l6-7 6 7M26 19V6h13v13M31 6V2h4v4"/>',
      BC: '<path d="M1 28h58l4-9H7l-6 5z"/><path d="M9 19l7-8 7 8M45 19l7-8 7 8M25 19V5h15v14M31 5V1h4v4"/>',
      BB: '<path d="M1 29h58l4-10H7l-6 5z"/><path d="M8 19l7-9 8 9M42 19l8-9 8 9M24 19V5h17v14M29 5V1h7v4"/><path d="M12 10h6M47 10h6"/>',
      BBV: '<path d="M1 29h58l4-10H7l-6 5z"/><path d="M8 19l7-9 8 9M24 19V5h11v14M29 5V1"/><path d="M37 9h22v7H37zM40 12h15"/>',
      CV: '<path d="M3 8h51l8 10-8 10H3L1 18z"/><path d="M10 18h43M16 13l30 10M48 8v7h8"/>',
      CVL: '<path d="M7 9h45l7 9-7 9H7L4 18z"/><path d="M12 18h37M18 13l25 10M46 9v7h7"/>',
      CVE: '<path d="M9 10h41l7 8-7 8H9l-4-8z"/><path d="M13 18h34M19 14l22 8M44 10v6h7"/>',
      BM: '<path d="M8 27h43l6-8H5z"/><circle cx="31" cy="17" r="10"/><path d="M24 17h14M31 7V3"/>',
      AR: '<path d="M5 27h50l6-8H10z"/><path d="M25 19V8h14v11M32 10v7M28.5 13.5h7"/>',
      AE: '<path d="M5 27h50l6-8H10z"/><path d="M32 6l10 10-10 10-10-10zM32 10v12M26 16h12"/>'
    };

    return `<svg viewBox="0 0 64 34" aria-hidden="true" focusable="false">${shapes[code]}</svg>`;
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
      marker.style.top = `${shipType.row * HEX_HEIGHT + (shipType.column % 2 ? HEX_HEIGHT / 2 : 0) + HEX_HEIGHT / 2}px`;
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
    if (!event.ctrlKey && !event.metaKey) return;
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
