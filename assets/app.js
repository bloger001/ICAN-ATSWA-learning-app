// app.js — auth wiring + helpers used across pages
let currentUser = null;

function setText(el, text) { if (el) el.textContent = text; }
function show(el, vis) { if (el) el.style.display = vis ? "" : "none"; }

// Require auth on “locked” links/buttons
window.requireAuth = function () {
  if (!currentUser) {
    window.location.href = "./index.html#signin-required";
    return false;
  }
  return true;
};

// Get query params
window.qp = new Proxy(new URLSearchParams(location.search), {
  get: (sp, key) => sp.get(key)
});

document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("userStatus");
  const signInBtn = document.getElementById("googleSignIn");
  const signOutBtn = document.getElementById("googleSignOut");

  firebaseReady.then(() => {
    // Auth state
    firebaseAuth.onAuthStateChanged((user) => {
      currentUser = user || null;

      if (currentUser) {
        setText(statusEl, `Signed in as ${currentUser.email}`);
        show(signInBtn, false);
        show(signOutBtn, true);
        localStorage.setItem("ican_user", JSON.stringify({
          uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName || ""
        }));
      } else {
        setText(statusEl, "Not signed in");
        show(signInBtn, true);
        show(signOutBtn, false);
        localStorage.removeItem("ican_user");
      }

      // Toggle auth-required tiles
      document.querySelectorAll(".require-auth").forEach(a => {
        a.classList.toggle("disabled", !currentUser);
      });
    });

    // Sign in
    if (signInBtn) {
      signInBtn.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebaseAuth.signInWithPopup(provider).catch(err => {
          alert("Sign-in failed: " + err.message);
        });
      });
    }

    // Sign out
    if (signOutBtn) {
      signOutBtn.addEventListener("click", () => {
        firebaseAuth.signOut().catch(err => alert("Sign-out failed: " + err.message));
      });
    }
  });
});