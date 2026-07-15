/**
 * Firebase config for Seeking Biblical Truth web vault (edit + save).
 *
 * Setup:
 * 1. Same Firebase project as AlpArcade (or a dedicated one) — free Spark tier OK
 * 2. Authentication → Sign-in method → enable Google
 * 3. Authentication → Settings → Authorized domains → add alphaeusng.github.io
 * 4. Firestore → paste rules from firestore.rules (this folder or FIREBASE.md)
 * 5. Project settings → Web app → paste config below
 * 6. Set enabled: true and allowedEmails to YOUR Google account(s)
 * 7. Commit + push alphaeusng.github.io
 *
 * Google sign-in is recommended: only emails in allowedEmails can write notes.
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
