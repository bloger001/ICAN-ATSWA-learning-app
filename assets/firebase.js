<script>
// Tiny Firebase bootstrap that works on GitHub Pages (no bundler).
// It loads the v10 modular SDKs and exposes a simple API on window.firebaseApi

(function () {
  const cfg = window.firebaseConfig; // set in index.html before this file loads
  if (!cfg) {
    console.error("firebaseConfig missing on window.");
    return;
  }

  // Single ready promise so other scripts can await it
  const ready = (async () => {
    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut },
           { getFirestore, collection, addDoc, getDocs, query, orderBy, limit }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js')
    ]);

    const app = initializeApp(cfg);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    const db = getFirestore(app);

    async function signInWithGoogle() {
      return signInWithPopup(auth, provider);
    }
    async function signOutUser() {
      return signOut(auth);
    }

    // expose minimal API
    window.firebaseApi = {
      app, auth, db,
      onAuthStateChanged,
      signInWithGoogle,
      signOutUser,
      // firestore helpers used by leaderboard/status
      collection, addDoc, getDocs, query, orderBy, limit
    };
  })();

  window.firebaseReady = ready;
})();
</script>