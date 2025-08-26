const msg = document.getElementById("boardMsg");
const host = document.getElementById("board");

function row(r){
  const d = r.ts?.toDate ? r.ts.toDate() : new Date();
  const when = d.toLocaleString();
  return `<div class="row">
    <div><strong>${r.user?.name || r.user?.email || "Anonymous"}</strong></div>
    <div class="muted small">${when} • ${r.level?.toUpperCase()} • ${r.subject?.replace("_"," ")}</div>
    <div><strong>${r.pct}%</strong> (${r.correct}/${r.total})</div>
  </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  firebaseReady.then(async ()=>{
    try{
      const snap = await firebaseDB.collection("leaderboard")
        .orderBy("ts","desc").limit(50).get();
      if (snap.empty){ host.innerHTML = `<p class="muted">No scores yet.</p>`; return; }
      host.innerHTML = Array.from(snap.docs).map(d=>row(d.data())).join("");
    }catch(e){
      msg.textContent = `Could not load leaderboard (rules or network): ${e.code || e.message}`;
    }
  });
});