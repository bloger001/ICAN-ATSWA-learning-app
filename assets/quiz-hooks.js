// assets/quiz-hooks.js — call these from your quiz engine
(function(){
  if (!window.firebase || !firebase.firestore || !firebase.auth) {
    console.warn("[quiz-hooks] Firebase not available yet.");
    return;
  }

  const db = firebase.firestore();

  async function saveQuizResult({ level, subject, score, total }) {
    const user = firebase.auth().currentUser;
    if (!user) return; // require sign-in before quiz
    const now = firebase.firestore.FieldValue.serverTimestamp();

    // public leaderboard
    await db.collection("leaderboard").add({
      uid: user.uid,
      email: user.email || null,
      level, subject, score, total,
      ts: now
    });

    // private per-user results
    await db.collection("users").doc(user.uid)
      .collection("results")
      .add({ level, subject, score, total, ts: now });
  }

  async function saveMistake({ qid, subject, chosen, correct }) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const now = firebase.firestore.FieldValue.serverTimestamp();

    await db.collection("users").doc(user.uid)
      .collection("mistakes")
      .add({ qid, subject, chosen, correct, ts: now });
  }

  // expose
  window.quizStorage = { saveQuizResult, saveMistake };
})();
