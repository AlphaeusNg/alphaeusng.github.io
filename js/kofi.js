/**
 * Render the official Ko-fi button while retaining the direct-link fallback
 * when the vendor CDN is unavailable or blocked.
 */
(function (global) {
  "use strict";

  var host = global.document.getElementById("kofi-support-widget");
  if (!host || !global.kofiwidget2) {
    return;
  }

  global.kofiwidget2.init(
    "Support me on Ko-fi",
    "#72a4f2",
    "K1V623R7BV"
  );
  host.innerHTML = global.kofiwidget2.getHTML();

  var link = host.querySelector(".kofi-button");
  if (link) {
    link.setAttribute("rel", "me noopener noreferrer");
    link.setAttribute(
      "aria-label",
      "Support Alphaeus on Ko-fi (opens in a new tab)"
    );
  }
})(window);
