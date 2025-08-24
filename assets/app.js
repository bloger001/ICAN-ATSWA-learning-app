// Your Firebase config (as you shared)
const firebaseConfig = {
  apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
  authDomain: "ican-kit-prep.firebaseapp.com",
  projectId: "ican-kit-prep",
  appId: "1:354385037521:web:f3a7265f66983942581df0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

const loginView = document.getElementById('login-view');
const homeView = document.getElementById('home-view');
const googleBtn = document.getElementById('googleBtn');
const signOutBtn = document.getElementById('signOutBtn');

function showHome(){ if(loginView) loginView.style.display='none'; if(homeView) homeView.style.display=''; }
function showLogin(){ if(homeView) homeView.style.display='none'; if(loginView) loginView.style.display=''; }

// Click handler
googleBtn?.addEventListener('click', async () => {
  try {
    // Try popup first
    await auth.signInWithPopup(provider);
  } catch (e) {
    // On iOS Safari or popup blocked → use redirect
    console.log('Popup failed, trying redirect:', e?.message || e);
    try {
      await auth.signInWithRedirect(provider);
    } catch (err) {
      alert("Google sign-in failed. Check Authorized domains in Firebase and try again.");
      console.error(err);
    }
  }
});

// After redirect returns OR normal login
auth.onAuthStateChanged(user=>{
  console.log('Auth state:', user?.email || 'signed out');
  user ? showHome() : showLogin();
});

// Sign out
signOutBtn?.addEventListener('click', ()=>auth.signOut());

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./assets/sw.js').catch(()=>{});
}
