/**
 * Optional Google/Firestore sync for the DCA Lab journal.
 *
 * One private document per signed-in user: dcaJournals/{uid}.
 * Local storage remains the working copy; cloud is a replica so phone and
 * computer can catch up the same fills. Missing SDK, rules, or network must
 * never block logging in this tab.
 */
(function (global) {
    'use strict';

    const COLLECTION = 'dcaJournals';
    const SCHEMA = 1;
    const MAX_JSON_CHARS = 900_000;
    const PUSH_DELAY_MS = 700;

    let db = null;
    let auth = null;
    let user = null;
    let unsubSnap = null;
    let pushTimer = null;
    let lastPushedMs = 0;
    let initPromise = null;
    let hooks = {
        onUser: null,
        onRemote: null,
        onStatus: null
    };

    function cfg() {
        return global.DCA_FIREBASE_CONFIG || {};
    }

    function isConfigured() {
        return Boolean(cfg().enabled && cfg().apiKey && cfg().projectId && cfg().apiKey !== 'YOUR_API_KEY');
    }

    function setStatus(kind, message) {
        if (typeof hooks.onStatus === 'function') hooks.onStatus(kind, message, user);
    }

    function notifyUser() {
        if (typeof hooks.onUser === 'function') hooks.onUser(user);
    }

    function sanitizeState(state) {
        const payload = {
            schema: SCHEMA,
            userId: user && user.uid,
            updatedMs: Number(state && state.updatedAt) || Date.now(),
            settings: state && state.settings && typeof state.settings === 'object' ? state.settings : {},
            months: state && state.months && typeof state.months === 'object' ? state.months : {},
            ledger: Array.isArray(state && state.ledger) ? state.ledger : []
        };
        const encoded = JSON.stringify(payload);
        if (encoded.length > MAX_JSON_CHARS) {
            throw new Error('Cloud journal is too large to sync. Export CSV and trim older rows.');
        }
        return payload;
    }

    function fromCloud(data) {
        if (!data || typeof data !== 'object') return null;
        return {
            settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
            months: data.months && typeof data.months === 'object' ? data.months : {},
            ledger: Array.isArray(data.ledger) ? data.ledger : [],
            updatedAt: Number(data.updatedMs) || 0
        };
    }

    function docRef() {
        if (!db || !user) return null;
        return db.collection(COLLECTION).doc(user.uid);
    }

    async function pull() {
        const ref = docRef();
        if (!ref) return null;
        const snap = await ref.get();
        return snap.exists ? fromCloud(snap.data()) : null;
    }

    async function push(state) {
        const ref = docRef();
        if (!ref || !state) return false;
        const payload = sanitizeState(state);
        payload.updatedAt = global.firebase.firestore.FieldValue.serverTimestamp();
        lastPushedMs = payload.updatedMs;
        await ref.set(payload, { merge: false });
        return true;
    }

    function pushSoon(state) {
        if (!user || !db) return;
        global.clearTimeout(pushTimer);
        pushTimer = global.setTimeout(() => {
            pushTimer = null;
            push(state).catch((error) => {
                console.warn('[DCA Lab] Cloud journal could not be saved.', error);
                setStatus('error', 'Cloud save failed. This tab still has the fill.');
            });
        }, PUSH_DELAY_MS);
    }

    function stopListening() {
        if (typeof unsubSnap === 'function') unsubSnap();
        unsubSnap = null;
    }

    function listen() {
        stopListening();
        const ref = docRef();
        if (!ref) return;
        unsubSnap = ref.onSnapshot((snap) => {
            if (!snap.exists || snap.metadata.hasPendingWrites) return;
            const remote = fromCloud(snap.data());
            if (!remote || Number(remote.updatedAt) <= lastPushedMs) return;
            lastPushedMs = Number(remote.updatedAt) || lastPushedMs;
            if (typeof hooks.onRemote === 'function') hooks.onRemote(remote);
        }, (error) => {
            console.warn('[DCA Lab] Cloud journal listener failed.', error);
            setStatus('error', 'Live sync paused. Fills still save on this device.');
        });
    }

    async function afterSignIn() {
        setStatus('syncing', user.email
            ? `Signed in as ${user.email}. Syncing journal…`
            : 'Signed in. Syncing journal…');
        try {
            const remote = await pull();
            if (remote && typeof hooks.onRemote === 'function') hooks.onRemote(remote);
            listen();
            setStatus('ready', user.email
                ? `Syncing with ${user.email}. Phone and computer share this journal.`
                : 'Journal is syncing across your signed-in devices.');
        } catch (error) {
            console.warn('[DCA Lab] Cloud journal pull failed.', error);
            setStatus('error', 'Signed in, but the cloud copy could not load yet.');
        }
    }

    function init(options = {}) {
        hooks = { ...hooks, ...options };
        if (!isConfigured()) {
            setStatus('off', 'Journal stays in this browser. Cloud sync is not configured.');
            return Promise.resolve(false);
        }
        if (initPromise) return initPromise;
        initPromise = (async () => {
            if (typeof global.firebase === 'undefined' || !global.firebase.auth || !global.firebase.firestore) {
                setStatus('off', 'Journal stays in this browser until Google sync can load.');
                return false;
            }
            try {
                if (!global.firebase.apps.length) {
                    global.firebase.initializeApp(cfg());
                }
                db = global.firebase.firestore();
                auth = global.firebase.auth();
                auth.onAuthStateChanged(async (nextUser) => {
                    user = nextUser;
                    notifyUser();
                    if (!user) {
                        stopListening();
                        setStatus('off', 'Journal stays in this browser until you sign in.');
                        return;
                    }
                    await afterSignIn();
                });
                return true;
            } catch (error) {
                console.warn('[DCA Lab] Cloud sync could not start.', error);
                setStatus('off', 'Journal stays in this browser. Cloud sync could not start.');
                return false;
            }
        })();
        return initPromise;
    }

    async function signIn() {
        if (!auth) await init();
        if (!auth) throw new Error('Google sync is unavailable in this browser.');
        const provider = new global.firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await auth.signInWithPopup(provider);
    }

    async function signOut() {
        stopListening();
        if (auth) await auth.signOut();
        user = null;
        notifyUser();
        setStatus('off', 'Signed out. This browser still has the local journal.');
    }

    global.DcaCloud = {
        isConfigured,
        init,
        signIn,
        signOut,
        push,
        pushSoon,
        pull,
        user() { return user; }
    };
})(window);
