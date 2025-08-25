// ICAN ATSWA - minimal app shell (safe update)
// Assumes firebaseConfig is defined in /assets/firebase.js and loaded before this file.

(function () {
  // -------- utilities --------
  const $ = (q, el = document) => el.querySelector(q);
  const params = new URLSearchParams(location.search);
  const vBust = () => `v=${Date.now()}`;

  // -------- firebase bootstrap --------
  let app, auth, db, provider;

  function bootFirebase() {
    if (!window.firebaseConfig) throw new Error('firebaseConfig missing');

    const {
      initializeApp
    } = window.firebase;
    app = initializeApp(window.firebaseConfig);

    const {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
      onAuthStateChanged,
      signOut
    } = window.firebaseAuth;

    const { getFirestore } = window.firebaseFirestore;

    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    db = getFirestore(app);

    // expose small api
    window.ICAN = window.ICAN || {};
    window.ICAN.firebase = { app, auth, db, provider, signInWithPopup, onAuthStateChanged, signOut };
  }

  // -------- auth button wiring on home page --------
  function wireHome() {
    const signBtn = $('#googleSignIn');
    const signOutBtn = $('#googleSignOut');
    const statusEl = $('#signStatus');

    if (!signBtn) return; // not on home

    const { auth, provider, signInWithPopup, onAuthStateChanged, signOut } = window.ICAN.firebase;

    signBtn.addEventListener('click', async () => {
      try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
    });

    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        try { await signOut(auth); } catch (e) { console.error(e); }
      });
    }

    onAuthStateChanged(auth, (user) => {
      if (statusEl) statusEl.textContent = user ? 'Signed in' : 'Not signed in';
      if (user) {
        signBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'inline-flex';
        // reveal locked tiles
        document.querySelectorAll('[data-locked]').forEach(x => x.removeAttribute('data-locked'));
      } else {
        if (signOutBtn) signOutBtn.style.display = 'none';
        signBtn.style.display = 'inline-flex';
        // keep tiles locked until sign-in
        document.querySelectorAll('.tile.lockable').forEach(x => x.setAttribute('data-locked',''));
      }
    });
  }

  // -------- quiz page: load JSON first; firestore is optional --------
  async function wireQuiz() {
    const quizRoot = $('#quizRoot');
    if (!quizRoot) return; // not on quiz

    const level = params.get('level') || 'ATSWA1';
    const subject = params.get('subject') || 'Basic Accounting';
    const fileMap = {
      'Basic Accounting': './data/atswa1_basic_accounting.json',
      'Business Law': './data/atswa1_business_law.json',
      'Economics': './data/atswa1_economics.json',
      'Communication Skills': './data/atswa1_comm_skills.json'
    };
    const url = fileMap[subject];

    const showMsg = (m) => { $('#quizStatus').textContent = m; };

    try {
      showMsg('Loading...');
      // Fetch questions immediately (don’t wait for Firestore)
      const res = await fetch(url + `?${vBust()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      if (!Array.isArray(payload) || payload.length === 0) throw new Error('Empty or bad JSON');

      window.ICAN_QUESTIONS = payload; // your existing renderer uses this
      showMsg('');
      document.dispatchEvent(new CustomEvent('ican:questionsReady'));
    } catch (e) {
      console.error(e);
      showMsg(`Load error: ${e.message}`);
    }

    // Optional: init Firestore listeners AFTER rendering questions
    try {
      const { auth, onAuthStateChanged } = window.ICAN.firebase;
      onAuthStateChanged(auth, () => {/* no-op here; existing quiz saving can use ICAN.firebase later */});
    } catch {}
  }

  // -------- leaderboard page (reads require new rules) --------
  function wireLeaderboard() {
    const pane = $('#leaderPane');
    if (!pane) return;
    // your existing leaderboard.js does the heavy lifting; nothing to do here
  }

  // -------- boot --------
  window.addEventListener('DOMContentLoaded', () => {
    try { bootFirebase(); } catch (e) { console.error(e); }
    wireHome();
    wireQuiz();
    wireLeaderboard();
  });
})();