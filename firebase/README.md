# Firebase — portfolio / shared backend

Infra for the **shared** Firebase project used by:

| Product | Collections | Runtime config |
|---------|-------------|----------------|
| **AlpArcade** | `scores`, `players` | `/home/alph/projects/AlpArcade/js/firebase-config.js` |
| **Seeking Biblical Truth** viewer | `vaultNotes` | `pages/seeking-biblical-truth/js/firebase-config.js` |

| Path | Role |
|------|------|
| `firestore.rules` | **Combined** rules (arcade + vault) — deploy this when sharing one project |
| `firestore.indexes.json` | Arcade scoreboard composite index |
| `../firebase.json` | Firebase CLI entry (portfolio repo root) |
| `../.firebaserc` | Default project `alparcade-cb87c` |

> If AlpArcade is the **only** consumer of the project, you may deploy arcade-only rules from  
> `/home/alph/projects/AlpArcade/firebase/`.  
> If the vault editor is enabled on the same project, **always deploy this combined file**.

## Deploy

```bash
cd /home/alph/projects/alphaeusng.github.io
npx firebase-tools login   # once
npx firebase-tools deploy --only firestore:rules
npx firebase-tools deploy --only firestore:indexes
```

Console: [Firestore Rules](https://console.firebase.google.com/project/alparcade-cb87c/firestore/rules) → paste `firestore.rules` → **Publish**.

### Score write bug (fixed in these rules)

`validScoreWrite` **must** take `scoreId` as an argument and be called as
`validScoreWrite(scoreId)`. Path wildcards are not visible inside top-level
functions; omitting the argument caused permanent `permission-denied` on scores
while username (`players`) writes could still succeed.

## Vault editor (Seeking Biblical Truth)

Runtime config: [`../pages/seeking-biblical-truth/js/firebase-config.js`](../pages/seeking-biblical-truth/js/firebase-config.js)

1. Same project as arcade (or dedicated) — free Spark tier OK  
2. **Authentication → Google** enabled  
3. Authorized domains: `alphaeusng.github.io`, `localhost`, `127.0.0.1`  
4. Publish **these** combined rules  
5. Keep `isVaultEditor()` email list **identical** to `allowedEmails` in the runtime config  
6. Set `enabled: true` in `firebase-config.js`, commit + push portfolio  

### Use the editor

1. https://alphaeusng.github.io/pages/seeking-biblical-truth/  
2. **Sign in with Google** (allowlisted account)  
3. Open a note → **Edit** → **Save to cloud**  
4. Optional **Push to GitHub** (PAT in session only) so Obsidian can `git pull`  

### Load priority for a note body

1. Firestore cloud save (if present)  
2. GitHub raw `main` (if live fetch enabled)  
3. Snapshot inside `vault-data.json`  

## Security

- Client `apiKey` in the repo is expected; **rules** enforce who can write  
- Public read of vault notes is intentional; tighten `allow read` if you need private notes  
- Never commit PATs or service-account JSON  

## App Check

If Firestore **enforcement is ON** without App Check tokens, **all** client writes fail with permission-denied.  
Turn enforcement **OFF** until App Check is wired for both static sites.
