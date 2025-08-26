// assets/firebase.js  (compat SDK initializer)
// Make sure your pages load the compat CDNs BEFORE this file.

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
    authDomain: "ican-kit-prep.firebaseapp.com",
    databaseURL: "https://ican-kit-prep-default-rtdb.firebaseio.com",
    projectId: "ican-kit-prep",
    storageBucket: "ican-kit-prep.appspot.com",  // fixed
    messagingSenderId: "354385037521",
    appId: "1:354385037521:web:f3a7265f66983942581df0",
    measurementId: "G-LN8E2R4B7X"
  };

  // Guards: ensure compat SDKs are loaded
  if (!window.firebase || !firebase.app || !firebase.auth || !firebase.firestore) {
    console.error("[firebase.js] Firebase compat SDKs not loaded or out of order.");
    window.__FIREBASE_BOOT_ERROR__ = "SDKs not loaded";
    return;
  }

  try {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);

      // Firestore safety (prevents crashes on undefined fields)
      try { firebase.firestore().settings({ ignoreUndefinedProperties: true }); } catch (_) {}

      // Keep user signed in on GitHub Pages
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);

      // Optional analytics (only if analytics compat is included)
      if (firebase.analytics && firebaseConfig.measurementId) {
        try { firebase.analytics(); } catch (e) { console.warn("[firebase.js] analytics init:", e.message); }
      }
      console.log("[firebase.js] Initialized default app.");
    }
  } catch (e) {
    console.error("[firebase.js] initializeApp failed:", e);
    window.__FIREBASE_BOOT_ERROR__ = e.message || String(e);
  }
})();