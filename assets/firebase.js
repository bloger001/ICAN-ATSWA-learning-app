// assets/firebase.js  — robust compat bootstrap for GitHub Pages
(function () {
  const ERR = (m) => { console.error("[firebase.js]", m); };

  // --- 1) Require config (you set this in index.html before loading this file)
  if (!window.firebaseConfig) {
    throw new Error("firebaseConfig missing — set window.firebaseConfig on the page before loading assets/firebase.js");
  }

  // --- 2) Load Firebase compat SDKs if needed (works on GitHub Pages)
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = false;            // keep order
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  async function ensureCompat() {
    if (window.firebase?.apps?.length) return; // already loaded
    // Use a stable recent version of the compat build
    const base = "https://www.gstatic.com/firebasejs/10.12.2";
    await loadScript(`${base}/firebase-app-compat.js`);
    await loadScript(`${base}/firebase-auth-compat.js`);
  }

  // --- 3) Init + export globals expected by the app
  async function boot() {
    await ensureCompat();

    // Initialize (idempotent)
    const app = window.firebase.apps?.length
      ? window.firebase.app()
      : window.firebase.initializeApp(window.firebaseConfig);

    const auth = window.firebase.auth();
    const provider = new window.firebase.auth.GoogleAuthProvider();

    // Expose friendly, app-level helpers (used by index.html)
    window.AppAuth = auth;
    window.AppGoogleProvider = provider;

    // onAuthChanged signature the home page uses
    window.AppOnAuthChanged = (/* authInstanceIgnored */, cb) => auth.onAuthStateChanged(cb);

    // Sign in: try popup first, then redirect (iOS fallback)
    window.AppSignIn = async () => {
      try { return await auth.signInWithPopup(provider); }
      catch (e) { return auth.signInWithRedirect(provider); }
    };

    window.AppSignOut = () => auth.signOut();

    // Legacy aliases kept for older pages/components
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.googleProvider = provider;
    window.signInWithPopup = (prov) => auth.signInWithPopup(prov || provider);
    window.signOutFirebase = () => auth.signOut();
    window.firebaseOnAuthStateChanged = (/*authIgnored*/, cb) => auth.onAuthStateChanged(cb);

    // Small readiness flag + event for diagnostics/UI
    window.__firebase_bootstrapped__ = true;
    document.dispatchEvent(new Event("firebase-ready"));
  }

  boot().catch((e) => {
    ERR(e && e.message ? e.message : e);
    // surface a minimal, user-visible hint (also logged by index diagnostics)
    try { alert("Auth bootstrap failed. Please refresh."); } catch (_) {}
  });
})();