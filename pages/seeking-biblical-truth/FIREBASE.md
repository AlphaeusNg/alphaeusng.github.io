# Moved

Firebase setup for the Seeking Biblical Truth web editor (and the **shared** rules with AlpArcade) now lives under the portfolio infra folder:

**[`../../firebase/README.md`](../../firebase/README.md)**

| What | New path |
|------|----------|
| Setup docs | [`firebase/README.md`](../../firebase/README.md) |
| Combined rules (scores + vaultNotes) | [`firebase/firestore.rules`](../../firebase/firestore.rules) |
| Indexes | [`firebase/firestore.indexes.json`](../../firebase/firestore.indexes.json) |
| CLI | `firebase.json` + `.firebaserc` at **portfolio repo root** |
| Runtime config (this page) | [`js/firebase-config.js`](./js/firebase-config.js) — unchanged |
