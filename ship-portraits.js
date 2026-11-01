(function () {
  "use strict";

  const storageKey = "naval-command-portrait-mode";
  const changeEvent = "naval-portrait-mode-change";
  const normalize = (mode) => mode === "alternate" ? "alternate" : "default";
  let fallbackMode = "default";

  function getMode() {
    try { return normalize(localStorage.getItem(storageKey) ?? fallbackMode); }
    catch { return fallbackMode; }
  }

  function setMode(mode) {
    fallbackMode = normalize(mode);
    try { localStorage.setItem(storageKey, fallbackMode); } catch { /* Use the session fallback when storage is unavailable. */ }
    window.dispatchEvent(new Event(changeEvent));
  }

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) window.dispatchEvent(new Event(changeEvent));
  });

  window.NAVAL_PORTRAITS = {
    getMode, setMode, changeEvent,
    imageFor: (profile, mode = getMode()) => (mode === "alternate" ? profile?.alternateImage : profile?.defaultImage) || null
  };
})();
