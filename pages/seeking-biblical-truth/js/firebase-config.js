/**
 * Firebase config for Seeking Biblical Truth web vault (edit + save).
 * Runtime only — loaded by index.html. Infra lives at ../../../firebase/
 *
 * Setup: see ../../../firebase/README.md
 * 1. Same Firebase project as AlpArcade (or a dedicated one) — free Spark tier OK
 * 2. Authentication → Sign-in method → enable Google
 * 3. Authorized domains → alphaeusng.github.io + localhost + 127.0.0.1
 * 4. Publish combined rules: firebase/firestore.rules (portfolio root)
 * 5. Project settings → Web app → paste config below
 * 6. Set enabled: true and allowedEmails to YOUR Google account(s)
 *    (must match isVaultEditor() emails in firebase/firestore.rules)
 * 7. Commit + push alphaeusng.github.io
 *
 * Google sign-in: only emails in allowedEmails can write notes.
 * Everyone else can still read the public vault.
 */
(function (global) {
  "use strict";

  global.VAULT_FIREBASE_CONFIG = {
    enabled: false,
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",

    /** Only these Google accounts can edit/save notes (lowercase). */
    allowedEmails: ["alphaolivegreen@gmail.com"],

    /**
     * GitHub repo that holds the Obsidian .md files (for optional "Push to GitHub").
     * Pushing requires a fine-grained PAT with Contents: Read and write on this repo.
     */
    github: {
      owner: "AlphaeusNg",
      repo: "Seeking-Biblical-Truth",
      branch: "main",
    },
  };
})(window);
