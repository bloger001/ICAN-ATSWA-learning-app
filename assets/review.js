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
function loadAll(){
  try{ return JSON.parse(localStorage.getItem(localKey())) || []; }
  catch{ return []; }
}

const root = document.getElementById('mistakes');

function card(m){
  const opts = (m.options||[]).map((o,idx)=>{
    const tag = (idx===m.answer_index) ? '✅' : (idx===m.chosen_index ? '❌' : '•');
    return `<div class="muted small" style="padding:.15rem 0">${tag} ${o}</div>`;
  }).join("");

  return `
  <div class="row" style="padding:.6rem 0;border-bottom:1px solid #26302d">
    <div class="muted small">${m.topic || "-"}</div>
    <div><strong>${m.stem || m.question || '(no text)'}</strong></div>
    <div style="margin-top:.35rem">${opts}</div>
  </div>`;
}

function render(){
  const rows = loadAll();
  const mistakes = rows.flatMap(r => (r.mistakes||[]));
  if (!mistakes.length){
    root.innerHTML = `<p class="muted">No mistakes to review 🎉</p>`;
    return;
  }
  root.innerHTML = mistakes.map(card).join("");
}

document.addEventListener('DOMContentLoaded', render);