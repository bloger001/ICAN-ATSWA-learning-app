// assets/firebase.js — shared Firebase init (auth + firestore)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
  authDomain: "ican-kit-prep.firebaseapp.com",
  projectId: "ican-kit-prep",
  storageBucket: "ican-kit-prep.firebasestorage.app",
  messagingSenderId: "354385037521",
  appId: "1:354385037521:web:f3a7265f66983942581df0",
  measurementId: "G-LN8E2R4B7X"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
