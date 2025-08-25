// assets/app.js  v50  — popup first auth, redirect fallback, quiz gate, error logging

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, addDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = (id)=>document.getElementById(id);
function logErr(msg){
  try {
    const arr = JSON.parse(localStorage.getItem('ican_error_log')||"[]");
    arr.unshift({t: Date.now(), msg: String(msg)});
    localStorage.setItem('ican_error_log', JSON.stringify(arr).slice(0, 10000));
  } catch {}
  console.error(msg);
}
function showError(msg){
  logErr(msg);
  const box = $('authError');
  if (box){ box.textContent = String(msg); box.style.display='block'; }
}

const firebaseConfig = window.firebaseConfig;
if (!firebaseConfig) {
  showError('Script error: firebaseConfig missing');
  throw new Error('firebaseConfig missing');
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ------- auth UI actions -------
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

async function startGoogle(){
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const fallback = new Set([
      "auth/popup-blocked", "auth/popup-closed-by-user",
      "auth/operation-not-supported-in-this-environment", "auth/unauthorized-domain"
    ]);
    if (fallback.has(e.code)) {
      try { await signInWithRedirect(auth, provider); return; }
      catch (e2){ showError(`Redirect failed: ${e2.code||""} ${e2.message||e2}`); }
    } else {
      showError(`Popup failed: ${e.code||""} ${e.message||e}`);
    }
  }
}

window.ICAN_AUTH = {
  startGoogle,
  signOut: ()=> fbSignOut(auth)
};

const btnIn  = $('btnSignIn');
const btnOut = $('btnSignOut');
if (btnIn)  btnIn.addEventListener('click', startGoogle);
if (btnOut) btnOut.addEventListener('click', ()=> fbSignOut(auth));

// Complete redirect if returning from Google
getRedirectResult(auth).catch(e=>{
  if (e && e.code !== 'auth/no-auth-event') showError(`Redirect result error: ${e.code||""} ${e.message||e}`);
});

// Keep simple profile locally (for quiz gate / greetings)
onAuthStateChanged(auth, (user)=>{
  const isAuthed = !!user;
  try {
    if (isAuthed) localStorage.setItem('ican_user', JSON.stringify({uid:user.uid, email:user.email||"", name:user.displayName||""}));
    else localStorage.removeItem('ican_user');
  } catch {}

  if (typeof window._icanToggleHome === 'function') {
    window._icanToggleHome(isAuthed, user?.email||"", user?.displayName||"");
  } else {
    const badge = $('signedBadge');
    if (badge) badge.textContent = isAuthed ? 'Signed in' : 'Not signed in';
    if (btnIn)  btnIn.style.display  = isAuthed ? 'none' : '';
    if (btnOut) btnOut.style.display = isAuthed ? '' : 'none';
  }

  // Hard-gate quiz page
  const p = (location.pathname||"").toLowerCase();
  const isQuiz = p.endsWith("/quiz.html") || p.endsWith("quiz.html");
  if (isQuiz && !isAuthed) {
    try { history.replaceState({}, "", "index.html?v=auth"); } catch {}
    location.href = "index.html?v=auth";
  }
});

// helper for other pages
window.icanGetUser = ()=>{ try { return JSON.parse(localStorage.getItem('ican_user')||"null"); } catch { return null; } };

// Optional: leaderboard write hook (safe to call from quiz.js)
window.icanReportScore = async (payload)=>{
  try {
    const user = auth.currentUser;
    if (!user) return;
    // expected payload: {subject, mode, score, total}
    await addDoc(collection(db, "scores"), {
      uid: user.uid,
      email: user.email || "",
      subject: payload.subject || "",
      mode: payload.mode || "practice",
      score: Number(payload.score||0),
      total: Number(payload.total||0),
      pct: Math.round(100 * Number(payload.score||0) / Math.max(1, Number(payload.total||0))),
      ts: serverTimestamp()
    });
  } catch(e){ logErr(`score write failed: ${e.code||""} ${e.message||e}`); }
};

window.icanDb = db;