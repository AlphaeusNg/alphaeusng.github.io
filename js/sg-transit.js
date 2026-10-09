/**
 * Comments and share controls for the Singapore transit note.
 * Comments live at posts/sg-transit-one-fare/comments on alparcade-cb87c.
 * Rules: firebase/firestore.rules. The feedback inbox is a separate collection.
 */
(function (global) {
  "use strict";

  var POST_ID = "sg-transit-one-fare";
  var PAGE_URL = "https://alphaeusng.github.io/pages/sg-transit.html";
  var OWNER_EMAIL = "alphaolivegreen@gmail.com";
  var COOLDOWN_MS = 30000;
  var COOLDOWN_KEY = "alphaeus-transit-comment-at-v1";
  var MIN_BODY = 4;
  var MAX_BODY = 1000;
  var MAX_NAME = 40;

  var form = global.document.getElementById("comment-form");
  var nameInput = global.document.getElementById("comment-name");
  var bodyInput = global.document.getElementById("comment-body");
  var websiteInput = global.document.getElementById("website");
  var statusNode = global.document.getElementById("comment-status");
  var listNode = global.document.getElementById("comment-list");
  var submitButton = global.document.getElementById("comment-submit");
  var moderateButton = global.document.getElementById("comment-moderate");
  var shareStatus = global.document.getElementById("share-status");
  var shareNative = global.document.getElementById("share-native");
  var shareCopy = global.document.getElementById("share-copy");

  var database = null;
  var auth = null;
  var owner = false;
  var comments = [];

  function setStatus(message, kind) {
    statusNode.textContent = message;
    statusNode.className = "transit-status" + (kind ? " is-" + kind : "");
  }

  function remainingCooldown() {
    try {
      var last = Number(global.localStorage.getItem(COOLDOWN_KEY) || 0);
      return Math.max(0, COOLDOWN_MS - (Date.now() - last));
    } catch (_error) {
      return 0;
    }
  }

  function rememberComment() {
    try {
      global.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    } catch (_error) {
      /* A blocked storage API should not hide a posted comment. */
    }
  }

  function shareDone(message) {
    shareStatus.textContent = message;
  }

  function copyLink() {
    var done = function () {
      shareDone("Link copied.");
    };
    if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(PAGE_URL).then(done).catch(fallbackCopy);
      return;
    }
    fallbackCopy();
  }

  function fallbackCopy() {
    var field = global.document.createElement("textarea");
    field.value = PAGE_URL;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-10000px";
    global.document.body.appendChild(field);
    field.select();
    try {
      global.document.execCommand("copy");
      shareDone("Link copied.");
    } catch (_error) {
      shareDone(PAGE_URL);
    }
    field.remove();
  }

  if (global.navigator.share) {
    shareNative.hidden = false;
    shareNative.addEventListener("click", function () {
      global.navigator
        .share({
          title: "One fare for bus, MRT, and bus",
          text: "How a Singapore bus, MRT, and bus can stay one journey.",
          url: PAGE_URL,
        })
        .then(function () {
          shareDone("Share sheet opened.");
        })
        .catch(function (error) {
          if (error && error.name === "AbortError") return;
          copyLink();
        });
    });
  }

  shareCopy.addEventListener("click", copyLink);

  function formatWhen(value) {
    if (!value || typeof value.toDate !== "function") return "Just now";
    return value.toDate().toLocaleString("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function renderComments() {
    listNode.replaceChildren();
    if (!comments.length) {
      var empty = global.document.createElement("li");
      empty.className = "transit-empty";
      empty.textContent = "No comments yet. The first note can be yours.";
      listNode.appendChild(empty);
      return;
    }
    comments.forEach(function (entry) {
      var item = global.document.createElement("li");
      item.className = "transit-comment";

      var header = global.document.createElement("header");
      var name = global.document.createElement("strong");
      name.textContent = entry.name;
      var when = global.document.createElement("time");
      when.dateTime = entry.createdAt && entry.createdAt.toDate
        ? entry.createdAt.toDate().toISOString()
        : "";
      when.textContent = formatWhen(entry.createdAt);
      header.append(name, when);

      var body = global.document.createElement("p");
      body.textContent = entry.body;
      item.append(header, body);

      if (owner) {
        var remove = global.document.createElement("button");
        remove.type = "button";
        remove.className = "transit-delete";
        remove.textContent = "Remove comment";
        remove.addEventListener("click", function () {
          if (!global.confirm("Remove this comment?")) return;
          entry.ref
            .delete()
            .catch(function () {
              setStatus("That comment could not be removed.", "error");
            });
        });
        item.appendChild(remove);
      }
      listNode.appendChild(item);
    });
  }

  function watchComments() {
    database
      .collection("posts")
      .doc(POST_ID)
      .collection("comments")
      .orderBy("createdAt", "desc")
      .limit(40)
      .onSnapshot(
        function (snapshot) {
          comments = snapshot.docs.map(function (doc) {
            var data = doc.data() || {};
            return {
              ref: doc.ref,
              name: String(data.name || "Anonymous"),
              body: String(data.body || ""),
              createdAt: data.createdAt || null,
            };
          });
          renderComments();
        },
        function () {
          setStatus(
            "Comments could not load. The note is still here, and the share links below still work.",
            "error"
          );
        }
      );
  }

  function paintModerate() {
    if (!auth || !auth.currentUser) {
      owner = false;
      moderateButton.hidden = false;
      moderateButton.textContent = "Sign in to moderate";
      renderComments();
      return;
    }
    var user = auth.currentUser;
    owner = user.email === OWNER_EMAIL && user.emailVerified === true;
    moderateButton.hidden = false;
    moderateButton.textContent = owner
      ? "Sign out"
      : "This account cannot remove comments. Sign out";
    renderComments();
  }

  function startFirebase() {
    if (!global.firebase || !global.firebase.initializeApp) {
      setStatus(
        "Comments need Firebase, and it did not load. You can still share the note.",
        "error"
      );
      submitButton.disabled = true;
      moderateButton.disabled = true;
      return;
    }
    var app = global.firebase.initializeApp({
      apiKey: "AIzaSyAWNQ_-0BW8VEZWZ7NfYaAyHK-Dwr3U6WA",
      authDomain: "alparcade-cb87c.firebaseapp.com",
      projectId: "alparcade-cb87c",
      storageBucket: "alparcade-cb87c.firebasestorage.app",
      messagingSenderId: "89467004937",
      appId: "1:89467004937:web:3968ecc9048724e50370d8",
    });
    database = global.firebase.firestore(app);
    auth = global.firebase.auth(app);
    auth.onAuthStateChanged(paintModerate);
    watchComments();
  }

  moderateButton.addEventListener("click", function () {
    if (!auth) return;
    if (auth.currentUser) {
      auth.signOut().catch(function () {
        setStatus("Sign-out did not finish.", "error");
      });
      return;
    }
    var provider = new global.firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function () {
      setStatus("Google sign-in did not finish. Comments can still be posted without an account.", "error");
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = nameInput.value.trim().replace(/\s+/g, " ");
    var body = bodyInput.value.trim();

    if (websiteInput.value) {
      form.reset();
      setStatus("Comment posted.", "ok");
      return;
    }
    if (!name) name = "Anonymous";
    if (name.length > MAX_NAME) {
      setStatus("Use a name of 40 characters or fewer.", "error");
      nameInput.focus();
      return;
    }
    if (body.length < MIN_BODY || body.length > MAX_BODY) {
      setStatus("Write a comment of 4 to 1000 characters.", "error");
      bodyInput.focus();
      return;
    }
    var wait = remainingCooldown();
    if (wait > 0) {
      setStatus(
        "Wait " + Math.ceil(wait / 1000) + " seconds before posting again.",
        "error"
      );
      return;
    }
    if (!database) {
      setStatus("Comments are unavailable in this browser right now.", "error");
      return;
    }

    submitButton.disabled = true;
    setStatus("Posting your comment…", "");
    database
      .collection("posts")
      .doc(POST_ID)
      .collection("comments")
      .add({
        name: name,
        body: body,
        createdAt: global.firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(function () {
        rememberComment();
        bodyInput.value = "";
        setStatus("Comment posted.", "ok");
      })
      .catch(function () {
        setStatus(
          "The comment was not saved. Check the connection, then try again.",
          "error"
        );
      })
      .then(function () {
        submitButton.disabled = false;
      });
  });

  startFirebase();
})(window);
