// assets/leaderboard.js
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
    .orderBy("ts", "desc")
    .limit(50)
    .onSnapshot((snap)=>{
      const rows = [];
      snap.forEach(d=>rows.push(d.data()));
      render(rows);
    }, (err)=>{
      console.error("leaderboard read:", err);
      el.innerHTML = `<p class="empty">Error loading leaderboard: ${err.message||err}</p>`;
    });
})();