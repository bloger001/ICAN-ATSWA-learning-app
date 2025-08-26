<script>
// --- firebase.js (drop-in) ---
(() => {
  // 1) Guard: require config injected by you (window.firebaseConfig)
  if (!window.firebaseConfig) {
    throw new Error("firebaseConfig missing — set window.firebaseConfig in index.html before scripts.");
  }

  // 2) Load SDKs (you already serve them via CDN or bundler — if you inline, keep as-is)
  // If you’re already importing modules elsewhere, this block is harmless.

  // 3) Initialize
  const app = window.firebase?.apps?.length
    ? window.firebase.app()
    : window.firebase.initializeApp(window.firebaseConfig);

  const auth = window.firebase.auth();
  const provider = new window.firebase.auth.GoogleAuthProvider();

  // 4) Export robust globals (compat layer)
  // These are the names the new index prefers, but they won’t conflict if they already exist.
  window.AppAuth = window.AppAuth || auth;
  window.AppGoogleProvider = window.AppGoogleProvider || provider;
  window.AppOnAuthChanged = window.AppOnAuthChanged || window.firebase.auth().onAuthStateChanged.bind(auth);
  window.AppSignIn = window.AppSignIn || (async () => {
    // Use popup first; fallback to redirect on iOS if popup blocked
    try { return await auth.signInWithPopup(provider); }
    catch (e) { return auth.signInWithRedirect(provider); }
  });
  window.AppSignOut = window.AppSignOut || (() => auth.signOut());

  // Optional: expose raw for legacy code
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.googleProvider = provider;

  // Tiny ping for diagnostics
  window.__firebase_bootstrapped__ = true;
})();
</script>