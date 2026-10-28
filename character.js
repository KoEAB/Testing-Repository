(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");
  const portraitMode = params.get("portrait") === "alternate" ? "alternate" : "default";
  const characters = window.CHARACTERS || [];
  const character = characters.find((entry) => entry.id === requestedId);
  const detail = document.querySelector("#character-detail");

  if (!character) {
    document.title = "Warship Not Found — Naval Command";
    detail.innerHTML = `
      <section class="not-found">
        <p class="eyebrow">Archive error</p>
        <h1>This vessel is not in the archive.</h1>
        <p>The warship record you requested could not be found.</p>
        <a class="primary-button" href="shipyard.html?v=navy-51">Return to Shipyard</a>
      </section>
    `;
    return;
  }

  document.title = `${character.name} — Naval Command`;
  document.documentElement.style.setProperty("--character-accent", character.accent);
  document.documentElement.style.setProperty("--character-rgb", character.rgb);
  document.querySelector("#archive-entry").textContent = `Record ${character.number}`;

  if (character.placeholder) {
    document.title = `${character.name} — Naval Command`;
    detail.innerHTML = `
      <section class="empty-record" aria-label="${character.name} — 资料待补充">
        <div class="empty-record-frame portrait-placeholder">
          <span class="portrait-corner portrait-corner-top" aria-hidden="true"></span>
          <span class="portrait-corner portrait-corner-bottom" aria-hidden="true"></span>
          <span class="empty-profile-mark empty-detail-mark" aria-hidden="true"></span>
          <span class="portrait-number" aria-hidden="true">${character.number}</span>
        </div>
      </section>

      <nav class="character-navigation empty-navigation" aria-label="Browse warships">
        ${renderAdjacentLink(character, -1, "上一项")}
        <a class="all-characters" href="shipyard.html?v=navy-51">全部档案</a>
        ${renderAdjacentLink(character, 1, "下一项")}
      </nav>
    `;
    return;
  }

  const abilities = character.abilities
    .map(
      (ability, index) => `
        <article class="ability">
          <span class="ability-number">0${index + 1}</span>
          <div>
            <h3>${ability.name}</h3>
            <p>${ability.text}</p>
          </div>
        </article>
      `
    )
    .join("");

  const traits = character.traits
    .map((trait) => `<span class="trait">${trait}</span>`)
    .join("");

  const combatStats = character.combatStats;
  const combatStatsSection = combatStats ? `
    <section class="combat-stats-section" aria-label="Current combat statistics">
      <p class="section-label">Combat statistics</p>
      <dl class="combat-stats-grid">
        ${[
          ["HP", combatStats.health], ["Speed", `${combatStats.speedKnots} knots`],
          ["Movement", `${combatStats.movementRange} hexes / turn`],
          ["Concealment", `${combatStats.concealmentRange} hexes`],
          ["Gun range", `${combatStats.gunRange} hexes`],
          ["Salvos / turn", combatStats.gunAttacksPerTurn],
          ["Shells / salvo", combatStats.shellCount],
          ["Turrets / salvo", combatStats.salvoPattern.length],
          ["Shells / turret", combatStats.salvoPattern.every((count) => count === combatStats.salvoPattern[0])
            ? `${combatStats.salvoPattern[0]} each` : combatStats.salvoPattern.join(" / ")],
          ["Turret arrangement", `${combatStats.turretPositions.filter((position) => position === "forward").length} forward · ${combatStats.turretPositions.filter((position) => position === "aft").length} aft`],
          ["AP alpha / shell", combatStats.alphaDamage],
          ["AP shell velocity", `${combatStats.apShellVelocity} m/s`],
          ["HE alpha / shell", combatStats.heAlphaDamage],
          ["HE shell velocity", `${combatStats.heShellVelocity} m/s`],
          ["Main gun caliber", `${combatStats.mainGunCaliberMm} mm`],
          ["Forward firing angle", `${combatStats.forwardFiringAngle}°`],
          ["Backward firing angle", `${combatStats.backwardFiringAngle}°`],
          ...(combatStats.torpedoRange == null ? [] : [
            ["Torpedo range", `${combatStats.torpedoRange} hexes`],
            ["Torpedo damage", combatStats.torpedoDamage],
            ["Torpedo reload", `${combatStats.torpedoReloadDuration} turns`]
          ])
        ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}
      </dl>
    </section>
  ` : "";

  const selectedArtwork =
    portraitMode === "alternate" ? character.alternateImage : character.defaultImage;

  const artwork = selectedArtwork
    ? `<img class="ship-art detail-ship-art" src="${selectedArtwork}" alt="${character.name} ${portraitMode} character artwork" />`
    : `<span class="detail-monogram" aria-hidden="true">${character.name
        .split(" ")
        .map((part) => part[0])
        .join("")}</span><span class="portrait-status">Ship image pending</span>`;

  detail.innerHTML = `
    <section class="detail-hero">
      <div class="detail-portrait portrait-placeholder${selectedArtwork ? " has-art" : ""}">
        <span class="portrait-corner portrait-corner-top" aria-hidden="true"></span>
        <span class="portrait-corner portrait-corner-bottom" aria-hidden="true"></span>
        ${artwork}
        <span class="portrait-number" aria-hidden="true">${character.number}</span>
      </div>

      <div class="detail-intro">
        <h1>${character.name}</h1>
        <p class="detail-role">${character.role}</p>
        <p class="biography">${character.description}</p>
        <div class="traits" aria-label="Vessel traits">${traits}</div>
      </div>
    </section>

    <section class="character-record" aria-label="Warship record">
      <div class="facts">
        <div class="fact"><span>Rarity</span><strong class="detail-rarity" data-rarity="${character.rarity}">${character.rarity}</strong></div>
        <div class="fact"><span>Builder</span><strong>${character.origin}</strong></div>
        <div class="fact"><span>Theater</span><strong>${character.affinity}</strong></div>
        <div class="fact"><span>Armament</span><strong>${character.weapon}</strong></div>
      </div>
      <div class="abilities-section">
        <p class="section-label">Combat capabilities</p>
        <div class="abilities">${abilities}</div>
      </div>
    </section>

    ${combatStatsSection}

    <nav class="character-navigation" aria-label="Browse warships">
      ${renderAdjacentLink(character, -1, "Previous")}
      <a class="all-characters" href="shipyard.html?v=navy-51">All profiles</a>
      ${renderAdjacentLink(character, 1, "Next")}
    </nav>
  `;

  function renderAdjacentLink(current, offset, label) {
    const currentIndex = characters.findIndex((entry) => entry.id === current.id);
    const adjacentIndex = (currentIndex + offset + characters.length) % characters.length;
    const adjacent = characters[adjacentIndex];
    const arrow = offset < 0 ? "←" : "→";
    const classes = offset < 0 ? "adjacent-link previous-link" : "adjacent-link next-link";

    return `
      <a class="${classes}" href="character.html?id=${encodeURIComponent(adjacent.id)}&portrait=${portraitMode}&v=navy-51">
        <span>${label}</span>
        <strong>${offset < 0 ? `${arrow} ${adjacent.name}` : `${adjacent.name} ${arrow}`}</strong>
      </a>
    `;
  }
})();
