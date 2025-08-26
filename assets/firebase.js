<!-- /assets/firebase.js  (REPLACE WHOLE FILE) -->
<script>
(function () {
  // Let index.html wait on this
  let _resolveReady;
  window.__fbReady = new Promise(res => (_resolveReady = res));

  try {
    // Required: config + SDK v8 (firebase-app.js & firebase-auth.js) already loaded
    if (!window.firebaseConfig) throw new Error("firebaseConfig missing");
    if (!window.firebase || !window.firebase.initializeApp)
      throw new Error("Firebase SDK not loaded");

    // Initialize or reuse
    const app =
      (window.firebase.apps && window.firebase.apps.length)
        ? window.firebase.app()
        : window.firebase.initializeApp(window.firebaseConfig);

    const auth = window.firebase.auth();
    try { auth.useDeviceLanguage && auth.useDeviceLanguage(); } catch(_) {}

    const provider = new window.firebase.auth.GoogleAuthProvider();

    // ---- Expose compat API expected by index/app ----
    window.AppAuth = auth;
    window.AppGoogleProvider = provider;
    window.AppOnAuthChanged = auth.onAuthStateChanged.bind(auth);
    window.AppSignIn = async function () {
      try {
        // Popup first; Safari/iOS may block—fallback to redirect
        return await auth.signInWithPopup(provider);
      } catch (e) {
        return auth.signInWithRedirect(provider);
      }
    };
    window.AppSignOut = function () { return auth.signOut(); };

    // Legacy aliases (if any older code uses them)
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.googleProvider = provider;

    console.log("[firebase.js] initialized");
    _resolveReady();
  } catch (e) {
    console.error("[firebase.js] bootstrap error:", e);
    // Resolve so the UI won't hang forever (index logs the failure)
    _resolveReady();

    // Log into the local Admin diagnostics buffer
    try {
      const KEY = "ican:error:log";
      const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
      arr.unshift({
        t: new Date().toISOString(),
        kind: "firebase-bootstrap",
        msg: String(e.message || e)
      });
      if (arr.length > 50) arr.length = 50;
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (_) {}
  }
})();
</script>