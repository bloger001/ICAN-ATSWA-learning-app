/* assets/app.js  —  Auth + simple gating
   Requires: <script type="module" src="./assets/firebase.js"></script> BEFORE this file
   Make sure your Firebase project's Authorized Domains include:
   - bloger001.github.io
   - ican-kit-prep.firebaseapp.com
   - localhost
*/

// ---------------- Firebase imports (v10 modular) ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---------------- Init using config from assets/firebase.js ----------------
const _cfg =
  (window.firebaseConfig || (typeof firebaseConfig !== "undefined" ? firebaseConfig : null));

if (!_cfg) {
  console.error("[ICAN Prep] Firebase config not found. Ensure assets/firebase.js loads first.");
}

const fbApp = initializeApp(_cfg);
const auth  = getAuth(fbApp);
const provider = new GoogleAuthProvider();

// Persist sessions locally so users stay signed in across refresh
await setPersistence(auth, browserLocalPersistence);

// ---------------- DOM refs (if they exist) ----------------
const btnSignIn   = document.getElementById("btnSignIn");
const btnSignOut  = document.getElementById("btnSignOut");
const profileBox  = document.getElementById("profileBox");
const signedBadge = document.getElementById("signedBadge");

// ---------------- UI helpers ----------------
function updateAuthUI(user) {
  if (user) {
    if (btnSignIn)  btnSignIn.style.display  = "none";
    if (btnSignOut) btnSignOut.style.display = "inline-flex";
    if (profileBox) {
      profileBox.innerHTML = `
        <div class="small muted">${user.email}</div>
        <div style="margin-top:4px">${user.displayName || ""}</div>
      `;
    }
    if (signedBadge) signedBadge.textContent = "Signed in";
  } else {
    if (btnSignIn)  btnSignIn.style.display  = "inline-flex";
    if (btnSignOut) btnSignOut.style.display = "none";
    if (profileBox) {
      profileBox.innerHTML = `<div class="small muted">Not signed in</div>`;
    }
    if (signedBadge) signedBadge.textContent = "Not signed in";
  }
}

// ---------------- Sign-in / Sign-out handlers ----------------
async function startGoogleLogin() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    // Popup blockers (mobile Safari/iOS) -> fall back to redirect
    if (err?.code === "auth/popup-blocked" || err?.code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, provider);
      return;
    }
    alert("Sign-in error: " + (err?.message || err));
    console.error("[ICAN Prep] Sign-in error", err);
  }
}

if (btnSignIn)  btnSignIn.onclick  = startGoogleLogin;
if (btnSignOut) btnSignOut.onclick = () => signOut(auth);

// Complete redirect sign-in if used
getRedirectResult(auth).catch(e => {
  // harmless if there was no redirect flow
  if (e?.code) console.debug("[ICAN Prep] Redirect result:", e.code);
});

// ---------------- Route gating ----------------
function onProtectedRouteRequireLogin() {
  // Gate quiz.html (and any others you want later)
  const path = location.pathname.toLowerCase();
  const isQuiz = /(^|\/)quiz\.html(\?|#|$)/i.test(path);
  if (isQuiz && !auth.currentUser) {
    location.href = "index.html?needLogin=1";
  }
}

onAuthStateChanged(auth, user => {
  updateAuthUI(user);
  onProtectedRouteRequireLogin();
});

// ---------------- Optional: show notice on index after redirect ----------------
(function notifyIfLoginNeeded() {
  const params = new URLSearchParams(location.search);
  if (params.get("needLogin") === "1") {
    const msg = document.getElementById("loginNotice");
    if (msg) {
      msg.textContent = "Please sign in with Google to unlock quizzes and save your progress.";
      msg.style.display = "block";
    }
  }
})();

// Expose auth if other modules need it (optional)
window.ICAN_AUTH = { auth, startGoogleLogin };