// Simple Firestore reader for recent attempts
const msg  = document.getElementById("boardMsg");
const host = document.getElementById("board");

function row(r){
  const d = r.ts?.toDate ? r.ts.toDate() : new Date();
  const when = d.toLocaleString();
  const who = (r.user?.name || r.user?.email || "Anonymous");
  const pct = (typeof r.pct === "number") ? r.pct : Math.round((r.correct||0)*100/(r.total||1));
  return `
    <div class="row" style="padding:.4rem 0;border-bottom:1px solid #26302d">
      <div><strong>${who}</strong></div>
      <div class="muted small">${when} · ${r.level?.toUpperCase()} → ${r.subject||"-"}</div>
      <div><strong>${pct}%</strong> (${r.correct}/${r.total})</div>
    </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  try{
    // wait for firebase ready (our firebase.js sets this)
    if (window.__fbReady) { await window.__fbReady; }
    const db = window.AppDB || window.firebaseDB; // compat
    if (!db){ throw new Error("Firestore not ready"); }

    const snap = await db.collection("leaderboard")
      .orderBy("ts","desc").limit(50).get();

    if (snap.empty){
      host.innerHTML = `<p class="muted">No scores yet.</p>`;
      return;
    }
    host.innerHTML = Array.from(snap.docs).map(d=>row(d.data())).join("");
  }catch(e){
    console.error(e);
    msg.textContent = `Could not load leaderboard (rules or network): ${e.message||e}`;
  }
});