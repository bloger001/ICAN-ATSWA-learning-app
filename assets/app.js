/* assets/app.js — v42 (redirect-only Google sign-in + gating + visible errors)
   Requires: <script type="module" src="./assets/firebase.js"></script> BEFORE this file
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  GoogleAuthProvider, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const cfg = (window.firebaseConfig || (typeof firebaseConfig !== "undefined" ? firebaseConfig : null));
if (!cfg) {
  console.error("[ICAN] firebaseConfig missing (check assets/firebase.js order)");
}
const fbApp = initializeApp(cfg);
const auth  = getAuth(fbApp);
await setPersistence(auth, browserLocalPersistence);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
auth.useDeviceLanguage?.();

// --- UI handles (if present) ---
const $ = (id) => document.getElementById(id);
const btnIn  = $("btnSignIn");
const btnOut = $("btnSignOut");
const badge  = $("signedBadge");
const profile= $("profileBox");
const notice = $("loginNotice");

// visible error area
let errBox = document.getElementById("authError");
if (!errBox) {
  errBox = document.createElement("div");
  errBox.id = "authError";
  errBox.style.cssText = "display:none;margin:10px 0;padding:10px;border-radius:8px;background:#2a1111;color:#ffdddd;border:1px solid #662222;";
  const wrap = document.querySelector(".wrap") || document.body;
  wrap.insertBefore(errBox, wrap.firstChild);
}
function showErr(msg) {
  errBox.textContent = msg;
  errBox.style.display = "block";
  console.error("[ICAN Auth]", msg);
}

// --- Sign-in / Sign-out ---
async function startGoogleRedirect() {
  try {
    await signInWithRedirect(auth, provider);
  } catch (e) {
    showErr(`Redirect start failed: ${e?.message || e}`);
  }
}
if (btnIn)  btnIn.onclick  = startGoogleRedirect;
if (btnOut) btnOut.onclick = () => signOut(auth);

// Complete redirect if we’re returning from Google
getRedirectResult(auth).catch(e => {
  // This is normal if user didn't come via redirect
  if (e?.code) console.debug("[ICAN] getRedirectResult:", e.code, e.message);
});

// --- Gate routes ---
function gateProtectedPages(user) {
  const p = (location.pathname || "").toLowerCase();
  const protectedPages = ["quiz.html","status.html","review.html","leaderbored.html","admin.html"];
  const isProtected = protectedPages.some(x => p.endsWith("/"+x) || p.endsWith(x));
  if (!user && isProtected) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`index.html?needLogin=1&next=${next}`);
  }
}

// --- Toggle home tiles (index.html has window._icanToggleHome hook) ---
function toggleHome(user) {
  if (typeof window._icanToggleHome === "function") {
    window._icanToggleHome(!!user, user?.email || "", user?.displayName || "");
  }
  if (badge)  badge.textContent = user ? "Signed in" : "Not signed in";
  if (profile) profile.innerHTML = user
    ? `<div class="small muted">${user.email||""}</div><div>${user.displayName||""}</div>`
    : "Not signed in";
  if (btnIn)  btnIn.style.display  = user ? "none" : "inline-flex";
  if (btnOut) btnOut.style.display = user ? "inline-flex" : "none";
}

// --- Auth listener ---
onAuthStateChanged(auth, (user) => {
  toggleHome(user);
  gateProtectedPages(user);
});

// --- Show notice if redirected back requiring login ---
(function notifyIfNeeded() {
  const ps = new URLSearchParams(location.search);
  if (ps.get("needLogin") === "1" && notice) {
    notice.textContent = "Please sign in with Google to unlock quizzes and save progress.";
    notice.style.display = "block";
  }
})();

// Expose (optional)
window.ICAN_AUTH = { auth, startGoogleRedirect };