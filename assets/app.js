// assets/app.js — index page auth wiring + UI state (safe, complete)
(function () {
  if (!window.firebase || !firebase.auth) {
    console.warn("[app.js] Firebase Auth not available; UI will stay in signed-out state.");
    return;
  }

  const ADMIN_EMAIL = "offixcialbloger@gmail.com";

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Elements
  const statusPill  = $("#userStatus");
  const signInBtn   = $("#btnGoogle");
  const signOutBtn  = $("#signOutBtn");
  const statusCard  = document.querySelector(".card");
  const authTiles   = $$(".requires-auth");
  const adminTile   = $("#adminTile");

  // helpers
  const setText = (el, text) => { if (el) el.textContent = text; };
  const show    = (el, disp="inline-block") => { if (el) el.style.display = disp; };
  const hide    = (el) => { if (el) el.style.display = "none"; };

  function lockAuthRequiredTiles(lock) {
    authTiles.forEach((tile) => {
      if (lock) {
        tile.classList.add("disabled");
        tile.setAttribute("href", "#");
        let badge = tile.querySelector(".locked");
        if (!badge) { badge = document.createElement("div"); badge.className = "locked"; badge.textContent = "🔒 Sign in"; tile.appendChild(badge); }
        badge.style.display = "inline-block";
      } else {
        tile.classList.remove("disabled");
        const subjectMap = {
          "Basic Accounting": "basic_accounting",
          "Business Law": "business_law",
          "Economics": "economics",
          "Communication Skills": "comm_skills"
        };
        const title = (tile.querySelector(".title")?.textContent || "").trim();
        const subj  = subjectMap[title];
        if (subj) tile.setAttribute("href", `./quiz.html?level=atswa1&subject=${subj}`);
        const badge = tile.querySelector(".locked");
        if (badge) badge.style.display = "none";
      }
    });
  }

  function lockAdminTile(lock) {
    if (!adminTile) return;
    let badge = adminTile.querySelector(".locked");
    if (!badge) { badge = document.createElement("div"); badge.className = "locked"; badge.textContent = "🔒 Admin only"; adminTile.appendChild(badge); }
    if (lock) {
      adminTile.classList.add("disabled");
      adminTile.setAttribute("href", "#");
      badge.style.display = "inline-block";
    } else {
      adminTile.classList.remove("disabled");
      adminTile.setAttribute("href", "./admin.html");
      badge.style.display = "none";
    }
  }

  // default state ASAP
  hide(signOutBtn);
  lockAuthRequiredTiles(true);
  lockAdminTile(true);

  // clicks
  if (signInBtn) {
    signInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).catch((err) => {
        console.error("[app.js] signInWithPopup:", err);
        alert("Google sign-in failed: " + (err?.message || err));
      });
    });
  }
  if (signOutBtn) {
    signOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      firebase.auth().signOut().catch((err) => {
        console.error("[app.js] signOut:", err);
        alert("Sign-out failed: " + (err?.message || err));
      });
    });
  }

  // reflect auth state
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setText(statusPill, `Signed in as ${user.email || ""}`);
      hide(signInBtn); show(signOutBtn);
      lockAuthRequiredTiles(false);
      const isAdmin = user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      lockAdminTile(!isAdmin);

      if (statusCard) {
        statusCard.innerHTML = `
          <p class="muted">Built by fellow accounting student <strong>Silva Brutus (NSUK)</strong>.
            Contact: <a href="mailto:offixcialbloger@gmail.com">offixcialbloger@gmail.com</a></p>
          <h2>Welcome</h2>
          <p>You are signed in, ${user.email || "user"}. Quizzes, leaderboard, and resources are unlocked ✅.</p>
        `;
      }
    } else {
      setText(statusPill, "Not signed in");
      show(signInBtn); hide(signOutBtn);
      lockAuthRequiredTiles(true);
      lockAdminTile(true);

      if (statusCard) {
        statusCard.innerHTML = `
          <p class="muted">Built by fellow accounting student <strong>Silva Brutus (NSUK)</strong>.
            Contact: <a href="mailto:offixcialbloger@gmail.com">offixcialbloger@gmail.com</a></p>
          <h2>Welcome</h2>
          <p>Please sign in to unlock quizzes, leaderboard and your personalized status.</p>
        `;
      }
    }
  });
})();