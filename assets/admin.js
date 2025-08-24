// assets/admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
  authDomain: "ican-kit-prep.firebaseapp.com",
  projectId: "ican-kit-prep",
  storageBucket: "ican-kit-prep.firebasestorage.app",
  messagingSenderId: "354385037521",
  appId: "1:354385037521:web:f3a7265f66983942581df0",
  measurementId: "G-LN8E2R4B7X"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Config
const ADMIN_EMAIL = "offixcialbloger@gmail.com";
const ADMIN_CODE  = "FT24ACC245";

// DOM
const statusBadge = document.getElementById("statusBadge");
const codeBox     = document.getElementById("codeBox");
const verifyBtn   = document.getElementById("verifyBtn");
const codeInput   = document.getElementById("adminCode");
const adminArea   = document.getElementById("adminArea");
const adminName   = document.getElementById("adminName");
const errMsg      = document.getElementById("errMsg");

let user = null;

// Watch login state
onAuthStateChanged(auth, (u) => {
  if (u) {
    user = u;
    if (u.email === ADMIN_EMAIL) {
      statusBadge.textContent = "Signed in as Admin Gmail";
      statusBadge.className = "pill";
      codeBox.style.display = "block"; // show code entry
    } else {
      statusBadge.textContent = `Signed in as ${u.email}`;
      statusBadge.className = "pill muted";
      codeBox.style.display = "none";
      errMsg.style.display = "block";
      errMsg.textContent = "This account is not allowed.";
    }
  } else {
    statusBadge.textContent = "Not signed in";
    statusBadge.className = "pill muted";
    codeBox.style.display = "none";
  }
});

// Verify code
verifyBtn?.addEventListener("click", () => {
  if (!user || user.email !== ADMIN_EMAIL) {
    errMsg.style.display = "block";
    errMsg.textContent = "Sign in with the admin Gmail first.";
    return;
  }
  if (codeInput.value.trim() !== ADMIN_CODE) {
    errMsg.style.display = "block";
    errMsg.textContent = "Invalid access code.";
    return;
  }

  // Success
  codeBox.style.display = "none";
  adminArea.style.display = "block";
  adminName.textContent = user.displayName || user.email;
});