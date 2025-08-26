// assets/app.js — resilient UI state wiring for auth changes

(function () {
  // Guard in case Firebase didn't load for some reason
  if (!window.firebase || !firebase.auth) {
    console.warn("[app.js] Firebase Auth not available; UI will stay in signed-out state.");
    return;
  }

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Elements (may be null; we guard every use)
  const statusPill  = $("#userStatus");          // top-right pill
  const signInBtn   = $("#btnGoogle");           // correct id (was googleBtn before)
  const signOutBtn  = $("#signOutBtn");
  const statusCard  = document.querySelector(".card"); // first welcome card
  const authTiles   = $$(".requires-auth");      // only tiles that need auth

  function setText(el, text) { if (el) el.textContent = text; }
  function show(el)         { if (el) el.style.display = "inline-block"; }
  function hide(el)         { if (el) el.style.display = "none"; }
  function setAriaDisabled(el, v) { if (el) el.setAttribute("aria-disabled", String(v)); }

  function lockAuthRequiredTiles(lock) {
    authTiles.forEach((tile) => {
      if (lock) {
        tile.classList.add("disabled");
        let lockBadge = tile.querySelector(".locked");
        if (!lockBadge) {
          lockBadge = document.createElement("div");
          lockBadge.className = "locked";
          lockBadge.textContent = "🔒 Sign in";
          tile.appendChild(lockBadge);
        }
        lockBadge.style.display = "inline-block";
      } else {
        tile.classList.remove("disabled");
        const lockBadge = tile.querySelector(".locked");
        if (lockBadge) lockBadge.style.display = "none";
      }
    });
  }

  // Reflect auth state into UI
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setText(statusPill, `Signed in as ${user.email || ""}`);
      hide(signInBtn);
      show(signOutBtn);
      lockAuthRequiredTiles(false);

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
      show(signInBtn);
      hide(signOutBtn);
      lockAuthRequiredTiles(true);

      if (statusCard) {
        statusCard.innerHTML = `
          <p class="muted">Built by fellow accounting student <strong>Silva Brutus (NSUK)</strong>.
            Contact: <a href="mailto:offixcialbloger@gmail.com">offixcialbloger@gmail.com</a></p>
          <h2>Welcome</h2>
          <p>Please sign in to unlock quizzes, leaderboard and your personalized status.</p>
        `;
      }
    }

    // Make sure the sign-in button isn't stuck "disabled" visually
    setAriaDisabled(signInBtn, false);
  });
})();