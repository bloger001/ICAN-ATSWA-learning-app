// assets/app.js (FULL REPLACEMENT)

// ---- Firebase imports (modular v10) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut as fbSignOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---- Helpers ----
const $ = (id) => document.getElementById(id);
const showError = (msg) => {
  const box = $("authError");
  if (!box) return console.error(msg);
  box.textContent = msg;
  box.style.display = "block";
};

// ---- Read config exposed by assets/firebase.js ----
const firebaseConfig = window.firebaseConfig;
if (!firebaseConfig) {
  showError("Firebase config missing — make sure assets/firebase.js loads before app.js");
  throw new Error("firebaseConfig missing");
}

// ---- Init Firebase core ----
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google provider
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// Expose minimal API for inline fallback in index.html
window.ICAN_AUTH = {
  startGoogleRedirect: () => signInWithRedirect(auth, provider),
  signOut: () => fbSignOut(auth),
};

// Wire buttons if present
const btnSignIn = $("btnSignIn");
if (btnSignIn) {
  btnSignIn.addEventListener("click", () => window.ICAN_AUTH.startGoogleRedirect());
}
const btnSignOut = $("btnSignOut");
if (btnSignOut) {
  btnSignOut.addEventListener("click", () => window.ICAN_AUTH.signOut());
}

// Complete redirect sign-in if we just came back from Google
getRedirectResult(auth).catch((e) => {
  // Not fatal for normal loads; only log if it’s a real error
  if (e && e.code !== "auth/no-auth-event") console.warn("redirect result:", e);
});

// ---- Auth state UI sync (used on all pages) ----
onAuthStateChanged(auth, (user) => {
  const isAuthed = !!user;
  // Save a tiny profile locally (for quiz gating & greetings)
  try {
    if (isAuthed) {
      localStorage.setItem(
        "ican_user",
        JSON.stringify({ uid: user.uid, email: user.email || "", name: user.displayName || "" })
      );
    } else {
      localStorage.removeItem("ican_user");
    }
  } catch {}

  // Toggle header buttons / profile (index.html provides this hook)
  if (typeof window._icanToggleHome === "function") {
    window._icanToggleHome(isAuthed, user?.email || "", user?.displayName || "");
  } else {
    // Generic header fallback
    const badge = $("signedBadge");
    if (badge) badge.textContent = isAuthed ? "Signed in" : "Not signed in";
    if (btnSignIn) btnSignIn.style.display = isAuthed ? "none" : "";
    if (btnSignOut) btnSignOut.style.display = isAuthed ? "" : "none";
  }

  // ---- Hard gate quizzes: require login ----
  const path = (location.pathname || "").toLowerCase();
  const isQuizPage = path.endsWith("/quiz.html") || path.endsWith("quiz.html");
  if (isQuizPage && !isAuthed) {
    // Send them home to sign in
    const home = "index.html?v=auth";
    try { history.replaceState({}, "", home); } catch {}
    location.href = home;
    return;
  }
});

// ---- Optional: small guard so other pages can check auth quickly ----
window.icanGetUser = () => {
  try {
    const raw = localStorage.getItem("ican_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

// Make db available for future leaderboard / cloud sync features
window.icanDb = db;