// assets/firebase.js — robust Firebase Auth bootstrap (compat, safe for GitHub Pages)

(function () {
  const CDN_APP  = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
  const CDN_AUTH = "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";

  function load(src){
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = res; s.onerror = () => rej(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  async function ensureSdk() {
    if (window.firebase && window.firebase.apps) return;
    await load(CDN_APP);
    await load(CDN_AUTH);
  }

  async function boot() {
    // REQUIRE: index.html must set window.firebaseConfig BEFORE including this file.
    if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
      throw new Error("firebaseConfig missing on window");
    }

    await ensureSdk();

    const app = window.firebase.apps && window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(window.firebaseConfig);

    const auth = window.firebase.auth();
    const provider = new window.firebase.auth.GoogleAuthProvider();

    // Expose the globals the rest of the app expects
    window.AppAuth = auth;
    window.AppGoogleProvider = provider;
    window.AppOnAuthChanged = auth.onAuthStateChanged.bind(auth);
    window.AppSignIn = async () => {
      try { return await auth.signInWithPopup(provider); }
      catch (e) { return auth.signInWithRedirect(provider); } // iOS / popup blocked fallback
    };
    window.AppSignOut = () => auth.signOut();

    // Legacy aliases (back-compat with older pages)
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.googleProvider = provider;
    window.signInWithPopup = (prov) => auth.signInWithPopup(prov || provider);
    window.signOutFirebase = () => auth.signOut();
    window.firebaseOnAuthStateChanged = (/*ignored*/, cb) => auth.onAuthStateChanged(cb);

    // Let pages wait for readiness
    if (!window.__fbReady) window.__fbReady = Promise.resolve(true);
    window.__firebase_bootstrapped__ = true;
    document.dispatchEvent(new Event("firebase-ready"));
    console.log("[firebase.js] ready");
  }

  // Kick off
  boot().catch(err => {
    console.error("[firebase.js] bootstrap failed:", err);
    if (!window.__fbReady) window.__fbReady = Promise.resolve(false);
    try {
      const k="ican:error:log";
      const arr = JSON.parse(localStorage.getItem(k) || "[]");
      arr.unshift({t:new Date().toISOString(), kind:"firebase-boot", msg:String(err?.message||err)});
      localStorage.setItem(k, JSON.stringify(arr.slice(0,50)));
    } catch {}
  });
})();