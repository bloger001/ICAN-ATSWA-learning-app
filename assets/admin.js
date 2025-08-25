// assets/admin.js  v50
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const ADMIN_EMAIL = "offixcialbloger@gmail.com";
const ADMIN_CODE  = "FT24ACC245";

const cfg = window.firebaseConfig;
const app  = initializeApp(cfg);
const auth = getAuth(app);
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

const $ = (id)=>document.getElementById(id);
const out = $('diagOut');

function logLocal(text){
  const prev = $('errLog');
  try {
    const arr = JSON.parse(localStorage.getItem('ican_error_log')||"[]");
    prev.textContent = arr.map(e=>`${new Date(e.t).toLocaleString()} — ${e.msg}`).join("\n");
  } catch { prev.textContent = "(none)"; }
}

function msg(txt){ const m=$('adminMsg'); m.style.display='block'; m.textContent=txt; }

function gate(){
  const u = auth.currentUser;
  $('adminSigned').textContent = u ? `Signed in — ${u.email||""}` : "Not signed in";
  const ok = !!u && u.email === ADMIN_EMAIL;
  $('diagCard').style.display = ok ? '' : 'none';
}

$('btnAdminSignIn').onclick = ()=> signInWithPopup(auth, provider).then(gate);
$('btnAdminSignOut').onclick = ()=> signOut(auth).then(gate);

$('btnVerify').onclick = ()=>{
  const u = auth.currentUser;
  if (!u){ msg("Please sign in with the admin Google account first."); return; }
  if (u.email !== ADMIN_EMAIL){ msg("This Google account is not allowed."); return; }
  if (($('adminCode').value||"").trim() !== ADMIN_CODE){ msg("Invalid access code."); return; }
  $('adminMsg').style.display='none';
  $('btnAdminSignOut').style.display='';
  gate();
};

$('btnRun').onclick = async ()=>{
  const lines = [];
  function ok(s){ lines.push('✅ '+s); }
  function warn(s){ lines.push('⚠️ '+s); }
  function err(s){ lines.push('❌ '+s); }

  // Config
  if (cfg && cfg.apiKey) ok("firebaseConfig present");
  else err("firebaseConfig missing");

  // Assets
  const assets = [
    "./assets/app.js","./assets/firebase.js","./assets/app.css",
    "./data/atswa1_basic_accounting.json",
    "./data/atswa1_business_law.json",
    "./data/atswa1_economics.json",
    "./data/atswa1_comm_skills.json"
  ];
  for (const url of assets){
    try {
      const r = await fetch(url, {cache:"no-store"});
      if (r.ok) ok(`200 ${url}`);
      else warn(`${r.status} ${url}`);
    } catch(e){ err(`fetch failed ${url}: ${e}`); }
  }

  // Firestore read test (may be denied by rules; report either way)
  try {
    const snap = await getDoc(doc(db, "meta", "version"));
    if (snap.exists()) ok("Firestore read ok: meta/version found");
    else warn("Firestore connected but meta/version not found (ok if not set)");
  } catch(e){ warn(`Firestore read failed (rules or network): ${e.code||e}`); }

  out.textContent = lines.join("\n");
};

$('btnClearLog').onclick = ()=>{ localStorage.removeItem('ican_error_log'); logLocal("(cleared)"); };
logLocal();
gate();