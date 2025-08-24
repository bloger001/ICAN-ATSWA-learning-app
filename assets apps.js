// 🔑 Firebase config — already filled with your values
const firebaseConfig = {
  apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
  authDomain: "ican-kit-prep.firebaseapp.com",
  projectId: "ican-kit-prep",
  appId: "1:354385037521:web:f3a7265f66983942581df0"
  // storageBucket and measurementId not needed for Auth-only MVP
};

// Init (using compat SDKs already included in index.html)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

const loginView = document.getElementById('login-view');
const homeView = document.getElementById('home-view');
const googleBtn = document.getElementById('googleBtn');
const signOutBtn = document.getElementById('signOutBtn');

function showHome(){ if(loginView) loginView.style.display='none'; if(homeView) homeView.style.display=''; }
function showLogin(){ if(homeView) homeView.style.display='none'; if(loginView) loginView.style.display=''; }

// Google login
googleBtn?.addEventListener('click', async () => {
  try { await auth.signInWithPopup(provider); }
  catch(e){ alert("Login failed: " + (e?.message || e)); }
});

// Switch views on auth change
auth.onAuthStateChanged(user=>{ user ? showHome() : showLogin(); });

// Sign out
signOutBtn?.addEventListener('click', ()=>auth.signOut());

// PWA (offline)
if('serviceWorker' in navigator){ navigator.serviceWorker.register('assets/sw.js').catch(()=>{}); }
