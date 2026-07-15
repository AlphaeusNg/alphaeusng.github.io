# Seeking Biblical Truth — Firebase web editor

Edit notes on the public site from any device. Sign in with **Google**. Only allowlisted emails can save.

## Is Google login OK?

**Yes — recommended.** Benefits:

- You use your real Google account (no extra password to manage)
- Firestore rules check `email` + `email_verified`
- Random visitors can **read** the vault but cannot **write**
- Arcade strangers can keep using **Anonymous** auth (separate from this)

Only put emails you control in `allowedEmails` and in `firestore.rules`.

## One-time setup

### 1. Firebase project

Use the **same project as AlpArcade** (simplest) or a dedicated project.

1. [Firebase Console](https://console.firebase.google.com/)
2. Project settings → Your apps → Web (or add a second web app: `SBT Vault`)
3. Copy the config object

### 2. Enable Google sign-in

1. **Authentication** → Sign-in method → **Google** → Enable  
2. Support email: your Gmail  
3. **Settings** → Authorized domains → ensure:
   - `localhost`
   - `alphaeusng.github.io`

### 3. Firestore rules

1. **Firestore** → Rules  
2. Paste `firestore.rules` from this folder (includes scores + vaultNotes if one project)  
3. Change the email list in `isVaultEditor()` if needed  
4. **Publish**

### 4. Link the site

Edit `js/firebase-config.js` in this folder:

```js
enabled: true,
apiKey: "...",
// ... rest of config
allowedEmails: ["alphaolivegreen@gmail.com"],
```

Commit + push `alphaeusng.github.io`. Confirm footer version bumped.

### 5. Use the editor

1. Open https://alphaeusng.github.io/pages/seeking-biblical-truth/  
2. **Sign in with Google** (must be an allowlisted email)  
3. Open a note → **Edit** → change Markdown → **Save to cloud**  
4. From another device/browser: sign in → open note → you see the cloud version  

### 6. Sync back to Obsidian (optional)

**Save to cloud** writes Firestore (works from anywhere after login).

**Push to GitHub** commits the `.md` into `AlphaeusNg/Seeking-Biblical-Truth` so Obsidian can `git pull`:

1. GitHub → Settings → Developer settings → Personal access tokens  
2. Fine-grained PAT: resource owner you, only repo `Seeking-Biblical-Truth`, permission **Contents: Read and write**  
3. On the vault page (while signed in as editor): **Push to GitHub** → paste PAT once (session only)  
4. Locally: pull the vault in Obsidian Git / terminal  

Never commit the PAT. It is only stored in `sessionStorage` for that browser tab session.

## Load priority for a note body

1. Firestore cloud save (if present)  
2. GitHub raw `main` (if live fetch enabled)  
3. Snapshot inside `vault-data.json`  

## Security notes

- `apiKey` in the repo is expected for client apps; **rules** enforce who can write  
- Keep `allowedEmails` and `firestore.rules` email list identical  
- Public read of note content is intentional (public vault). If you need private notes, change `allow read` to `isVaultEditor()` only  
