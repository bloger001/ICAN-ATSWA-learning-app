<script>
// assets/firebase.js  — robust, self-loading Firebase (compat) for GitHub Pages
(() => {
  // ---- helpers -------------------------------------------------------------
  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error('Failed '+src));
    document.head.appendChild(s);
  });

  // Expose a promise others can await
  let _resolveReady;
  const ready = new Promise(r => (_resolveReady = r));
  // Make it globally awaitable (index.html button can wait on this)
  window.__fbReady = ready;

  async function boot() {
    // 1) Require config (you already set window.firebaseConfig in index.html)
    if (!window.firebaseConfig) {
      throw new Error('firebaseConfig missing on window');
    }

    // 2) If Firebase compat is not on the page, load it
    if (!window.firebase || !window.firebase.app) {
      // Compat SDK keeps your existing code working
      await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js');
    }

    // 3) Init (idempotent)
    const app = (window.firebase.apps && window.firebase.apps.length)
      ? window.firebase.app()
      : window.firebase.initializeApp(window.firebaseConfig);

    const auth = window.firebase.auth();
    const provider = new window.firebase.auth.GoogleAuthProvider();

    // 4) Export globals your pages expect
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.googleProvider = provider;

    // Preferred names used by the new index.html
    window.AppAuth = auth;
    window.AppGoogleProvider = provider;
    window.AppOnAuthChanged = auth.onAuthStateChanged.bind(auth);
    window.AppSignIn = async () => {
      try { return await auth.signInWithPopup(provider); }
      catch { return auth.signInWithRedirect(provider); }
    };
    window.AppSignOut = () => auth.signOut();

    window.__firebase_bootstrapped__ = true;
    window.__fbVersion = '9.22.2-compat';
    _resolveReady(true);
  }

  boot().catch(err => {
    console.error('[firebase.js] bootstrap failed:', err);
    // Make the ready promise settle so callers don’t hang
    _resolveReady(false);
    // Surface a small toast for visibility (optional)
    try { alert('Firebase failed to load: ' + err.message); } catch {}
  });
})();
</script>