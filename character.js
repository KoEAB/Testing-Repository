(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");
  const characters = window.CHARACTERS || [];
  const character = characters.find((entry) => entry.id === requestedId);
  const detail = document.querySelector("#character-detail");

  if (!character) {
    document.title = "Character Not Found — Wayfinder";
    detail.innerHTML = `
      <section class="not-found">
        <p class="eyebrow">Archive error</p>
        <h1>This story has not been written.</h1>
        <p>The character you were looking for could not be found.</p>
        <a class="primary-button" href="index.html">Return to character selection</a>
      </section>
    `;
    return;
  }

  document.title = `${character.name} — Wayfinder`;
  document.documentElement.style.setProperty("--character-accent", character.accent);
  document.documentElement.style.setProperty("--character-rgb", character.rgb);
  document.querySelector("#archive-entry").textContent = `Entry ${character.number}`;

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

  detail.innerHTML = `
    <section class="detail-hero">
      <div class="detail-portrait portrait-placeholder" aria-label="Portrait placeholder for ${character.name}">
        <span class="portrait-corner portrait-corner-top" aria-hidden="true"></span>
        <span class="portrait-corner portrait-corner-bottom" aria-hidden="true"></span>
        <span class="detail-monogram" aria-hidden="true">${character.name
          .split(" ")
          .map((part) => part[0])
          .join("")}</span>
        <span class="portrait-status">Portrait pending</span>
        <span class="portrait-number" aria-hidden="true">${character.number}</span>
      </div>

      <div class="detail-intro">
        <p class="eyebrow">${character.epithet} · ${character.number}</p>
        <h1>${character.name}</h1>
        <p class="detail-role">${character.role}</p>
        <blockquote>“${character.quote}”</blockquote>
        <p class="biography">${character.description}</p>
        <div class="traits" aria-label="Character traits">${traits}</div>
      </div>
    </section>

    <section class="character-record" aria-label="Character record">
      <div class="facts">
        <div class="fact"><span>Origin</span><strong>${character.origin}</strong></div>
        <div class="fact"><span>Affinity</span><strong>${character.affinity}</strong></div>
        <div class="fact"><span>Weapon</span><strong>${character.weapon}</strong></div>
      </div>
      <div class="abilities-section">
        <p class="section-label">Field abilities</p>
        <div class="abilities">${abilities}</div>
      </div>
    </section>

    <nav class="character-navigation" aria-label="Browse characters">
      ${renderAdjacentLink(character, -1, "Previous")}
      <a class="all-characters" href="index.html">All characters</a>
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
      <a class="${classes}" href="character.html?id=${encodeURIComponent(adjacent.id)}">
        <span>${label}</span>
        <strong>${offset < 0 ? `${arrow} ${adjacent.name}` : `${adjacent.name} ${arrow}`}</strong>
      </a>
    `;
  }
})();
