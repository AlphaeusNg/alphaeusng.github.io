(function (global) {
  "use strict";

  var PROJECTS = [
    "Portfolio",
    "Conviction",
    "Seeking Biblical Truth",
    "KoboForge",
    "AlpArcade",
    "VerseKeep",
    "ChristoDay",
    "CardFitSG",
  ];
  var PROJECT_PATHS = {
    Portfolio: "/",
    Conviction: "/pages/conviction.html",
    "Seeking Biblical Truth": "/pages/seeking-biblical-truth/",
    KoboForge: "/KoboForge/",
    AlpArcade: "/AlpArcade/",
    VerseKeep: "/VerseKeep/",
    ChristoDay: "/ChristoDay/",
    CardFitSG: "/CardFitSG/",
  };
  var PORTFOLIO_ORIGIN = "https://alphaeusng.github.io";
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyAWNQ_-0BW8VEZWZ7NfYaAyHK-Dwr3U6WA",
    authDomain: "alparcade-cb87c.firebaseapp.com",
    projectId: "alparcade-cb87c",
    storageBucket: "alparcade-cb87c.firebasestorage.app",
    messagingSenderId: "89467004937",
    appId: "1:89467004937:web:3968ecc9048724e50370d8",
    measurementId: "G-FSH0T9P43C",
  };
  var COOLDOWN_KEY = "alphaeus-feedback-last-submit-v1";
  var COOLDOWN_MS = 30000;
  var INIT_FALLBACK_MESSAGE =
    "The private inbox could not load. You can still use the prefilled GitHub draft below after writing your feedback; your email is not included.";
  var WRITE_FALLBACK_MESSAGE =
    "The private inbox is unavailable. You can use the prefilled GitHub draft below; your email is not included.";

  var form = global.document.getElementById("feedback-form");
  var projectSelect = global.document.getElementById("project");
  var typeSelect = global.document.getElementById("feedback-type");
  var messageInput = global.document.getElementById("message");
  var contactInput = global.document.getElementById("contact");
  var websiteInput = global.document.getElementById("website");
  var submitButton = global.document.getElementById("submit-button");
  var status = global.document.getElementById("form-status");
  var githubFallback = global.document.getElementById("github-fallback");
  var title = global.document.getElementById("feedback-title");
  var sourceLink = global.document.getElementById("source-link");
  var backLink = global.document.getElementById("back-link");
  var messageCount = global.document.getElementById("message-count");
  var params = new global.URLSearchParams(global.location.search);

  function knownProject(value) {
    return PROJECTS.indexOf(value) >= 0 ? value : "Portfolio";
  }

  function projectUrl(project) {
    return PORTFOLIO_ORIGIN + PROJECT_PATHS[project];
  }

  function safeSourceUrl(raw, project) {
    if (!raw) return projectUrl(project);
    try {
      var parsed = new global.URL(raw);
      if (parsed.origin === PORTFOLIO_ORIGIN) {
        parsed.search = "";
        parsed.hash = "";
        return parsed.toString();
      }
    } catch (_error) {
      return projectUrl(project);
    }
    return projectUrl(project);
  }

  var initialProject = knownProject(params.get("project"));
  var sourceUrl = safeSourceUrl(params.get("from"), initialProject);
  var database = null;

  function setStatus(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind || "";
  }

  function currentPayload() {
    return {
      project: knownProject(projectSelect.value),
      type: typeSelect.value,
      rating: selectedRating(),
      message: messageInput.value.trim(),
      sourceUrl: sourceUrl,
    };
  }

  function fallbackUrl(payload) {
    var titleText = "Feedback — " + payload.project + ": " + payload.type;
    var body = [
      "## Feedback",
      "",
      payload.message,
      "",
      "**Project:** " + payload.project,
      "**Type:** " + payload.type,
      "**Usefulness:** " + (payload.rating || "Not rated"),
      "**Source:** " + payload.sourceUrl,
    ].join("\n");
    return (
      "https://github.com/AlphaeusNg/alphaeusng.github.io/issues/new" +
      "?title=" +
      encodeURIComponent(titleText) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function offerGithubFallback(payload, message) {
    githubFallback.href = fallbackUrl(payload);
    githubFallback.hidden = false;
    setStatus(message, "error");
  }

  function refreshOfflineFallback() {
    if (database) return;
    githubFallback.href = fallbackUrl(currentPayload());
  }

  function personalize(project) {
    title.textContent = "Share feedback about " + project;
    global.document.title = project + " feedback · Alphaeus Ng";
    sourceLink.textContent = project;
    if (project !== initialProject) {
      sourceUrl = projectUrl(project);
    }
    sourceLink.href = sourceUrl;
    backLink.href = sourceUrl;
    backLink.textContent = "← Back to " + project;
  }

  function updateCount() {
    messageCount.textContent = messageInput.value.length + " / 4000";
  }

  function selectedRating() {
    var selected = form.querySelector('input[name="rating"]:checked');
    return selected ? Number(selected.value) : 0;
  }

  function remainingCooldown() {
    try {
      var lastSubmit = Number(global.localStorage.getItem(COOLDOWN_KEY) || 0);
      return Math.max(0, COOLDOWN_MS - (Date.now() - lastSubmit));
    } catch (_error) {
      return 0;
    }
  }

  function rememberSubmit() {
    try {
      global.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    } catch (_error) {
      // Storage may be unavailable in privacy mode; submission can still proceed.
    }
  }

  function initializeFirebase() {
    try {
      if (!global.firebase || !global.firebase.firestore) {
        offerGithubFallback(currentPayload(), INIT_FALLBACK_MESSAGE);
        return;
      }
      if (!global.firebase.apps.length) {
        global.firebase.initializeApp(FIREBASE_CONFIG);
      }
      database = global.firebase.firestore();
    } catch (_error) {
      database = null;
      offerGithubFallback(currentPayload(), INIT_FALLBACK_MESSAGE);
    }
  }

  projectSelect.value = initialProject;
  personalize(initialProject);
  updateCount();
  initializeFirebase();

  projectSelect.addEventListener("change", function () {
    personalize(knownProject(projectSelect.value));
    refreshOfflineFallback();
  });
  typeSelect.addEventListener("change", refreshOfflineFallback);
  messageInput.addEventListener("input", function () {
    updateCount();
    refreshOfflineFallback();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("", "");
    githubFallback.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please complete the highlighted field.", "error");
      return;
    }

    if (websiteInput.value) {
      form.reset();
      projectSelect.value = initialProject;
      personalize(initialProject);
      updateCount();
      setStatus("Thank you — your feedback has been sent.", "success");
      return;
    }

    var wait = remainingCooldown();
    if (wait > 0) {
      setStatus(
        "Please wait " + Math.ceil(wait / 1000) + " seconds before sending again.",
        "error"
      );
      return;
    }

    if (!database) {
      offerGithubFallback(currentPayload(), WRITE_FALLBACK_MESSAGE);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus("Sending your feedback…", "");

    var payload = {
      schema: 1,
      project: knownProject(projectSelect.value),
      type: typeSelect.value,
      rating: selectedRating(),
      message: messageInput.value.trim(),
      contact: contactInput.value.trim(),
      sourceUrl: sourceUrl,
      submittedAt: global.firebase.firestore.FieldValue.serverTimestamp(),
    };

    database
      .collection("feedback")
      .add(payload)
      .then(function (result) {
        rememberSubmit();
        messageInput.value = "";
        contactInput.value = "";
        typeSelect.value = "Suggestion";
        form.querySelectorAll('input[name="rating"]').forEach(function (input) {
          input.checked = false;
        });
        updateCount();
        setStatus(
          "Thank you — your feedback has been sent. Reference " +
            result.id.slice(-6).toUpperCase() +
            ".",
          "success"
        );
      })
      .catch(function () {
        offerGithubFallback(payload, WRITE_FALLBACK_MESSAGE);
      })
      .finally(function () {
        submitButton.disabled = false;
        submitButton.textContent = "Send feedback";
      });
  });
})(window);
