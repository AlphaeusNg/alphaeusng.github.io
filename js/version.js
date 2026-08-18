/**
 * Site version for alphaeusng.github.io (portfolio + pages).
 * Bump `id` every time you deploy so you can confirm GitHub Pages picked up the push.
 * Format: YYYY.MM.DD.N  (N = revision that day)
 */
(function (global) {
  "use strict";
  global.SITE_VERSION = {
    id: "2026.08.18.10",
    repo: "alphaeusng.github.io",
    label: "portfolio",
  };

  function paintVersion() {
    var el = global.document && global.document.getElementById("site-version");
    if (el) {
      el.textContent =
        "v" + global.SITE_VERSION.id + " · " + global.SITE_VERSION.repo;
    }
  }

  if (global.document && global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", paintVersion, {
      once: true,
    });
  } else {
    paintVersion();
  }
})(window);
