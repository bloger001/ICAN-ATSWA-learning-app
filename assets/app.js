/* /assets/app.js  — v33 (LOGIN GATING + UI TOGGLES, safe drop-in) */
import { app, auth, db } from './firebase.js';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_EMAIL = "offixcialbloger@gmail.com";
const provider = new GoogleAuthProvider();

// Pages that MUST require sign-in (handled here so you don’t edit each page)
const PROTECTED_PAGES = ["quiz.html","status.html","review.html","leaderbored.html","admin.html"];

function isProtectedPath() {
  const path = (location.pathname || "").toLowerCase();
  return PROTECTED_PAGES.some(p => path.endsWith("/" + p) || path.endsWith(p));
}

function updateUIForAuth(user) {
  const authed = !!user;

  // Toggle visibility groups
  document.querySelectorAll('.guest-only').forEach(el => {
    el.style.display = authed ? 'none' : '';
  });
  document.querySelectorAll('.auth-only').forEach(el => {
    el.style.display = authed ? '' : 'none';
  });
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = (authed && user?.email === ADMIN_EMAIL) ? '' : 'none';
  });

  // Update user chip
  const chip = document.getElementById('userChip');
  if (chip) {
    chip.textContent = authed
      ? (user.displayName || user.email || 'Signed in')
      : 'Not signed in';
  }
}

function redirectToLoginIfNeeded(user) {
  if (!user && isProtectedPath()) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`index.html?login=required&next=${next}`);
  }
}

onAuthStateChanged(auth, (user) => {
  // Persist minimal user for other scripts (non-breaking)
  if (user) {
    localStorage.setItem('ican.user', JSON.stringify({
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || ""
    }));
  } else {
    localStorage.removeItem('ican.user');
  }

  updateUIForAuth(user);
  redirectToLoginIfNeeded(user);
});

// Expose simple actions to buttons
export async function doGoogleSignIn() {
  await signInWithPopup(auth, provider);
}
export async function doSignOut() {
  await signOut(auth);
}

// Also attach to window for inline onclicks already in HTML
window.doGoogleSignIn = doGoogleSignIn;
window.doSignOut = doSignOut;