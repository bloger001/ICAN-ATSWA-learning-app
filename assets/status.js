// status.js — reads local attempts and shows analytics
const summaryEl = document.getElementById('summary');
const topicsEl  = document.getElementById('topics');

function getUserSlim(){
  try{
    const u = (window.AppAuth && window.AppAuth.currentUser) || null;
    if (!u) return null;
    return { uid: u.uid, email: u.email || "", name: u.displayName || "" };
  }catch{ return null; }
}

function localKey(){
  const u = getUserSlim();
  return `ican.results:${(u && u.uid) || 'guest'}`;
}

function loadLocal(){
  try{ return JSON.parse(localStorage.getItem(localKey())) || []; }
  catch{ return []; }
}

function renderSummary(rows){
  if (!rows.length){
    summaryEl.innerHTML = `<p class="muted">No attempts yet. Take a quiz to see your stats.</p>`;
    return;
  }
  const last = rows[0];
  const best = rows.reduce((m,r)=>Math.max(m, r.pct||0), 0);
  const avg  = Math.round(rows.reduce((s,r)=>s+(r.pct||0),0)/rows.length);

  summaryEl.innerHTML = `
    <div class="row" style="gap:16px">
      <div><strong>Total attempts:</strong> ${rows.length}</div>
      <div><strong>Best:</strong> ${best}%</div>
      <div><strong>Average:</strong> ${avg}%</div>
      <div><strong>Last:</strong> ${last.pct}% · ${new Date(last.ts).toLocaleString()}</div>
    </div>`;
}

function renderWeakTopics(rows){
  // collect mistakes and count by topic
  const counts = new Map();
  for (const r of rows){
    (r.mistakes||[]).forEach(m=>{
      const key = m.topic || 'General';
      counts.set(key, (counts.get(key)||0) + 1);
    });
  }
  if (!counts.size){
    topicsEl.innerHTML = `<p class="muted">No weak topics yet. Great job! 🎉</p>`;
    return;
  }
  const sorted = [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  topicsEl.innerHTML = sorted.map(([t,n])=>`
    <div class="row" style="padding:.35rem 0;border-bottom:1px solid #26302d">
      <div>${t}</div>
      <div class="muted small">${n} mistake${n>1?'s':''}</div>
    </div>`).join("");
}

document.addEventListener('DOMContentLoaded', ()=>{
  const rows = loadLocal();
  renderSummary(rows);
  renderWeakTopics(rows);
});