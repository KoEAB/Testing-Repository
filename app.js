(function () {
  "use strict";

  const SHIP_TYPES = [
    { value: "SS", label: "Submarine" },
    { value: "SSV", label: "Aviation submarine" },
    { value: "DD", label: "Destroyer" },
    { value: "DE", label: "Destroyer escort" },
    { value: "CL", label: "Light cruiser" },
    { value: "CA", label: "Heavy cruiser" },
    { value: "CB", label: "Large cruiser" },
    { value: "BC", label: "Battlecruiser" },
    { value: "BB", label: "Battleship" },
    { value: "BBV", label: "Aviation battleship" },
    { value: "CV", label: "Aircraft carrier" },
    { value: "CVL", label: "Light aircraft carrier" },
    { value: "CVE", label: "Escort aircraft carrier" },
    { value: "BM", label: "Monitor" },
    { value: "AR", label: "Repair ship" }
  ];
  const RARITIES = ["C", "U", "R", "SR", "SSR", "UR"];

  const roster = document.querySelector("#character-roster");
  const characters = window.CHARACTERS || [];
  const realCharacters = characters.filter((character) => !character.placeholder);
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const alternateToggle = document.querySelector("#alternate-toggle");
  const filterToggle = document.querySelector("#filter-toggle");
  const filterPanel = document.querySelector("#filter-panel");
  const filterClear = document.querySelector("#filter-clear");
  const filterEmptyClear = document.querySelector("#filter-empty-clear");
  const filterEmpty = document.querySelector("#filter-empty");
  const filterActiveCount = document.querySelector("#filter-active-count");
  const filterResultCount = document.querySelector("#filter-result-count");
  const typeFilters = document.querySelector("#type-filters");
  const rarityFilters = document.querySelector("#rarity-filters");
  const activeFilters = {
    types: new Set(),
    rarities: new Set()
  };

  function renderPortraitLayer(image, name, layerClass) {
    const content = image
      ? `<img class="ship-art" src="${image}" alt="" />`
      : `<span class="empty-profile-mark" aria-hidden="true"></span>`;

    return `<span class="portrait-layer ${layerClass}" aria-label="${name}">${content}</span>`;
  }

  characters.forEach((character, index) => {
    const link = document.createElement("a");
    link.className = `character-card${character.placeholder ? " empty-card" : ""}`;
    link.dataset.characterId = character.id;
    link.dataset.shipType = character.typeCode || "";
    link.dataset.rarity = character.rarity || "";
    link.href = `character.html?id=${encodeURIComponent(character.id)}&portrait=default&v=navy-17`;
    link.style.setProperty("--accent", character.accent);
    link.style.setProperty("--accent-rgb", character.rgb);
    link.style.setProperty(
      "--delay",
      `${(index % 8) * 45 + Math.floor(index / 8) * 70}ms`
    );
    link.setAttribute(
      "aria-label",
      character.placeholder
        ? `Open reserve fleet record ${character.number}`
        : `Open the fleet record for ${character.name}, ${character.shipClass} class, ${character.shipType}, hull number ${character.hullNumber}, rarity ${character.rarity}`
    );

    link.innerHTML = `
      <div class="portrait-placeholder${character.defaultImage ? " has-art" : ""}">
        ${renderPortraitLayer(
          character.defaultImage,
          `${character.name} default portrait`,
          "portrait-primary"
        )}
        ${renderPortraitLayer(
          character.alternateImage,
          `${character.name} alternate portrait`,
          "portrait-alternate"
        )}
        <span class="portrait-corner portrait-corner-top"></span>
        <span class="portrait-corner portrait-corner-bottom"></span>
        <span class="portrait-number card-portrait-number" aria-hidden="true">${character.number}</span>
      </div>
      <div class="card-content">
        <div>
          <h2>${character.name}</h2>
          <dl class="card-specs">
            <div><dt>Class</dt><dd>${character.shipClass}</dd></div>
            <div><dt>Type</dt><dd>${character.shipType}</dd></div>
            <div><dt>Hull number</dt><dd>${character.hullNumber}</dd></div>
          </dl>
        </div>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </div>
    `;

    roster.appendChild(link);
  });

  function renderFilterOptions(container, options, groupName) {
    options.forEach((option) => {
      const value = typeof option === "string" ? option : option.value;
      const label = typeof option === "string" ? `Rarity ${option}` : option.label;
      const count = realCharacters.filter((character) =>
        groupName === "types" ? character.typeCode === value : character.rarity === value
      ).length;
      const button = document.createElement("button");
      button.className = "filter-chip";
      button.type = "button";
      button.dataset.filterGroup = groupName;
      button.dataset.filterValue = value;
      if (groupName === "rarities") {
        button.dataset.rarity = value;
      }
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${label}: ${count} ships`);
      button.title = label;
      button.innerHTML = `<span>${value}</span><small>${count}</small>`;
      button.addEventListener("click", () => toggleFilter(button));
      container.appendChild(button);
    });
  }

  function toggleFilter(button) {
    const group = activeFilters[button.dataset.filterGroup];
    const value = button.dataset.filterValue;

    if (group.has(value)) {
      group.delete(value);
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    } else {
      group.add(value);
      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");
    }

    applyFilters();
  }

  function applyFilters() {
    const activeCount = activeFilters.types.size + activeFilters.rarities.size;
    const filtering = activeCount > 0;
    let visibleShips = 0;

    roster.querySelectorAll(".character-card").forEach((link) => {
      const character = characterById.get(link.dataset.characterId);
      const matchesType =
        activeFilters.types.size === 0 || activeFilters.types.has(character.typeCode);
      const matchesRarity =
        activeFilters.rarities.size === 0 || activeFilters.rarities.has(character.rarity);
      const matches = filtering
        ? !character.placeholder && matchesType && matchesRarity
        : true;

      link.hidden = !matches;
      if (matches && !character.placeholder) {
        visibleShips += 1;
      }
    });

    filterActiveCount.textContent = String(activeCount);
    filterClear.disabled = !filtering;
    filterResultCount.textContent = filtering
      ? `${visibleShips} of ${realCharacters.length} warships shown`
      : `${realCharacters.length} warships available`;
    filterEmpty.hidden = visibleShips > 0 || !filtering;
  }

  function clearFilters() {
    activeFilters.types.clear();
    activeFilters.rarities.clear();
    document.querySelectorAll(".filter-chip.is-selected").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
    applyFilters();
  }

  function setFilterPanel(open) {
    filterPanel.hidden = !open;
    filterToggle.setAttribute("aria-expanded", String(open));
    filterToggle.classList.toggle("is-open", open);
  }

  renderFilterOptions(typeFilters, SHIP_TYPES, "types");
  renderFilterOptions(rarityFilters, RARITIES, "rarities");
  applyFilters();

  filterToggle.addEventListener("click", () => {
    setFilterPanel(filterPanel.hidden);
  });
  filterClear.addEventListener("click", clearFilters);
  filterEmptyClear.addEventListener("click", clearFilters);

  document.addEventListener("click", (event) => {
    if (
      !filterPanel.hidden &&
      !filterPanel.contains(event.target) &&
      !filterToggle.contains(event.target)
    ) {
      setFilterPanel(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !filterPanel.hidden) {
      setFilterPanel(false);
      filterToggle.focus();
    }
  });

  alternateToggle.addEventListener("click", () => {
    const isAlternate = document.body.classList.toggle("show-alternate-portraits");
    const portraitMode = isAlternate ? "alternate" : "default";
    alternateToggle.setAttribute("aria-pressed", String(isAlternate));
    alternateToggle.querySelector(".toggle-label").textContent = isAlternate
      ? "返回主图"
      : "切换副图";

    roster.querySelectorAll(".character-card").forEach((link) => {
      link.href = `character.html?id=${encodeURIComponent(link.dataset.characterId)}&portrait=${portraitMode}&v=navy-17`;
    });
  });
})();
