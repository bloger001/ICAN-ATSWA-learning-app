// assets/app.js — index page wiring
(function () {
  if (!window.firebase || !firebase.auth) {
    console.warn("[app.js] Firebase Auth not available.");
    return;
  }
  const ADMIN_EMAIL = "offixcialbloger@gmail.com";
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const statusPill  = $("#userStatus");
  const signInBtn   = $("#btnGoogle");
  const signOutBtn  = $("#signOutBtn");
  const statusCard  = document.querySelector(".card");
  const authTiles   = $$(".requires-auth");
  const adminTile   = $("#adminTile");

  const setText = (el, t) => { if (el) el.textContent = t; };
  const show    = (el, d="inline-block") => { if (el) el.style.display = d; };
  const hide    = (el) => { if (el) el.style.display = "none"; };

  function lockAuthTiles(lock){
    authTiles.forEach(tile=>{
      if (lock){
        tile.classList.add("disabled"); tile.href="#";
        let b=tile.querySelector(".locked"); if(!b){ b=document.createElement("div"); b.className="locked"; b.textContent="🔒 Sign in"; tile.appendChild(b); }
        b.style.display="inline-block";
      } else {
        tile.classList.remove("disabled");
        const map = {"Basic Accounting":"basic_accounting","Business Law":"business_law","Economics":"economics","Communication Skills":"comm_skills"};
        const title = (tile.querySelector(".title")?.textContent||"").trim();
        const subj = map[title]; if (subj) tile.href=`./quiz.html?level=atswa1&subject=${subj}`;
        const b=tile.querySelector(".locked"); if(b) b.style.display="none";
      }
    });
  }
  function lockAdminTile(lock){
    if(!adminTile) return;
    let b=adminTile.querySelector(".locked"); if(!b){ b=document.createElement("div"); b.className="locked"; b.textContent="🔒 Admin only"; adminTile.appendChild(b); }
    if (lock){ adminTile.classList.add("disabled"); adminTile.href="#"; b.style.display="inline-block"; }
    else { adminTile.classList.remove("disabled"); adminTile.href="./admin.html"; b.style.display="none"; }
  }

  hide(signOutBtn); lockAuthTiles(true); lockAdminTile(true);

  signInBtn?.addEventListener("click",(e)=>{
    e.preventDefault();
    const provider=new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(err=>{ console.error("signIn:",err); alert("Google sign-in failed: "+(err?.message||err)); });
  });
  signOutBtn?.addEventListener("click",(e)=>{
    e.preventDefault();
    firebase.auth().signOut().catch(err=>{ console.error("signOut:",err); alert("Sign-out failed: "+(err?.message||err)); });
  });

  firebase.auth().onAuthStateChanged((user)=>{
    if (user){
      setText(statusPill, `Signed in as ${user.email||""}`); hide(signInBtn); show(signOutBtn);
      lockAuthTiles(false);
      lockAdminTile(!(user.email && user.email.toLowerCase()===ADMIN_EMAIL.toLowerCase()));
      if (statusCard){
        statusCard.innerHTML = `
          <p class="muted">Built by fellow accounting student <strong>Silva Brutus (NSUK)</strong>.
            Contact: <a href="mailto:offixcialbloger@gmail.com">offixcialbloger@gmail.com</a></p>
          <h2>Welcome</h2>
          <p>You are signed in, ${user.email||"user"}. Quizzes, leaderboard, and resources are unlocked ✅.</p>`;
      }
    } else {
      setText(statusPill,"Not signed in"); show(signInBtn); hide(signOutBtn);
      lockAuthTiles(true); lockAdminTile(true);
      if (statusCard){
        statusCard.innerHTML = `
          <p class="muted">Built by fellow accounting student <strong>Silva Brutus (NSUK)</strong>.
            Contact: <a href="mailto:offixcialbloger@gmail.com">offixcialbloger@gmail.com</a></p>
          <h2>Welcome</h2>
          <p>Please sign in to unlock quizzes, leaderboard and your personalized status.</p>`;
      }
    }
  });
})();