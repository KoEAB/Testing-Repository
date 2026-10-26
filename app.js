(function () {
  "use strict";

  const roster = document.querySelector("#character-roster");
  const characters = window.CHARACTERS || [];
  const alternateToggle = document.querySelector("#alternate-toggle");

  function renderPortraitLayer(image, name, layerClass) {
    const content = image
      ? `<img class="ship-art" src="${image}" alt="" />`
      : `<span class="empty-profile-mark" aria-hidden="true"></span>`;

    return `<span class="portrait-layer ${layerClass}" aria-label="${name}">${content}</span>`;
  }

  characters.forEach((character, index) => {
    const link = document.createElement("a");
    link.className = `character-card${character.placeholder ? " empty-card" : ""}`;
    link.href = `character.html?id=${encodeURIComponent(character.id)}&v=navy-4`;
    link.style.setProperty("--accent", character.accent);
    link.style.setProperty("--accent-rgb", character.rgb);
    link.style.setProperty(
      "--delay",
      `${(index % 8) * 45 + Math.floor(index / 8) * 70}ms`
    );
    link.setAttribute("aria-label", `Open the fleet record for ${character.name}, ${character.role}`);

    link.innerHTML = `
      <div class="portrait-placeholder${character.image ? " has-art" : ""}">
        ${renderPortraitLayer(character.image, `${character.name} primary portrait`, "portrait-primary")}
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
          <p>${character.role}</p>
        </div>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </div>
    `;

    roster.appendChild(link);
  });

  alternateToggle.addEventListener("click", () => {
    const isAlternate = document.body.classList.toggle("show-alternate-portraits");
    alternateToggle.setAttribute("aria-pressed", String(isAlternate));
    alternateToggle.querySelector(".toggle-label").textContent = isAlternate
      ? "返回主图"
      : "切换副图";
  });
})();
