/**
 * Firebase config for Conviction DCA Lab journal sync.
 * Runtime only — loaded by pages/dca-calculator.html.
 * Infra (rules, deploy): firebase/README.md
 *
 * Google sign-in copies the private journal to dcaJournals/{uid}.
 * The calculator still works fully offline in this browser.
 */
(function (global) {
    'use strict';

    global.DCA_FIREBASE_CONFIG = {
        enabled: true,
        apiKey: 'AIzaSyAWNQ_-0BW8VEZWZ7NfYaAyHK-Dwr3U6WA',
        authDomain: 'alparcade-cb87c.firebaseapp.com',
        projectId: 'alparcade-cb87c',
        storageBucket: 'alparcade-cb87c.firebasestorage.app',
        messagingSenderId: '89467004937',
        appId: '1:89467004937:web:3968ecc9048724e50370d8',
        measurementId: 'G-FSH0T9P43C'
    };
})(window);
