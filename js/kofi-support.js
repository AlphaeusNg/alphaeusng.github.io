/**
 * Shared Ko-fi support component for Alphaeus Ng project pages.
 *
 * Usage:
 *   <script src="https://alphaeusng.github.io/js/kofi-support.js"
 *           data-auto-footer defer></script>
 *
 * Or render only the button inside an existing element:
 *   <script src="/js/kofi-support.js"
 *           data-target="#kofi-support-widget" defer></script>
 */
(function (global) {
  "use strict";

  var KOFI_ID = "K1V623R7BV";
  var KOFI_URL = "https://ko-fi.com/" + KOFI_ID;
  var KOFI_ICON_URL = "https://storage.ko-fi.com/cdn/cup-border.png";
  var KOFI_LABEL = "Support on Ko-fi";
  var scriptElement = global.document.currentScript;

  function addSharedStyles() {
    if (global.document.getElementById("alphaeus-kofi-support-styles")) {
      return;
    }

    var style = global.document.createElement("style");
    style.id = "alphaeus-kofi-support-styles";
    style.textContent =
      ".alphaeus-kofi-support{" +
      "box-sizing:border-box;display:flex;flex:1 0 100%;width:100%;" +
      "align-items:center;justify-content:center;gap:.7rem 1rem;flex-wrap:wrap;" +
      "margin:0 0 .9rem;padding:0 0 1rem;border-bottom:1px solid rgba(148,163,184,.16);" +
      "font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "text-align:center}" +
      ".alphaeus-kofi-support__message{color:#94a3b8;font-size:.78rem;line-height:1.45}" +
      ".alphaeus-kofi-support__message strong{color:#e2e8f0;font-weight:600}" +
      ".alphaeus-kofi-support__button{min-width:0}" +
      ".alphaeus-kofi-support__fallback{box-sizing:border-box;display:inline-flex;" +
      "min-height:26px;align-items:center;justify-content:center;gap:4px;padding:.3rem .55rem;" +
      "border-radius:5px;background:#72a4f2;color:#fff!important;font-size:.65rem;" +
      "font-weight:700;line-height:1;text-decoration:none!important}" +
      ".alphaeus-kofi-support__icon{display:block;width:14px;height:11px;" +
      "object-fit:contain;flex:0 0 auto}" +
      ".alphaeus-kofi-support__fallback:focus-visible{outline:2px solid #f8fafc;outline-offset:3px}" +
      "@media(max-width:520px){.alphaeus-kofi-support{gap:.55rem;padding-bottom:.9rem}" +
      ".alphaeus-kofi-support__message{flex-basis:100%}}";
    global.document.head.appendChild(style);
  }

  function fallbackMarkup() {
    return (
      '<a class="alphaeus-kofi-support__fallback" href="' +
      KOFI_URL +
      '" target="_blank" rel="me noopener noreferrer">' +
      '<img class="alphaeus-kofi-support__icon" src="' +
      KOFI_ICON_URL +
      '" alt="" aria-hidden="true">' +
      KOFI_LABEL +
      " ↗</a>"
    );
  }

  function renderButton(host) {
    if (!host || host.dataset.alphaeusKofiMounted === "true") {
      return;
    }

    addSharedStyles();
    host.dataset.alphaeusKofiMounted = "true";
    host.innerHTML = fallbackMarkup();
  }

  function mountInFooter(footer, message) {
    if (!footer || footer.querySelector(".alphaeus-kofi-support")) {
      return;
    }

    addSharedStyles();

    var wrapper = global.document.createElement("div");
    wrapper.className = "alphaeus-kofi-support";
    wrapper.setAttribute("aria-label", "Support these open projects");

    var copy = global.document.createElement("span");
    copy.className = "alphaeus-kofi-support__message";
    var lead = global.document.createElement("strong");
    lead.textContent = "Found this project helpful?";
    copy.appendChild(lead);
    if (message) {
      copy.appendChild(global.document.createTextNode(" " + message));
    }

    var buttonHost = global.document.createElement("div");
    buttonHost.className = "alphaeus-kofi-support__button";

    wrapper.appendChild(copy);
    wrapper.appendChild(buttonHost);
    footer.insertBefore(wrapper, footer.firstChild);
    renderButton(buttonHost);
  }

  function mount(options) {
    var settings = options || {};
    if (settings.target) {
      var target =
        typeof settings.target === "string"
          ? global.document.querySelector(settings.target)
          : settings.target;
      renderButton(target);
      return;
    }

    mountInFooter(
      settings.footer || global.document.querySelector("footer"),
      settings.message
    );
  }

  global.AlphaeusKofiSupport = {
    mount: mount,
    pageUrl: KOFI_URL,
  };

  function autoMount() {
    if (!scriptElement) {
      return;
    }

    var target = scriptElement.getAttribute("data-target");
    if (target) {
      mount({ target: target });
    } else if (scriptElement.hasAttribute("data-auto-footer")) {
      mount({
        message: scriptElement.getAttribute("data-message") || "",
      });
    }
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", autoMount, {
      once: true,
    });
  } else {
    autoMount();
  }
})(window);
