(function(){
  const $ = (q,el=document)=>el.querySelector(q);
  const { db } = window.ICAN.firebase;

  async function loadBoard(){
    const msg = $('#boardMsg'); const pane = $('#board');
    pane.innerHTML = ''; msg.textContent = 'Loading…';
    try{
      const snap = await db.collection('leaderboard')
        .orderBy('createdAt','desc').limit(50).get();
      if (snap.empty){ msg.textContent = 'No scores yet.'; return; }
      msg.textContent = '';
      const rows = [];
      snap.forEach(doc=>{
        const d = doc.data();
        const when = d.createdAt ? d.createdAt.toDate().toLocaleString() : '';
        rows.push(`<div class="card" style="margin:8px 0">
          <div class="row" style="justify-content:space-between">
            <div><b>${d.displayName||d.email||'User'}</b> • ${d.subject} (${d.level})</div>
            <div>${d.score}/${d.total}</div>
          </div>
          <div class="muted small">${when}</div>
        </div>`);
      });
      pane.innerHTML = rows.join('');
    }catch(e){
      console.error(e);
      msg.innerHTML = `<div class="bad">Could not load leaderboard (rules or network): ${e.code||e.message}</div>`;
    }
  }
  document.addEventListener('ican:firebaseReady', loadBoard);
  if (window.ICAN && window.ICAN.firebase) loadBoard();
})();