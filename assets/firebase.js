<script>
(function () {
  // Your Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
    authDomain: "ican-kit-prep.firebaseapp.com",
    databaseURL: "https://ican-kit-prep-default-rtdb.firebaseio.com",
    projectId: "ican-kit-prep",
    storageBucket: "ican-kit-prep.appspot.com",          // ← fixed
    messagingSenderId: "354385037521",
    appId: "1:354385037521:web:f3a7265f66983942581df0",
    measurementId: "G-LN8E2R4B7X"
  };

  // Guards: ensure compat SDKs are present
  if (!window.firebase || !firebase.app || !firebase.auth || !firebase.firestore) {
    console.error("[firebase.js] Firebase compat SDKs not loaded or out of order.");
    window.__FIREBASE_BOOT_ERROR__ = "SDKs not loaded";
    return;
  }

  try {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);

      // Firestore: safe default to ignore undefined fields (prevents subtle errors)
      try { firebase.firestore().settings({ ignoreUndefinedProperties: true }); } catch (_) {}

      // Persist auth (GitHub Pages friendly)
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);

      // Optional analytics (runs only if analytics compat script is loaded)
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
</script>