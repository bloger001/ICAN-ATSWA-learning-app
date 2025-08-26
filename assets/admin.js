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
  const statusCard  = document.querySelector(".card");          // welcome card (first)
  const authTiles   = $$(".requires-auth");                     // tiles that need auth
  const adminTile   = $("#adminTile");                          // Admin dashboard tile

  // helpers
  const setText = (el, text) => { if (el) el.textContent = text; };
  const show    = (el, disp="inline-block") => { if (el) el.style.display = disp; };
  const hide    = (el) => { if (el) el.style.display = "none"; };
  const setAria = (el, v) => { if (el) el.setAttribute("aria-disabled", String(v)); };

  function lockAuthRequiredTiles(lock) {
    authTiles.forEach((tile) => {
      if (lock) {
        tile.classList.add("disabled");
        let badge = tile.querySelector(".locked");
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "locked";
          badge.textContent = "🔒 Sign in";
          tile.appendChild(badge);
        }
        badge.style.display = "inline-block";
      } else {
        tile.classList.remove("disabled");
        const badge = tile.querySelector(".locked");
        if (badge) badge.style.display = "none";
      }
    });
  }

  function lockAdminTile(lock) {
    if (!adminTile) return;
    const badge = adminTile.querySelector(".locked") || (function(){
      const b = document.createElement("div");
      b.className = "locked";
      b.textContent = "🔒 Admin only";
      adminTile.appendChild(b);
      return b;
    })();

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

  // attach button handlers (this was missing before)
  if (signInBtn) {
    signInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (signInBtn.getAttribute("aria-disabled") === "true") return;
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

  // reflect auth state into the index UI
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setText(statusPill, `Signed in as ${user.email || ""}`);
      hide(signInBtn); show(signOutBtn);
      setAria(signInBtn, false);

      lockAuthRequiredTiles(false);
      lockAdminTile(!(user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? true : false);

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
      setAria(signInBtn, false);        // ensure button is clickable

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