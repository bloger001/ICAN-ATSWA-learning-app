(function(){
  const ADMIN_EMAIL = "offixcialbloger@gmail.com";
  const HEALTH_KEY  = "ican:health:home";
  const ERR_KEY     = "ican:error:log";

  const authLine = document.getElementById("authLine");
  const roleLine = document.getElementById("roleLine");
  const errBox   = document.getElementById("errBox");
  const healthDump = document.getElementById("healthDump");
  const liveBox  = document.getElementById("live");

  const btnSignOut   = document.getElementById("btnSignOut");
  const btnHealth    = document.getElementById("btnHealth");
  const btnClear     = document.getElementById("btnClear");
  const btnHardReload= document.getElementById("btnHardReload");
  const btnAuthPing  = document.getElementById("btnAuthPing");
  const btnDbRead    = document.getElementById("btnDbRead");
  const btnDbWrite   = document.getElementById("btnDbWrite");

  function logLive(msg){ liveBox.innerText = `[${new Date().toLocaleTimeString()}] ${msg}\n` + liveBox.innerText; }

  // --- helpers ---
  function readErrors(){
    try{ return JSON.parse(localStorage.getItem(ERR_KEY) || "[]"); }catch{ return []; }
  }
  function renderErrors(){
    const rows = readErrors();
    if (!rows.length){ errBox.innerText = "(empty)"; return; }
    errBox.innerHTML = rows.map(r=>`${r.t} • ${r.kind} • ${r.msg}`).join("\n");
  }
  function renderHealth(){
    try{
      const obj = JSON.parse(localStorage.getItem(HEALTH_KEY) || "{}");
      if (!obj || !Object.keys(obj).length){ healthDump.innerText="(no snapshot yet)"; return; }
      healthDump.innerText = JSON.stringify(obj, null, 2);
    }catch{
      healthDump.innerText = "(could not parse)";
    }
  }
  function hardReload(){
    try{
      caches?.keys?.().then(keys=>keys.forEach(k=>caches.delete(k)));
    }catch{}
    sessionStorage.clear(); localStorage.removeItem(HEALTH_KEY);
    location.reload(true);
  }
  async function runHealthChecks(){
    const targets = [
      "./assets/app.js","./assets/firebase.js","./assets/app.css",
      "./quiz.html","./leaderboard.html","./status.html","./review.html","./admin.html",
      "./data/atswa1_basic_accounting.json",
      "./data/atswa1_business_law.json",
      "./data/atswa1_economics.json",
      "./data/atswa1_comm_skills.json"
    ];
    const out = {};
    await Promise.all(targets.map(async p=>{
      try{ const r = await fetch(p,{cache:"no-store"}); out[p]=r.ok; }
      catch{ out[p]=false; }
    }));
    // persist so Home can read it too if desired
    const stamp = { ts:new Date().toISOString(), from:"admin", files: out };
    try{
      const prev = JSON.parse(localStorage.getItem(HEALTH_KEY) || "{}");
      localStorage.setItem(HEALTH_KEY, JSON.stringify(Object.assign({},prev, stamp)));
    }catch{}
    renderHealth();
    logLive("Health checks complete");
  }

  // --- auth boot ---
  async function bootAuth(){
    if (window.__fbReady) { await window.__fbReady; }
    const auth = window.AppAuth || window.firebaseAuth;
    const db   = window.AppDB   || window.firebaseDB;

    if (!auth){
      authLine.innerText = "Auth not available"; authLine.className="pill bad";
      roleLine.innerText = "guest";
      return {auth:null, db};
    }

    btnSignOut.onclick = ()=> auth.signOut().catch(e=>alert(e.message));

    auth.onAuthStateChanged(u=>{
      if (u){
        authLine.innerText = `Signed in as ${u.email||"(no email)"}`;
        authLine.className = "pill";
        btnSignOut.style.display = "inline-block";
        const isAdmin = (u.email||"").toLowerCase() === ADMIN_EMAIL.toLowerCase();
        roleLine.innerText = isAdmin ? "admin ✅" : "user";
        if (!isAdmin){
          // soft lock: show but block dangerous buttons
          btnDbWrite.disabled = true;
        }
      }else{
        authLine.innerText = "Not signed in";
        authLine.className = "pill";
        roleLine.innerText = "guest";
        btnSignOut.style.display = "none";
        btnDbWrite.disabled = true;
      }
    });

    return {auth, db};
  }

  // --- DB diagnostics ---
  async function testRead(db){
    if (!db){ alert("Firestore not ready"); return; }
    try{
      const snap = await db.collection("leaderboard").orderBy("ts","desc").limit(1).get();
      if (snap.empty){ alert("Read OK (no docs found)"); }
      else { alert("Read OK (1+ doc)"); }
      logLive("DB read OK");
    }catch(e){ alert("Read failed: "+e.message); logLive("DB read failed: "+e.message); }
  }
  async function testWrite(auth, db){
    if (!auth || !db){ alert("Need auth + Firestore"); return; }
    const u = auth.currentUser;
    if (!u){ alert("Sign in first"); return; }
    if ((u.email||"").toLowerCase() !== ADMIN_EMAIL.toLowerCase()){
      alert("Only admin can write test docs"); return;
    }
    try{
      await db.collection("diag").add({
        t: new Date(),
        who: { uid: u.uid, email: u.email||"" },
        note: "admin-panel write test"
      });
      alert("Write OK");
      logLive("DB write OK");
    }catch(e){ alert("Write failed: "+e.message); logLive("DB write failed: "+e.message); }
  }

  // --- wire buttons + initial render ---
  (async ()=>{
    const {auth, db} = await bootAuth();

    btnHealth.onclick = runHealthChecks;
    btnClear.onclick  = ()=>{ localStorage.removeItem(ERR_KEY); renderErrors(); };
    btnHardReload.onclick = hardReload;
    btnAuthPing.onclick = ()=> alert(auth ? (auth.currentUser ? `Signed in: ${auth.currentUser.email}` : "Signed out") : "Auth not available");
    btnDbRead.onclick = ()=> testRead(db);
    btnDbWrite.onclick= ()=> testWrite(auth, db);

    renderHealth();
    renderErrors();

    // auto-refresh snapshot area if another tab updates it
    window.addEventListener("storage", e=>{
      if (e.key === HEALTH_KEY) renderHealth();
      if (e.key === ERR_KEY) renderErrors();
    });

    logLive("Admin ready");
  })();
})();