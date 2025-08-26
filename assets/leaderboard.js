// assets/leaderboard.js — no composite index required
(function(){
  if (!window.firebase || !firebase.firestore) {
    document.getElementById('board').innerHTML = '<p class="empty">Firestore not available.</p>';
    return;
  }
  const db = firebase.firestore();
  const el = document.getElementById('board');

  function render(rows){
    if (!rows.length){
      el.innerHTML = '<p class="empty">No scores yet. Be the first to take a quiz!</p>';
      return;
    }
    const trs = rows.map((r,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${r.email ? r.email.split('@')[0] : 'anon'}</td>
        <td>${r.level || '-'}</td>
        <td>${r.subject || '-'}</td>
        <td>${r.score ?? '-'}/${r.total ?? '-'}</td>
        <td>${r.ts ? new Date(r.ts.toDate ? r.ts.toDate() : r.ts).toLocaleString() : '-'}</td>
      </tr>`).join('');
    el.innerHTML = `
      <table>
        <thead><tr><th>#</th><th>User</th><th>Level</th><th>Subject</th><th>Score</th><th>When</th></tr></thead>
        <tbody>${trs}</tbody>
      </table>`;
  }

  db.collection("leaderboard")
    .orderBy("score", "desc")
    .limit(50)
    .onSnapshot((snap)=>{
      const rows = [];
      snap.forEach(d=>rows.push(d.data()));
      // tie-break by ts (client-side)
      rows.sort((a,b)=>{
        if ((b.score??0)!==(a.score??0)) return (b.score??0)-(a.score??0);
        const tb = b.ts?.toMillis ? b.ts.toMillis() : (b.ts?+new Date(b.ts):0);
        const ta = a.ts?.toMillis ? a.ts.toMillis() : (a.ts?+new Date(a.ts):0);
        return tb - ta;
      });
      render(rows);
    }, (err)=>{
      console.error("leaderboard read:", err);
      el.innerHTML = `<p class="empty">Error loading leaderboard: ${err.message||err}</p>`;
    });
})();