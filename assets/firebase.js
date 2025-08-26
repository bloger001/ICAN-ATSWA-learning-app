// firebase.js — one-time bootstrap shared by all pages
(function () {
  // Your project config (from your message)
  window.firebaseConfig = {
    apiKey: "AIzaSyBRGM431CHZ3UMUHIc4Q-S1aGDMfrbu7Gs",
    authDomain: "ican-kit-prep.firebaseapp.com",
    projectId: "ican-kit-prep",
    storageBucket: "ican-kit-prep.firebasestorage.app",
    messagingSenderId: "354385037521",
    appId: "1:354385037521:web:f3a7265f66983942581df0",
    measurementId: "G-LN8E2R4B7X"
  };

  if (!firebase || !window.firebaseConfig) {
    console.error("Firebase SDK or config missing");
    return;
  }

  const app = firebase.apps.length
    ? firebase.app()
    : firebase.initializeApp(window.firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();

  // Expose globals
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDB = db;

  // Simple ready promise used by other scripts
  window.firebaseReady = Promise.resolve(true);
})();