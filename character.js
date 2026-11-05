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
        <a class="primary-button" href="shipyard.html?v=navy-77">Return to Shipyard</a>
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
        <a class="all-characters" href="shipyard.html?v=navy-77">全部档案</a>
        ${renderAdjacentLink(character, 1, "下一项")}
      </nav>
    `;
    return;
  }

  const abilities = character.abilities
    .map(
      (ability, index) => `
        <article class="ability">
          ${ability.icon ? `<span class="ability-icon"><img src="${ability.icon}" alt="" /></span>` : `<span class="ability-number">0${index + 1}</span>`}
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
  function statRows(entries) {
    return `<dl class="combat-stats-grid">${entries.map(([label, value]) =>
      `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
  }
  function statGroup(id, title, entries, extra = "") {
    return `<section class="combat-stat-group" data-stat-group="${id}" aria-labelledby="stats-${id}">
      <h3 id="stats-${id}">${title}</h3>${statRows(entries)}${extra}</section>`;
  }
  const combatStatsSection = combatStats ? `
    <section class="combat-stats-section" aria-label="Current combat statistics">
      <p class="section-label">Combat statistics</p>
      <div class="combat-stat-groups">
        ${statGroup("hull", "Hull &amp; mobility", [
          ["HP", combatStats.health], ["Speed", `${combatStats.speedKnots} knots`],
          ["Movement", `${combatStats.movementRange} hexes / turn`],
          ["Concealment", `${combatStats.concealmentRange} hexes`]
        ])}
        ${statGroup("guns", "Main battery", [
          ["Main gun caliber", `${combatStats.mainGunCaliberMm} mm`],
          ["Gun range", `${combatStats.gunRange} hexes`],
          ["Salvos / turn", combatStats.gunAttacksPerTurn],
          ["Shells / salvo", combatStats.shellCount],
          ["Turrets / salvo", combatStats.salvoPattern.length],
          ["Shells / turret", combatStats.salvoPattern.every((count) => count === combatStats.salvoPattern[0])
            ? `${combatStats.salvoPattern[0]} each` : combatStats.salvoPattern.join(" / ")],
          ["Turret arrangement", `${combatStats.turretPositions.filter((p) => p === "forward").length} forward · ${combatStats.turretPositions.filter((p) => p === "aft").length} aft`],
          ["Forward firing angle", `${combatStats.forwardFiringAngle}°`],
          ["Backward firing angle", `${combatStats.backwardFiringAngle}°`]
        ], `<div class="stat-ammunition">
          <section aria-label="AP ammunition"><h4>AP shells</h4>${statRows([
            ["AP alpha / shell", combatStats.alphaDamage], ["AP shell velocity", `${combatStats.apShellVelocity} m/s`]
          ])}</section>
          <section aria-label="HE ammunition"><h4>HE shells</h4>${statRows([
            ["HE alpha / shell", combatStats.heAlphaDamage], ["HE shell velocity", `${combatStats.heShellVelocity} m/s`]
          ])}</section>
        </div>`)}
        ${combatStats.torpedoRange == null ? "" : statGroup("torpedoes", "Torpedoes", [
          ["Torpedoes / launch", combatStats.torpedoCount],
          ["Torpedo alpha / hit", combatStats.torpedoAlphaDamage],
          ["Torpedo range", `${combatStats.torpedoRange} hexes`],
          ["Torpedo speed", `${combatStats.torpedoSpeedKnots} knots`],
          ["Torpedo concealment range", `${combatStats.torpedoConcealmentRange} hexes`],
          ["Torpedo reload", `${combatStats.torpedoReloadDuration} turns`],
          ["Torpedo travel N", combatStats.torpedoTravelN]
        ])}
      </div>
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
      <a class="all-characters" href="shipyard.html?v=navy-77">All profiles</a>
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
      <a class="${classes}" href="character.html?id=${encodeURIComponent(adjacent.id)}&portrait=${portraitMode}&v=navy-77">
        <span>${label}</span>
        <strong>${offset < 0 ? `${arrow} ${adjacent.name}` : `${adjacent.name} ${arrow}`}</strong>
      </a>
    `;
  }
})();
