// app.js — handles login/logout and shows user info

import { auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileEl = document.getElementById('profile');

// Login with Google
if (loginBtn) {
  loginBtn.onclick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Save slim user locally
      localStorage.setItem('ican.user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));
      location.href = 'index.html'; // reload home after login
    } catch (err) {
      console.error('Login failed', err);
      alert('Login failed: ' + err.message);
    }
  };
}

// Logout
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);
    localStorage.removeItem('ican.user');
    location.href = 'index.html';
  };
}

// Show current user state
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (profileEl) {
      profileEl.innerHTML = `
        <div class="pill mono">Signed in as ${user.displayName || user.email}</div>
      `;
    }
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = '';
  } else {
    if (profileEl) {
      profileEl.innerHTML = `<div class="pill mono">Not signed in</div>`;
    }
    if (loginBtn) loginBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
});