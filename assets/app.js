// assets/app.js — resilient UI state wiring for auth changes
(function () {
  if (!window.firebase || !firebase.auth) {
    console.warn("[app.js] Firebase Auth not available; UI will stay in signed-out state.");
    return;
  }

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const statusPill  = $("#userStatus");
  const signInBtn   = $("#btnGoogle");       // correct id in your HTML
  const signOutBtn  = $("#signOutBtn");
  const statusCard  = document.querySelector(".card"); // welcome card
  const authTiles   = $$(".requires-auth");

  function setText(el, text) { if (el) el.textContent = text; }
  function show(el)         { if (el) el.style.display = "inline-block"; }
  function hide(el)         { if (el) el.style.display = "none"; }
  function setAriaDisabled(el, v) { if (el) el.setAttribute("aria-disabled", String(v)); }

  function lockAuthRequiredTiles(lock) {
    authTiles.forEach((tile) => {
      if (lock) {
        tile.classList.add("disabled");
        let badge = tile.querySelector(".locked");
        if (!badge) { badge = document.createElement("div"); badge.className = "locked"; badge.textContent = "🔒 Sign in"; tile.appendChild(badge); }
        badge.style.display = "inline-block";
      } else {
        tile.classList.remove("disabled");
        const badge = tile.querySelector(".locked");
        if (badge) badge.style.display = "none";
      }
    });
  }

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setText(statusPill, `Signed in as ${user.email || ""}`);
      hide(signInBtn); show(signOutBtn);
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
      show(signInBtn); hide(signOutBtn);
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
    setAriaDisabled(signInBtn, false);
  });
})();