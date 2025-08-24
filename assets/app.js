/* assets/app.js — Auth flicker fix (Local persistence + instant UX) */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  setPersistence, browserLocalPersistence, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

/* --- Firebase config (yours) --- */
const firebaseConfig = {
  apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
  authDomain: "ican-kit-prep.firebaseapp.com",
  projectId: "ican-kit-prep",
  storageBucket: "ican-kit-prep.firebasestorage.app",
  messagingSenderId: "354385037521",
  appId: "1:354385037521:web:f3a7265f66983942581df0",
  measurementId: "G-LN8E2R4B7X"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* --- DOM hooks (keep these IDs in index.html) --- */
const googleBtn   = document.getElementById('googleBtn');
const signOutBtn  = document.getElementById('signOutBtn');
const userBadge   = document.getElementById('userBadge');
const tiles       = document.getElementById('tiles');
const welcomeCard = document.getElementById('welcomeCard');

/* --- Helper: fast render based on cached user --- */
function renderLoggedInCached(u){
  welcomeCard.style.display = 'none';
  tiles.style.display = '';
  userBadge.style.display = '';
  signOutBtn.style.display = '';
  googleBtn.style.display = 'none';
  const name = (u.displayName || u.email || 'Student').split(' ')[0];
  userBadge.innerHTML = `👋 ${name}`;
}
function renderLoggedOut(){
  welcomeCard.style.display = '';
  tiles.style.display = 'none';
  userBadge.style.display = 'none';
  signOutBtn.style.display = 'none';
  googleBtn.style.display = '';
}

/* 1) Ensure LOCAL persistence so the session survives reloads */
setPersistence(auth, browserLocalPersistence).catch(console.warn);

/* 2) Instant UX: pre-hydrate from localStorage, then confirm with Firebase */
try {
  const cached = JSON.parse(localStorage.getItem('ican.user') || 'null');
  if (cached && cached.uid) renderLoggedInCached(cached);
  else renderLoggedOut();
} catch { renderLoggedOut(); }

/* 3) Resolve redirect results (iOS often uses redirect, not popup) */
getRedirectResult(auth).catch(err => console.warn('redirect result:', err?.message));

/* 4) The official source of truth */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // cache minimal profile to stop future flicker
    const slim = { uid:user.uid, displayName:user.displayName, email:user.email, photoURL:user.photoURL };
    localStorage.setItem('ican.user', JSON.stringify(slim));
    renderLoggedInCached(slim);
  } else {
    localStorage.removeItem('ican.user');
    renderLoggedOut();
  }
});

/* 5) Buttons */
googleBtn?.addEventListener('click', async () => {
  try {
    // Try popup first; fall back to redirect if blocked
    await signInWithPopup(auth, provider);
  } catch (e) {
    await signInWithRedirect(auth, provider);
  }
});

signOutBtn?.addEventListener('click', async () => {
  await signOut(auth);
  localStorage.removeItem('ican.user');
  renderLoggedOut();
});