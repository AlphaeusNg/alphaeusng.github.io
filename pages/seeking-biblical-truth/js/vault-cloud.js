/**
 * Vault cloud layer — Google Auth + Firestore note save/load + optional GitHub commit.
 */
(function (global) {
  "use strict";

  const NOTES_COLLECTION = "vaultNotes";
  const GH_TOKEN_KEY = "sbt-github-pat";

  let db = null;
  let auth = null;
  let ready = false;
  let status = "off"; // off | connecting | online | error
  /** @type {firebase.User | null} */
  let user = null;
  /** @type {Set<Function>} */
  const listeners = new Set();

  function cfg() {
    return global.VAULT_FIREBASE_CONFIG || {};
  }

  function isConfigured() {
    const c = cfg();
    return !!(c.enabled && c.apiKey && c.apiKey !== "YOUR_API_KEY" && c.projectId && c.projectId !== "YOUR_PROJECT_ID");
  }

  function notify() {
    listeners.forEach((fn) => {
      try {
        fn(getAuthState());
      } catch (err) {
        console.warn("[VaultCloud] listener", err);
      }
    });
  }

  function setStatus(next) {
    if (status === next) return;
    status = next;
    notify();
  }

  function normalizeEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  function allowedEmails() {
    const list = cfg().allowedEmails;
    if (!Array.isArray(list)) return [];
    return list.map(normalizeEmail).filter(Boolean);
  }

  function canEdit() {
    if (!user || !user.email) return false;
    const email = normalizeEmail(user.email);
    const allow = allowedEmails();
    if (!allow.length) return false;
    return allow.includes(email);
  }

  function pathToDocId(path) {
    // Firestore doc ids cannot contain "/"
    return encodeURIComponent(String(path || "").replace(/\\/g, "/"));
  }

  function getAuthState() {
    return {
      status,
      ready,
      user,
      email: user?.email || null,
      displayName: user?.displayName || null,
      photoURL: user?.photoURL || null,
      canEdit: canEdit(),
      online: status === "online",
      configured: isConfigured(),
    };
  }

  async function init() {
    if (!isConfigured()) {
      setStatus("off");
      return false;
    }
    if (typeof firebase === "undefined") {
      console.warn("[VaultCloud] Firebase SDK missing");
      setStatus("error");
      return false;
    }
    if (ready) return true;

    setStatus("connecting");
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg());
      }
      db = firebase.firestore();
      auth = firebase.auth();

      auth.onAuthStateChanged((u) => {
        user = u;
        notify();
      });

      ready = true;
      setStatus("online");
      return true;
    } catch (err) {
      console.warn("[VaultCloud] init failed", err);
      ready = false;
      setStatus("error");
      return false;
    }
  }

  async function signInWithGoogle() {
    if (!auth) await init();
    if (!auth) throw new Error("Cloud not configured");
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await auth.signInWithPopup(provider);
    user = result.user;
    notify();
    return getAuthState();
  }

  async function signOut() {
    if (!auth) return;
    await auth.signOut();
    user = null;
    notify();
  }

  /**
   * Load note from Firestore by vault path.
   * @returns {Promise<{ content: string, updatedAt: number, updatedBy: string|null } | null>}
   */
  async function loadNote(path) {
    if (!ready || !db || !path) return null;
    try {
      const snap = await db.collection(NOTES_COLLECTION).doc(pathToDocId(path)).get();
      if (!snap.exists) return null;
      const d = snap.data() || {};
      return {
        content: typeof d.content === "string" ? d.content : "",
        updatedAt: d.updatedAt?.toMillis?.() || d.clientAt || 0,
        updatedBy: d.updatedBy || null,
        title: d.title || null,
      };
    } catch (err) {
      console.warn("[VaultCloud] loadNote failed", err);
      return null;
    }
  }

  /**
   * Save note content (editors only). Available from any device after Google login.
   */
  async function saveNote(path, content, meta = {}) {
    if (!ready || !db) throw new Error("Cloud offline");
    if (!canEdit()) throw new Error("Not authorized to edit — sign in with an allowed Google account");
    if (!path) throw new Error("Missing note path");

    // updatedBy must match request.auth.token.email exactly (Firestore rules)
    const payload = {
      path: String(path),
      content: String(content ?? ""),
      title: meta.title || path.split("/").pop() || path,
      updatedBy: user.email,
      updatedByUid: user.uid,
      clientAt: Date.now(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(NOTES_COLLECTION).doc(pathToDocId(path)).set(payload, { merge: true });
    return { ok: true, path };
  }

  function getGithubPat() {
    try {
      return sessionStorage.getItem(GH_TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }

  function setGithubPat(token) {
    try {
      if (token) sessionStorage.setItem(GH_TOKEN_KEY, token);
      else sessionStorage.removeItem(GH_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  /**
   * Commit Markdown to the Obsidian vault GitHub repo so Obsidian can pull.
   * Requires a PAT (session only — never written to Firestore).
   */
  async function pushNoteToGitHub(path, content, { message } = {}) {
    if (!canEdit()) throw new Error("Not authorized");
    const gh = cfg().github || {};
    const owner = gh.owner || "AlphaeusNg";
    const repo = gh.repo || "Seeking-Biblical-Truth";
    const branch = gh.branch || "main";

    let token = getGithubPat();
    if (!token) {
      token = window.prompt(
        "Paste a GitHub Personal Access Token (fine-grained: Contents read/write on Seeking-Biblical-Truth).\nStored only in this browser session — never sent to Firebase."
      );
      if (!token) throw new Error("No GitHub token");
      setGithubPat(token.trim());
      token = token.trim();
    }

    const apiPath = `https://api.github.com/repos/${owner}/${repo}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;

    // Get current SHA if file exists
    let sha = null;
    const getRes = await fetch(`${apiPath}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha || null;
    } else if (getRes.status !== 404) {
      if (getRes.status === 401 || getRes.status === 403) {
        setGithubPat("");
        throw new Error("GitHub token rejected — sign again with a valid PAT");
      }
      throw new Error(`GitHub read failed: ${getRes.status}`);
    }

    const body = {
      message: message || `web: update ${path}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiPath, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      if (putRes.status === 401 || putRes.status === 403) setGithubPat("");
      const errText = await putRes.text().catch(() => "");
      throw new Error(`GitHub push failed: ${putRes.status} ${errText.slice(0, 200)}`);
    }

    return { ok: true, path };
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.add(fn);
    return () => listeners.delete(fn);
  }

  global.VaultCloud = {
    init,
    isConfigured,
    signInWithGoogle,
    signOut,
    loadNote,
    saveNote,
    pushNoteToGitHub,
    getGithubPat,
    setGithubPat,
    getAuthState,
    canEdit,
    onChange,
  };
})(window);
