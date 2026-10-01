(function () {
  "use strict";

  const roster = document.querySelector("#character-roster");
  const characters = window.CHARACTERS || [];

  characters.forEach((character, index) => {
    const link = document.createElement("a");
    link.className = "character-card";
    link.href = `character.html?id=${encodeURIComponent(character.id)}&v=navy-3`;
    link.style.setProperty("--accent", character.accent);
    link.style.setProperty("--accent-rgb", character.rgb);
    link.style.setProperty("--delay", `${index * 85}ms`);
    link.setAttribute("aria-label", `Open the fleet record for ${character.name}, ${character.role}`);

    const artwork = character.image
      ? `<img class="ship-art" src="${character.image}" alt="" />`
      : `<span class="portrait-monogram">${character.name
          .split(" ")
          .map((part) => part[0])
          .join("")}</span><span class="portrait-status">Ship image pending</span>`;

    link.innerHTML = `
      <div class="portrait-placeholder${character.image ? " has-art" : ""}" aria-hidden="true">
        <span class="portrait-corner portrait-corner-top"></span>
        <span class="portrait-corner portrait-corner-bottom"></span>
        ${artwork}
      </div>
      <div class="card-content">
        <span class="character-number">${character.number}</span>
        <div>
          <h2>${character.name}</h2>
          <p>${character.role}</p>
        </div>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </div>
    `;

    roster.appendChild(link);
  });
})();
