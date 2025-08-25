// Firebase bootstrap (compat) + helpers.
// Put your config here (we’ll also read window.firebaseConfig if you keep it elsewhere).
window.firebaseConfig = window.firebaseConfig || {
  apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
  authDomain: "ican-kit-prep.firebaseapp.com",
  projectId: "ican-kit-prep",
  storageBucket: "ican-kit-prep.firebasestorage.app",
  messagingSenderId: "354385037521",
  appId: "1:354385037521:web:f3a7265f66983942581df0",
  measurementId: "G-LN8E2R4B7X"
};

(function(){
  const CDN = "https://www.gstatic.com/firebasejs/10.12.3";
  const load = (src)=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('load '+src));document.head.appendChild(s);});
  const scripts = [
    `${CDN}/firebase-app-compat.js`,
    `${CDN}/firebase-auth-compat.js`,
    `${CDN}/firebase-firestore-compat.js`
  ];
  (async()=>{
    for(const s of scripts) await load(s);
    const fb = firebase.initializeApp(window.firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const provider = new firebase.auth.GoogleAuthProvider();

    // Try to complete redirect result silently.
    auth.getRedirectResult().catch(()=>{});

    async function signIn() {
      try { await auth.signInWithPopup(provider); }
      catch (e) {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request')) {
          await auth.signInWithRedirect(provider);
        } else { throw e; }
      }
    }
    async function signOut(){ await auth.signOut(); }

    window.ICAN = window.ICAN || {};
    window.ICAN.firebase = { fb, auth, db, provider, signIn, signOut };
    document.dispatchEvent(new Event('ican:firebaseReady'));
  })().catch(err=>{
    console.error(err);
    localStorage.setItem('ican_last_error', String(err && err.stack || err));
  });
})();